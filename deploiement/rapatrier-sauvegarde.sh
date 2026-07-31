#!/usr/bin/env bash
# Rapatrie la derniere sauvegarde Hermes du VPS vers CETTE machine.
#
# « Une sauvegarde qui vit sur la machine qu'elle protege ne protege de rien »
# (SPEC-PALIER-1). Le cron du VPS produit une archive chaque nuit ; ce script
# est la moitie qui compte : la sortir du serveur.
#
# Marche sur macOS, Linux et Git Bash (Windows) — seuls ssh/scp sont requis.
#
# Usage :
#   ./rapatrier-sauvegarde.sh
#   ./rapatrier-sauvegarde.sh -d ~/Sauvegardes/hermes
#
# ATTENTION : l'archive contient .env, donc les cles d'API et le token du bot.
# Elle est ecrite en 600. Ne la deverse pas telle quelle sur un cloud partage.
set -euo pipefail

VPS_HOTE="${HERMES_VPS_HOTE:-78.47.14.178}"
VPS_USER="${HERMES_VPS_USER:-root}"
CLE="${HERMES_VPS_CLE:-$HOME/.ssh/id_ed25519}"
DEST="$HOME/Sauvegardes/hermes"
GARDER=8   # nombre d'archives conservees localement

while getopts "d:h:u:k:" opt; do
  case $opt in
    d) DEST="$OPTARG" ;;
    h) VPS_HOTE="$OPTARG" ;;
    u) VPS_USER="$OPTARG" ;;
    k) CLE="$OPTARG" ;;
    *) echo "Usage : $0 [-d dossier] [-h hote] [-u user] [-k cle_ssh]"; exit 1 ;;
  esac
done

if [ ! -f "$CLE" ]; then
  echo "Cle SSH introuvable : $CLE" >&2
  echo "Indique-la avec -k, ou via la variable HERMES_VPS_CLE." >&2
  exit 1
fi

mkdir -p "$DEST"
chmod 700 "$DEST"

echo "Recherche de la derniere sauvegarde sur $VPS_HOTE..."
DERNIERE=$(ssh -i "$CLE" -o ConnectTimeout=15 "$VPS_USER@$VPS_HOTE" \
  "ls -1t /home/guillaume/backups/hermes-*.tar.gz 2>/dev/null | head -1")

if [ -z "$DERNIERE" ]; then
  echo "Aucune sauvegarde trouvee sur le VPS." >&2
  echo "Verifie que /home/guillaume/backup-hermes.sh a bien tourne." >&2
  exit 1
fi

NOM=$(basename "$DERNIERE")

if [ -f "$DEST/$NOM" ]; then
  echo "Deja rapatriee : $NOM"
else
  echo "Telechargement de $NOM..."
  scp -i "$CLE" "$VPS_USER@$VPS_HOTE:$DERNIERE" "$DEST/"
  chmod 600 "$DEST/$NOM"
fi

# Une archive corrompue au transfert ne protege de rien : on le verifie
# maintenant, pas le jour de la restauration.
echo "Verification de l'integrite..."
if tar tzf "$DEST/$NOM" > /dev/null 2>&1; then
  echo "OK — archive lisible."
else
  echo "ECHEC — archive illisible, transfert a refaire." >&2
  rm -f "$DEST/$NOM"
  exit 1
fi

# Rotation locale.
ls -1t "$DEST"/hermes-*.tar.gz 2>/dev/null | tail -n +$((GARDER + 1)) | xargs -r rm --

echo ""
echo "Sauvegardes locales dans $DEST :"
ls -lht "$DEST"/hermes-*.tar.gz 2>/dev/null | awk '{print "  " $9 "  " $5}'
