#!/bin/sh
# Wrapper du portail doctrine, deploye sur le VPS en /usr/local/bin/portail-doctrine.
#
# Pourquoi : portail-doctrine.mjs lit praticiens/<nom>.json en chemin RELATIF, donc
# il n'est correct que lance depuis la racine du projet. Un agent qui l'appelle
# depuis un dossier de travail quelconque obtiendrait une erreur de fichier
# introuvable et croirait le portail casse.
#
# Ce wrapper fixe le repertoire, MAIS il doit d'abord rendre absolus les chemins
# donnes relativement au dossier d'appel : sinon « portail-doctrine plan.json »
# lance depuis le dossier d'une video cherche le plan a la racine du projet, ou
# il n'est pas. C'est le meme piege, deplace d'un cran.
#
# Usage : portail-doctrine <plan.json> [cues.json] [--praticien baudot]
# Sortie : 0 = le plan passe · 3 = rejet · 1 = erreur d'usage
#
# ATTENTION AUX FINS DE LIGNE. Ce fichier est edite sous Windows et deploye sur
# Linux. En CRLF, le shebang devient « #!/bin/sh<CR> » : le noyau cherche un
# interpreteur nomme /bin/sh<CR> et repond « No such file or directory » sur un
# fichier pourtant present et executable. Deployer en convertissant :
#     sed 's/\r$//' portail-doctrine-wrapper.sh > /usr/local/bin/portail-doctrine
set -e

DEPART="$(pwd)"
RACINE="${IMCP_RACINE:-/home/guillaume/imcp}"

# Rend absolu tout argument qui designe un fichier existant dans le dossier
# d'appel. Les options (--praticien, baudot, ...) passent inchangees.
ARGS=""
for a in "$@"; do
  case "$a" in
    -* | /*) ARGS="$ARGS \"$a\"" ;;
    *)
      if [ -e "$DEPART/$a" ]; then
        ARGS="$ARGS \"$DEPART/$a\""
      else
        ARGS="$ARGS \"$a\""
      fi
      ;;
  esac
done

cd "$RACINE" || {
  echo "portail-doctrine : racine projet introuvable ($RACINE)" >&2
  exit 1
}

eval "exec node scripts/portail-doctrine.mjs $ARGS"
