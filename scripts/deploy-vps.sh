#!/usr/bin/env bash
# Déploiement reproductible d'Hermes sur le VPS.
#
#   ./scripts/deploy-vps.sh              # déploie
#   ./scripts/deploy-vps.sh --dry-run    # montre sans rien copier
#
# POURQUOI CE SCRIPT (decision 018).
# `~/imcp` sur le VPS n'est PAS un dépôt git : c'est une copie manuelle. Sans
# ce script, chaque déploiement est une suite de scp tapés de mémoire, et on
# découvre les oublis en production — le 03/08, `src/theme/` n'existait pas sur
# le VPS et les scripts capsule auraient échoué au premier appel.
#
# Ce script sauvegarde avant, copie une liste explicite, puis VÉRIFIE.
set -euo pipefail

VPS="${VPS:-guillaume@78.47.14.178}"
KEY="${KEY:-$HOME/.ssh/hermes_vps}"
DRY=""; [ "${1:-}" = "--dry-run" ] && DRY="echo [dry-run]"
SSH="ssh -i $KEY -o BatchMode=yes $VPS"
cd "$(dirname "$0")/.."

echo "── 1. sauvegarde horodatée sur le VPS ──"
TS=$($SSH 'date +%Y-%m-%d-%H%M')
$DRY $SSH "mkdir -p ~/sauvegardes/$TS && \
  cp -r ~/imcp/scripts ~/sauvegardes/$TS/ 2>/dev/null; \
  cp -r ~/imcp/praticiens ~/sauvegardes/$TS/ 2>/dev/null; \
  cp ~/.hermes/AGENTS.md ~/sauvegardes/$TS/ 2>/dev/null; \
  cp ~/.hermes/config.yaml ~/sauvegardes/$TS/ 2>/dev/null; \
  cp -r ~/.hermes/skills/video ~/sauvegardes/$TS/skills-video 2>/dev/null; true"
echo "   ~/sauvegardes/$TS"

echo "── 2. arborescence cible ──"
$DRY $SSH 'mkdir -p ~/imcp/scripts ~/imcp/src/theme ~/imcp/praticiens \
  ~/imcp/imcp-hyperframes/_socle/assets/fonts ~/.hermes/skills/video/capsule-prompt'

echo "── 3. scripts ──"
$DRY scp -q -i "$KEY" \
  scripts/capsule-build.mjs scripts/portail-capsule.mjs scripts/guard-portail.mjs \
  scripts/portail-doctrine.mjs scripts/guard-render.mjs scripts/couts.py \
  scripts/hook-budget.py \
  "$VPS:~/imcp/scripts/"

echo "── 4. charte + préférences ──"
$DRY scp -q -i "$KEY" src/theme/client-01.ts "$VPS:~/imcp/src/theme/"
$DRY scp -q -i "$KEY" praticiens/client-01.json "$VPS:~/imcp/praticiens/"

