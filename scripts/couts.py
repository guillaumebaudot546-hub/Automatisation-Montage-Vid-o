#!/usr/bin/env python3
"""Relève la consommation de jetons d'Hermes. Sur le VPS :

    python3 scripts/couts.py              # toutes les sessions
    python3 scripts/couts.py --session X  # une session
    python3 scripts/couts.py --json       # sortie machine

POURQUOI CE SCRIPT EXISTE (decision 018).
L'audit du 03/08 a conclu « attribution raisonnée, pas mesure » — alors que la
donnée était dans `~/.hermes/state.db`, table `session_model_usage`, depuis le
début. Hermes compte les jetons ; il ne les montrait simplement à personne.

Preuve que la table est fiable : sa ligne `claude-opus-4-8` du 30/07 affiche
6,912509 $ — au centime près le 6,91 $ relevé à la main et publié dans la
proposition commerciale.

CE QUE LE SCRIPT AJOUTE À LA TABLE BRUTE
1. La décomposition écriture / relecture / sortie, qui dit OÙ part l'argent.
2. Le contexte moyen par appel : c'est lui qui explique tout le reste.
3. Le recalcul au tarif standard, parce que le tarif d'introduction de
   Sonnet 5 (2 $/10 $) s'arrête le 31/08/2026 et que la facture augmente
   alors de 50 % à comportement inchangé.
"""
import argparse, json, os, sqlite3, sys

DB = os.path.expanduser("~/.hermes/state.db")

# $/million de jetons. `intro` court jusqu'au 31/08/2026 pour Sonnet 5.
TARIFS = {
    "claude-sonnet-5":       {"intro": (2, 10), "standard": (3, 15)},
    "claude-opus-4-8":       {"intro": (5, 25), "standard": (5, 25)},
    "claude-opus-5":         {"intro": (5, 25), "standard": (5, 25)},
    "claude-haiku-4-5":      {"intro": (1, 5),  "standard": (1, 5)},
}
MULT_ECRITURE_CACHE = 1.25   # TTL 5 min. Passer à 2.0 si le TTL 1 h s'applique.
MULT_LECTURE_CACHE = 0.10


def tarif(modele, bareme):
    for cle, v in TARIFS.items():
        if modele.startswith(cle):
            return v[bareme]
    return (3, 15)  # défaut prudent


def cout(l, bareme):
    p_in, p_out = tarif(l["model"], bareme)
    return {
        "entree":    l["input_tokens"] / 1e6 * p_in,
        "sortie":    l["output_tokens"] / 1e6 * p_out,
        "cache_lu":  l["cache_read_tokens"] / 1e6 * p_in * MULT_LECTURE_CACHE,
        "cache_ecrit": l["cache_write_tokens"] / 1e6 * p_in * MULT_ECRITURE_CACHE,
    }


def lignes(session=None):
    if not os.path.exists(DB):
        sys.exit(f"❌ {DB} introuvable — ce script tourne sur le VPS Hermes.")
    c = sqlite3.connect(f"file:{DB}?mode=ro", uri=True)
    c.row_factory = sqlite3.Row
    q = "SELECT * FROM session_model_usage"
    p = ()
    if session:
        q += " WHERE session_id LIKE ?"
        p = (f"%{session}%",)
    out = [dict(r) for r in c.execute(q + " ORDER BY cache_read_tokens DESC", p)]
    c.close()
    return [l for l in out if (l["api_call_count"] or 0) > 0]


def euro(x):
    return f"{x:6.2f} $"


def rapport(ls):
    if not ls:
        print("Aucune consommation enregistrée.")
        return
    tot = {"appels": 0, "cout": 0.0, "std": 0.0, "jetons": 0}
    print(f"{'SESSION':<26} {'MODÈLE':<18} {'APPELS':>7} {'CONTEXTE/APPEL':>15} {'COÛT':>9} {'AU STD':>9}")
    print("─" * 90)
    for l in ls:
        d = cout(l, "intro")
        ds = cout(l, "standard")
        c, cs = sum(d.values()), sum(ds.values())
        n = l["api_call_count"] or 1
        ctx = (l["cache_read_tokens"] + l["input_tokens"]) // n
        jetons = sum(l[k] or 0 for k in
                     ("input_tokens", "output_tokens", "cache_read_tokens", "cache_write_tokens"))
        tache = f" [{l['task']}]" if l.get("task") else ""
        print(f"{l['session_id'][:24]:<26} {l['model'][:17]:<18} {n:>7} {ctx:>15,} {euro(c):>9} {euro(cs):>9}{tache}")
        tot["appels"] += n; tot["cout"] += c; tot["std"] += cs; tot["jetons"] += jetons
    print("─" * 90)
    print(f"{'TOTAL':<26} {'':<18} {tot['appels']:>7} {'':>15} {euro(tot['cout']):>9} {euro(tot['std']):>9}")
    print(f"\n  {tot['jetons']:,} jetons au total")

    # Où part l'argent, tous modèles confondus.
    agg = {k: 0.0 for k in ("entree", "sortie", "cache_lu", "cache_ecrit")}
    for l in ls:
        for k, v in cout(l, "intro").items():
            agg[k] += v
    t = sum(agg.values()) or 1
    print("\n  Où part l'argent")
    libelles = {"cache_ecrit": "Écriture du cache", "cache_lu": "Relecture du cache",
                "sortie": "Texte généré", "entree": "Entrée non cachée"}
    for k, v in sorted(agg.items(), key=lambda x: -x[1]):
        barre = "█" * round(v / t * 40)
        print(f"    {libelles[k]:<20} {euro(v)}  {v/t*100:5.1f} %  {barre}")

    pire = max(ls, key=lambda l: (l["cache_read_tokens"] + l["input_tokens"]) // (l["api_call_count"] or 1))
    ctx = (pire["cache_read_tokens"] + pire["input_tokens"]) // (pire["api_call_count"] or 1)
    print(f"\n  Contexte le plus lourd : {ctx:,} jetons/appel — session {pire['session_id'][:24]}")
    if ctx > 60_000:
        print("    ⚠️  Au-delà de 60 000 jetons par appel, la session est trop chargée.")
        print("       Une vidéo = une session neuve (AGENTS.md, RÈGLE E).")
    if tot["std"] > tot["cout"] * 1.2:
        print(f"\n  ⚠️  Tarif d'introduction Sonnet 5 jusqu'au 31/08/2026.")
        print(f"      Au tarif standard, ce même usage coûterait {euro(tot['std'])} (+{(tot['std']/tot['cout']-1)*100:.0f} %).")


if __name__ == "__main__":
    a = argparse.ArgumentParser(description="Consommation de jetons d'Hermes.")
    a.add_argument("--session")
    a.add_argument("--json", action="store_true")
    args = a.parse_args()
    ls = lignes(args.session)
    if args.json:
        print(json.dumps([{**l, "cout_intro_usd": sum(cout(l, "intro").values()),
                           "cout_standard_usd": sum(cout(l, "standard").values())} for l in ls],
                         ensure_ascii=False, indent=2))
    else:
        rapport(ls)
