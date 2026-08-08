# 020 — Le fichier testé est celui qui tourne

**Date :** 2026-08-05 · **Statut :** Actif · **Suite de :** 006, 017, 019

## Contexte

Symptôme rapporté : « des modifications cassent du code ailleurs ». L'hypothèse
de départ était des fichiers trop gros, modifiés trop souvent.

L'audit a mesuré. **Les deux hypothèses sont fausses :**

- **Aucun god file.** Zéro fichier de code au-dessus du plafond dur de 300
  lignes. Le plus gros, `scripts/capsule-build.mjs`, tient en 282.
- **Aucun churn.** Sur l'historique complet — 29 commits, du 22/06 au 05/08 —
  le fichier le plus modifié l'a été **4 fois**. La distribution est plate :
  rien n'est à la fois gros et chaud.

La cause était ailleurs, et plus grave : **du code de production que rien ne
testait, doublé par du code testé que rien n'exécutait.**

`portail-doctrine` existait en deux exemplaires. `src/lib/portail-doctrine.ts`
recevait les 22 tests et n'a jamais été déployé. `scripts/portail-doctrine.mjs`
tourne sur le VPS et n'était couvert par rien. Les deux avaient **déjà
divergé** : l'écriture du reçu et la sortie en code 3 — c'est-à-dire la moitié
du verrou de la RÈGLE 5 — n'existaient que dans la version non testée.

Le reste du constat : **19 scripts sur 20 sans aucun test**, dont les cinq qui
décident si un rendu part et ce qu'il coûte. Sur les cinq incidents de
production de la semaine, **quatre étaient dans du code non testé**.

Et un sixième garde-fou, `~/.hermes/agent-hooks/portail.py`, vivait
**uniquement sur le VPS** : hors dépôt, hors sauvegarde, hors déploiement, hors
test. C'est lui qui traduit le refus de `guard-portail.mjs` en
`{"decision":"block"}` — la seule forme qu'Hermes honore, puisqu'un code de
sortie non nul y « log a warning but never aborts the agent loop ». Reconstruire
la machine l'aurait fait disparaître et le verrou du portail serait redevenu
décoratif, **en silence**.

## Décision

**Un garde-fou non testé n'est pas un garde-fou.** Concrètement :

1. **Une seule implémentation par règle.** `scripts/portail-doctrine.mjs` est la
   source unique : règles exportées, CLI derrière une garde d'appel direct
   (idiome déjà en place dans `guard-portail.mjs`). Le jumeau TypeScript est
   supprimé ; ses tests de schéma praticien survivent dans
   `src/lib/praticien.test.ts`.
2. **Les six garde-fous de production ont des tests** — `portail-doctrine`,
   `portail-capsule`, `capsule-build`, `guard-portail`, `guard-render`,
   `hook-budget`, `hook-portail`. Les tests lancent le vrai script, avec ses
   vrais codes de sortie, pas une réimplémentation.
3. **Tout ce qui tourne en production est dans le dépôt et dans
   `deploy-vps.sh`.** `hook-portail.py` y entre, sauvegarde et ré-approbation
   d'allowlist comprises.
4. **Le sens des dépendances couvre tout `src/`**, en 4 couches, au lieu des 2
   fichiers de `src/theme/`.

## Vérification

- 54 tests → **132**. `npm run check` vert.
- **Vérifié par mutation** : casser un code de sortie, un seuil ou une sonde
  fait désormais échouer un test. La sonde `powershell`-only de `guard-render`
  — le bug réel du 01/08, qui ne protégeait rien sous Linux — est attrapée.
- Déploiement VPS vérifié de bout en bout : blocage réel, laissez-passer réel,
  `hooks doctor` sain, les deux hooks ré-approuvés après copie.

## Conséquence

La dérive de `mtime` est désormais gérée pour **les deux** hooks. En oublier un
le rendrait muet sans rien casser de visible — le pire mode de panne pour un
verrou, et exactement ce qui s'est produit cette semaine.

## Ce qui reste

- `imcp-hyperframes/sutures/index.html` — 692 lignes pour un plafond dur de 700.
  Remède : extraction en blocs, pas découpage.
- La copie `~/Automatisation-Montage-Vid-o` est morte (7 commits de retard, sans
  les scripts de capsule). Elle induit en erreur : à supprimer ou à resynchroniser.
