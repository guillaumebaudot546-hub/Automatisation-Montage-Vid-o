#!/usr/bin/env bash
# Sauvegarde de ~/.hermes — la memoire complete de l'agent.
#
# Ce dossier contient la config, les secrets, l'historique des sessions, la
# memoire persistante, les profils et les skills que l'agent s'est creees
# lui-meme. Le perdre, c'est repartir de zero avec un agent amnesique.
#
# Deploye sur le VPS en /home/guillaume/backup-hermes.sh, lance chaque nuit
# par cron. Source versionnee : Deploiement Hermes IA/backup-hermes.sh
#
# ATTENTION : l'archive contient .env, donc les cles d'API et le token du bot.
# Elle est ecrite en 600 et le dossier en 700. Ne la depose jamais sur un
# stockage partage sans la chiffrer.
set -euo pipefail

DEST="$HOME/backups"
STAMP=$(date +%Y%m%d-%H%M%S)
ARCHIVE="$DEST/hermes-$STAMP.tar.gz"

mkdir -p "$DEST"
chmod 700 "$DEST"

# --exclude : caches et verrous se regenerent seuls et pesent lourd. Les
# exclure garde l'archive utile et rapide a rapatrier.
tar czf "$ARCHIVE" \
  --exclude='.hermes/audio_cache' \
  --exclude='.hermes/image_cache' \
  --exclude='.hermes/cache' \
  --exclude='.hermes/logs/*.log' \
  --exclude='*.lock' \
  -C "$HOME" .hermes

chmod 600 "$ARCHIVE"

# Ne garder que les 14 dernieres.
ls -1t "$DEST"/hermes-*.tar.gz 2>/dev/null | tail -n +15 | xargs -r rm --

TAILLE=$(du -h "$ARCHIVE" | cut -f1)
echo "$(date '+%Y-%m-%d %H:%M:%S') OK $ARCHIVE ($TAILLE)"

# Verification d'integrite : une archive illisible ne protege de rien, et on
# ne veut pas le decouvrir le jour de la restauration.
if ! tar tzf "$ARCHIVE" > /dev/null 2>&1; then
  echo "$(date '+%Y-%m-%d %H:%M:%S') ERREUR archive illisible : $ARCHIVE" >&2
  exit 1
fi