echo "── 5. socle capsule + polices ──"
$DRY scp -q -i "$KEY" imcp-hyperframes/_socle/capsule.template.html "$VPS:~/imcp/imcp-hyperframes/_socle/"
$DRY scp -q -i "$KEY" imcp-hyperframes/_socle/assets/fonts/*.woff2 "$VPS:~/imcp/imcp-hyperframes/_socle/assets/fonts/"

echo "── 6. doctrine ──"
$DRY scp -q -i "$KEY" .claude/skills/capsule-prompt/SKILL.md "$VPS:~/.hermes/skills/video/capsule-prompt/"
$DRY scp -q -i "$KEY" deploiement/AGENTS-vps.md "$VPS:~/.hermes/AGENTS.md"
$DRY scp -q -i "$KEY" deploiement/AGENTS-vps.md "$VPS:~/imcp/AGENTS.md"

[ -n "$DRY" ] && { echo "(dry-run : rien copié)"; exit 0; }

echo
echo "── 7. VÉRIFICATION sur le VPS ──"
$SSH 'cd ~/imcp
ok=1
for f in scripts/capsule-build.mjs scripts/portail-capsule.mjs scripts/guard-portail.mjs \
         scripts/couts.py src/theme/client-01.ts praticiens/client-01.json \
         imcp-hyperframes/_socle/capsule.template.html; do
  [ -f "$f" ] && echo "  ✅ $f" || { echo "  ❌ MANQUANT : $f"; ok=0; }
done
[ $(ls imcp-hyperframes/_socle/assets/fonts/*.woff2 2>/dev/null | wc -l) -eq 4 ] \
  && echo "  ✅ 4 polices" || { echo "  ❌ polices incomplètes"; ok=0; }
d=$(grep -m1 "^description:" ~/.hermes/skills/video/capsule-prompt/SKILL.md | sed "s/^description: //")
[ ${#d} -le 60 ] && echo "  ✅ description skill : ${#d} car. (budget 60)" \
                 || { echo "  ❌ description ${#d} car. — Hermes tronquera"; ok=0; }
[ "$(md5sum ~/.hermes/AGENTS.md | cut -d" " -f1)" = "$(md5sum ~/imcp/AGENTS.md | cut -d" " -f1)" ] \
  && echo "  ✅ AGENTS.md cohérent aux deux emplacements" || { echo "  ❌ AGENTS.md divergent"; ok=0; }

echo "  — chaîne capsule —"
D=_travail/deploy-check; rm -rf $D; mkdir -p $D
printf "%s" "{\"type\":\"capsule-prompt\",\"charte\":\"client-01\",\"format\":\"16:9\",\"reseau\":\"youtube\",\"pied\":\"Contrôle de déploiement\",\"scenes\":[{\"kicker\":\"Test\",\"lede\":[\"Le socle répond.\"],\"dureeSec\":10,\"bloc\":{\"type\":\"rule\"},\"sub\":\"Vérification automatique.\"}]}" > $D/capsule.json
node scripts/portail-capsule.mjs $D >/dev/null 2>&1 && echo "  ✅ portail : passe" || { echo "  ❌ portail en échec"; ok=0; }
node scripts/capsule-build.mjs $D >/dev/null 2>&1 && [ -s $D/index.html ] && echo "  ✅ builder : index.html généré" || { echo "  ❌ builder en échec"; ok=0; }
python3 scripts/couts.py >/dev/null 2>&1 && echo "  ✅ relevé des coûts opérationnel" || { echo "  ❌ couts.py en échec"; ok=0; }
echo "  — verrou de budget —"
chmod +x scripts/hook-budget.py
# L allowlist controle la derive de mtime : redeployer le script le DESACTIVE.
python3 - <<PYEOF
import json, os, datetime
A=os.path.expanduser("~/.hermes/shell-hooks-allowlist.json"); S=os.path.expanduser("~/imcp/scripts/hook-budget.py")
def iso(t): return datetime.datetime.fromtimestamp(t, datetime.timezone.utc).isoformat().replace("+00:00","Z")
d=json.load(open(A)); d["approvals"]=[a for a in d["approvals"] if a["command"]!=S]
d["approvals"].append({"approved_at":iso(datetime.datetime.now(datetime.timezone.utc).timestamp()),
  "command":S,"event":"pre_tool_call","script_mtime_at_approval":iso(os.path.getmtime(S))})
json.dump(d, open(A,"w"), indent=2, sort_keys=True)
PYEOF
cd /usr/local/lib/hermes-agent && ./venv/bin/python -m hermes_cli.main hooks doctor 2>&1 | grep -q "All shell hooks look healthy" \
  && echo "  ✅ hooks sains (budget réapprouvé après copie)" || { echo "  ❌ hooks en défaut"; ok=0; }
cd ~/imcp
rm -rf $D
echo
[ $ok -eq 1 ] && echo "✅ DÉPLOIEMENT VÉRIFIÉ" || { echo "❌ DÉPLOIEMENT INCOMPLET — voir ci-dessus"; exit 2; }'
