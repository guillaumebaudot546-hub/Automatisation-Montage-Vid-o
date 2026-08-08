#!/usr/bin/env python3
"""Verrou de budget : arrête Hermes avant que la session ne coûte cher.

POURQUOI CE FICHIER EXISTE (decision 019).

Le 03/08/2026, une capsule a coûté 8,79 $ mesurés. La décomposition
(`scripts/couts.py`) donne : écriture du cache 65 %, relecture 29 %, texte
généré 6 %. Le fautif n'est pas ce que le modèle écrit, c'est **la taille du
contexte** : 143 803 jetons par appel, et 25 881 jetons réécrits en cache à
chaque appel parce que l'historique grossissait.

La consigne « une vidéo = une session neuve » a été écrite dans AGENTS.md et
dans la skill. Elle ne suffira pas : c'est exactement le même pari que
« RENDRE SANS PORTAIL EST INTERDIT », consigne qui a été ignorée trois fois de
suite le 30/07. Une règle qui dépend de la bonne volonté de l'agent n'est pas
un garde-fou.

Ce hook lit la consommation réelle dans ~/.hermes/state.db et refuse les appels
d'outils quand la session sort du budget. L'agent garde la parole — bloquer un
outil n'empêche pas de répondre au praticien — mais il ne peut plus dépenser.

DEUX SEUILS, DEUX INTENTIONS.

  CONTEXTE_MAX  — préventif. Au-delà, chaque appel coûte trop cher AVANT même
                  d'avoir commencé. Le remède est une session neuve, pas une
                  optimisation. On bloque tôt pour que la vidéo soit faite
                  ailleurs, pas pour l'empêcher.
  BUDGET_USD    — curatif. Filet de dernier recours contre une boucle.

POLITIQUE EN CAS DE PANNE. Base illisible, table absente, session inconnue :
on LAISSE PASSER. Un verrou de budget cassé ne doit pas geler la production —
il doit se taire. Toute décision est tracée dans ~/.hermes/logs/budget.log.
"""

import json
import os
import sqlite3
import sys
from datetime import datetime, timezone

DB = os.path.expanduser("~/.hermes/state.db")
JOURNAL = os.path.expanduser("~/.hermes/logs/budget.log")

CONTEXTE_MAX = int(os.environ.get("IMCP_CONTEXTE_MAX", "60000"))
BUDGET_USD = float(os.environ.get("IMCP_BUDGET_USD", "2.00"))

# $/million de jetons. Sonnet 5 est au tarif d'introduction jusqu'au 31/08/2026 ;
# on facture au tarif STANDARD dans le calcul du budget, pour ne pas régler le
# verrou sur un prix qui va augmenter de 50 %.
TARIFS = {
    "claude-sonnet-5": (3, 15),
    "claude-opus-5": (5, 25),
    "claude-opus-4-8": (5, 25),
    "claude-haiku-4-5": (1, 5),
}
MULT_CACHE_ECRITURE = 1.25
MULT_CACHE_LECTURE = 0.10


def trace(verdict, detail):
    try:
        os.makedirs(os.path.dirname(JOURNAL), exist_ok=True)
        with open(JOURNAL, "a", encoding="utf-8") as f:
            f.write(f"{datetime.now(timezone.utc).isoformat(timespec='seconds')} "
                    f"{verdict} {detail}\n")
    except OSError:
        pass


def passe(raison):
    trace("PASSE", raison)
    print(json.dumps({"decision": "approve"}))
    sys.exit(0)


def bloque(raison):
    trace("BLOQUE", raison.replace("\n", " | ")[:200])
    print(json.dumps({"decision": "block", "reason": raison}))
    sys.exit(0)


def tarif(modele):
    for cle, v in TARIFS.items():
        if (modele or "").startswith(cle):
            return v
    return (3, 15)


def etat_session():
    """Consommation de la session la plus récemment active.

    Le payload de hook ne porte pas d'identifiant de session ; on prend donc la
    session dont l'activité est la plus fraîche. Pendant une conversation en
    cours, c'est celle-là.
    """
    c = sqlite3.connect(f"file:{DB}?mode=ro", uri=True, timeout=2.0)
    c.row_factory = sqlite3.Row
    sid = c.execute(
        "SELECT session_id FROM session_model_usage "
        "ORDER BY rowid DESC LIMIT 1"
    ).fetchone()
    if not sid:
        c.close()
        return None
    sid = sid["session_id"]

    appels = contexte = 0
    cout = 0.0
    for r in c.execute(
        "SELECT * FROM session_model_usage WHERE session_id = ?", (sid,)
    ):
        n = r["api_call_count"] or 0
        if not n:
            continue
        p_in, p_out = tarif(r["model"])
        cout += (
            (r["input_tokens"] or 0) / 1e6 * p_in
            + (r["output_tokens"] or 0) / 1e6 * p_out
            + (r["cache_read_tokens"] or 0) / 1e6 * p_in * MULT_CACHE_LECTURE
            + (r["cache_write_tokens"] or 0) / 1e6 * p_in * MULT_CACHE_ECRITURE
        )
        appels += n
        contexte = max(contexte,
                       ((r["cache_read_tokens"] or 0) + (r["input_tokens"] or 0)) // n)
    c.close()
    return {"session": sid, "appels": appels, "contexte": contexte, "cout": cout}


def main():
    try:
        brut = sys.stdin.read()
        charge = json.loads(brut) if brut.strip() else {}
    except (ValueError, OSError):
        passe("payload illisible")

    outil = charge.get("tool_name") or ""

    if not os.path.exists(DB):
        passe("state.db absent")
    try:
        e = etat_session()
    except (sqlite3.Error, OSError) as err:
        passe(f"base illisible ({type(err).__name__})")
    if not e or e["appels"] == 0:
        passe("aucune consommation enregistrée")

    court = f"{e['session'][:20]} appels={e['appels']} ctx={e['contexte']} cout={e['cout']:.2f}"

    if e["contexte"] > CONTEXTE_MAX:
        bloque(
            f"SESSION TROP CHARGÉE — {e['contexte']:,} jetons de contexte par appel "
            f"(plafond {CONTEXTE_MAX:,}).\n\n"
            "Chaque appel renvoie tout cet historique, et chaque message ajouté "
            "force une réécriture de cache facturée 1,25× l'entrée. Mesuré le "
            "03/08 : 8,79 $ pour une capsule, dont 65 % en écriture de cache.\n\n"
            "NE CONTINUE PAS ici. Dis à Guillaume, en une phrase, d'ouvrir une "
            "conversation neuve et de te redonner sa demande. Le travail sera "
            "identique et coûtera une fraction du prix.\n\n"
            f"(session {court})"
        )

    if e["cout"] > BUDGET_USD:
        bloque(
            f"BUDGET DE SESSION DÉPASSÉ — {e['cout']:.2f} $ consommés "
            f"(plafond {BUDGET_USD:.2f} $, au tarif standard).\n\n"
            "Une capsule doit coûter de l'ordre de 0,50 $. Au-delà du plafond, "
            "tu boucles ou la session est trop lourde.\n\n"
            "Arrête-toi, explique à Guillaume où tu en es et ce qui bloque. "
            "Ne relance pas la même chaîne.\n\n"
            f"(session {court}, outil demandé : {outil})"
        )

    passe(f"ok {court}")


if __name__ == "__main__":
    main()
