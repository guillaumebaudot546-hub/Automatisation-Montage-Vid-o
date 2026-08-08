#!/usr/bin/env python3
"""Adaptateur entre le protocole de hook d'Hermes et guard-portail.mjs.

POURQUOI CE FICHIER EXISTE.

guard-portail.mjs a ete ecrit pour Claude Code, qui bloque un outil quand le
hook sort en code 2. Hermes ne fonctionne pas comme ca : sa documentation dit
« Malformed JSON, non-zero exit codes, and timeouts log a warning but never
abort the agent loop ». Autrement dit, branche tel quel sur Hermes, le
garde-fou aurait ecrit son refus dans les logs et le rendu serait parti quand
meme — exactement la panne silencieuse du 01/08/2026, ou le verrou etait
absent et personne ne s'en est apercu avant livraison au praticien.

Hermes bloque sur du JSON en sortie standard :
    {"decision": "block", "reason": "..."}

Ce script fait la traduction, et rien d'autre.

POLITIQUE EN CAS DE PANNE DU GARDE-FOU.

  - payload illisible ou commande absente  -> on laisse passer.
    On ne sait meme pas s'il s'agit d'un rendu ; bloquer bloquerait toutes les
    commandes du terminal.
  - le garde-fou repond « refuse » (code 2) -> on bloque.
  - le garde-fou repond « passe » (code 0)  -> on laisse passer.
  - le garde-fou est introuvable ou plante  -> on bloque UNIQUEMENT si la
    commande ressemble a un rendu. Un verrou casse ne doit pas geler tout le
    poste de travail, mais il ne doit pas non plus laisser filer le seul geste
    qu'il est charge de surveiller.

Toute decision est tracee dans ~/.hermes/logs/guard-portail.log : un verrou
dont on ne peut pas verifier l'action est un verrou en lequel on ne peut pas
avoir confiance.
"""

import json
import os
import re
import subprocess
import sys
from datetime import datetime, timezone

GARDE = os.environ.get(
    "IMCP_GUARD_PORTAIL", "/home/guillaume/imcp/scripts/guard-portail.mjs"
)
JOURNAL = os.path.expanduser("~/.hermes/logs/guard-portail.log")

# Meme motif que guard-portail.mjs, pour decider quoi faire si le garde-fou
# lui-meme est hors service.
EST_UN_RENDU = re.compile(r"\b(remotion|hyperframes)\b[^|;&]*\brender\b", re.I)

DELAI_MAX_S = 20


def trace(decision, detail):
    try:
        os.makedirs(os.path.dirname(JOURNAL), exist_ok=True)
        horodatage = datetime.now(timezone.utc).isoformat(timespec="seconds")
        with open(JOURNAL, "a", encoding="utf-8") as f:
            f.write(f"{horodatage} {decision} {detail}\n")
    except Exception:
        pass  # le journal ne doit jamais faire echouer la decision


def passe(motif=""):
    trace("PASSE", motif)
    print("{}")
    sys.exit(0)


def bloque(raison, motif=""):
    trace("BLOQUE", motif)
    print(json.dumps({"decision": "block", "reason": raison}, ensure_ascii=False))
    sys.exit(0)


def main():
    try:
        brut = sys.stdin.read()
        charge = json.loads(brut) if brut.strip() else {}
    except Exception:
        passe("payload illisible")
        return

    entree = charge.get("tool_input") or {}
    commande = (entree.get("command") or "").strip() if isinstance(entree, dict) else ""
    if not commande:
        passe("aucune commande")
        return

    # Le garde-fou cherche plan.json dans le repertoire courant du montage.
    # os.path.isdir ne suffit pas : /root est un dossier, mais illisible pour
    # l'utilisateur du service, et subprocess echoue alors sur un Errno 13
    # difficile a relier a sa cause.
    dossier = charge.get("cwd") or ""
    if not (dossier and os.path.isdir(dossier) and os.access(dossier, os.R_OK | os.X_OK)):
        replis = [os.path.dirname(GARDE), os.path.expanduser("~")]
        dossier = next(
            (d for d in replis if os.path.isdir(d) and os.access(d, os.R_OK | os.X_OK)),
            "/tmp",
        )

    if not os.path.isfile(GARDE):
        if EST_UN_RENDU.search(commande):
            bloque(
                "Le garde-fou du portail est introuvable sur cette machine "
                f"({GARDE}). Aucun rendu ne part tant qu'il n'est pas retabli.",
                "garde-fou absent + commande de rendu",
            )
        passe("garde-fou absent, commande sans rapport")
        return

    try:
        resultat = subprocess.run(
            ["node", GARDE, commande],
            cwd=dossier,
            capture_output=True,
            text=True,
            timeout=DELAI_MAX_S,
        )
    except Exception as err:
        if EST_UN_RENDU.search(commande):
            bloque(
                f"Le garde-fou du portail n'a pas pu s'executer ({err}). "
                "Par prudence, le rendu est refuse.",
                f"garde-fou en echec: {err}",
            )
        passe(f"garde-fou en echec ({err}), commande sans rapport")
        return

    if resultat.returncode == 2:
        raison = (
            resultat.stderr or resultat.stdout or "Rendu refuse par le portail doctrine."
        ).strip()
        bloque(raison, "portail: rejet")
        return

    passe(f"portail: code {resultat.returncode}")


if __name__ == "__main__":
    main()
