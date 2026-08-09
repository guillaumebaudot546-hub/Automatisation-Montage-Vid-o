#!/usr/bin/env bash
# Compare la doctrine du depot a celle que l'agent Hermes lit sur le VPS.
#
# POURQUOI CE SCRIPT EXISTE (audit du 09/08/2026).
#
# On croyait la doctrine synchronisee parce que les scripts l'etaient. Un audit
# manuel a trouve quatre ecarts qu'aucun controle ne voyait :
#
#   1. la skill de montage sur le VPS envoyait vers `src/theme/baudot.ts` —
#      un fichier qui n'existe pas. La charte, source de verite du projet,
#      pointait dans le vide ;
#   2. les .md partaient en CRLF depuis Windows : toute comparaison repondait
#      « les 260 lignes different », ce qui rendait la vraie difference
#      invisible. C'est ce bruit qui a laisse vivre le point 1 ;
#   3. `decisions/` etait absent du VPS alors que deux skills y renvoient ;
#   4. `scripts/make_music.py` etait cite par une skill et absent.
#
# Un ecart de doctrine ne se voit pas au rendu : la video sort, elle est juste
# montee selon d'autres regles. C'est le pire mode de defaillance — silencieux.
#
#   ./scripts/parite-vps.sh          0 = parite · 1 = ecart
set -u

VPS="${IMCP_VPS:-guillaume@78.47.14.178}"
REPO="${IMCP_VPS_REPO:-/home/guillaume/imcp}"
HERMES="${IMCP_VPS_HERMES:-/home/guillaume/.hermes}"
ecarts=0

# Empreinte insensible aux fins de ligne : sinon un simple CRLF ferait crier
# toutes les lignes, et le bruit masquerait le signal (voir raison n°2).
empreinte_locale() { tr -d '\r' < "$1" 2>/dev/null | md5sum | cut -c1-12; }

compare() { # <chemin local> <chemin distant> <etiquette>
  local L R
  L=$(empreinte_locale "$1")
  R=$(ssh -o ConnectTimeout=10 "$VPS" "tr -d '\r' < '$2' 2>/dev/null | md5sum | cut -c1-12")
  if [ -z "$L" ]; then
    printf '  ABSENT LOCAL  %s\n' "$3"; ecarts=$((ecarts + 1))
  elif [ -z "$R" ] || [ "$R" = "d41d8cd98f00" ]; then
    printf '  ABSENT VPS    %s\n' "$3"; ecarts=$((ecarts + 1))
  elif [ "$L" != "$R" ]; then
    printf '  DIVERGE       %s  (local %s / vps %s)\n' "$3" "$L" "$R"; ecarts=$((ecarts + 1))
  else
    printf '  ok            %s\n' "$3"
  fi
}

echo "Parite doctrine — depot ↔ $VPS"
echo
echo "Doctrine lue par l'agent :"
compare "deploiement/AGENTS-vps.md" "$HERMES/AGENTS.md" "AGENTS.md (Hermes)"
for s in capsule-prompt montage-imcp photos-vers-video description-reseaux; do
  compare ".claude/skills/$s/SKILL.md" "$HERMES/skills/video/$s/SKILL.md" "skill $s"
done

echo
echo "Socle execute :"
for f in scripts/capsule-build.mjs scripts/capsule-media.mjs scripts/charte.mjs \
         scripts/portail-capsule.mjs scripts/portail-doctrine.mjs \
         scripts/guard-portail.mjs scripts/guard-render.mjs \
         imcp-hyperframes/_socle/capsule.template.html \
         praticiens/client-01.json src/theme/client-01.ts \
         musique/CATALOGUE.json; do
  compare "$f" "$REPO/$f" "$f"
done

# Un chemin cite par la doctrine et absent du VPS est une impasse : l'agent
# suit la consigne et tombe sur rien. C'est ce qui est arrive avec baudot.ts.
echo
echo "Chemins cites par la doctrine :"
cites=$(grep -ohE '(decisions|praticiens|src/theme|scripts|imcp-hyperframes)/[A-Za-z0-9_./-]+' \
          .claude/skills/*/SKILL.md deploiement/AGENTS-vps.md 2>/dev/null \
        | grep -v '<' | sort -u)
for c in $cites; do
  if ssh -o ConnectTimeout=10 "$VPS" "[ -e '$REPO/$c' ]"; then
    printf '  ok            %s\n' "$c"
  else
    printf '  IMPASSE VPS   %s  (cite par la doctrine, absent du VPS)\n' "$c"
    ecarts=$((ecarts + 1))
  fi
done

echo
if [ "$ecarts" -eq 0 ]; then
  echo "✅ Parite complete — l'agent lit exactement la doctrine du depot."
  exit 0
fi
echo "❌ $ecarts ecart(s). L'agent ne travaille pas sur la meme doctrine que toi."
exit 1
