#!/bin/sh
# Wrapper du portail doctrine, deploye sur le VPS en /usr/local/bin/portail-doctrine.
#
# Pourquoi : portail-doctrine.mjs lit praticiens/<nom>.json en chemin RELATIF, donc
# il n'est correct que lance depuis la racine du projet. Un agent qui l'appelle
# depuis un dossier de travail quelconque obtiendrait une erreur de fichier
# introuvable et croirait le portail casse. Ce wrapper fixe le repertoire.
#
# Usage : portail-doctrine <plan.json> [cues.json] [--praticien baudot]
# Sortie : 0 = le plan passe · 3 = rejet · 1 = erreur d'usage
set -e
RACINE="${IMCP_RACINE:-/home/guillaume/imcp}"
cd "$RACINE" || {
  echo "portail-doctrine : racine projet introuvable ($RACINE)" >&2
  exit 1
}
exec node scripts/portail-doctrine.mjs "$@"
