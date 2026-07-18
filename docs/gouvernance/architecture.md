# Architecture — le sens et la taille des fichiers

> Index : explique et justifie les 2 garde-fous structurels du projet — la taille des fichiers, et le sens des dépendances entre domaines. À lire avant de créer un fichier, de le faire grossir, ou de faire dépendre un domaine d'un autre.

## Pourquoi
Un fichier de 800 lignes qui mélange plusieurs responsabilités est plus difficile à modifier sans casser autre chose ailleurs — pour un agent IA comme pour un humain. Un fichier court et mono-responsabilité se relit entièrement avant chaque changement, ce qui réduit le risque de régression silencieuse.

## Règle 1 — un fichier, une responsabilité
- Cible : 150 à 200 lignes. Plafond dur : 300.
- Un fichier qui dépasse ce seuil fait probablement plusieurs choses : découpe-le par responsabilité, pas arbitrairement au milieu.
- ✅ **Déjà en place dans ce projet** : hook `PostToolUse` (`.claude/settings.json`) qui lance `node scripts/check-sizes.mjs` après chaque Edit/Write. Un hook est déterministe : contrairement à une règle dans CLAUDE.md — que l'agent peut perdre de vue — il s'exécute à chaque fois, sans exception. Vérification manuelle : `npm run check:sizes`.

## Règle 2 — rangement par domaine de sens, jamais par couche technique fourre-tout
- ✅ **Déjà en place** : les 5 domaines du projet (`identite` / `montage` / `audio` / `rendu` / `assets`) sont définis dans `CLAUDE.md` avec leur emplacement.
- Un dossier de domaine peut recevoir son propre `CLAUDE.md` (ex. `src/theme/CLAUDE.md`) : Claude Code le charge automatiquement, mais seulement quand il touche un fichier de ce dossier — la charge à la demande, appliquée au code.

## Règle 3 — le sens des dépendances ne s'inverse jamais
La logique métier ne doit jamais importer un détail technique. L'inverse est permis : les détails techniques s'adaptent à la logique métier, jamais le contraire.
- Dans ce projet : `src/theme/` (le cœur identitaire) n'importe JAMAIS depuis `scenes/`, `components/`, `hero/`.
- ✅ **Déjà en place** : garanti par ESLint — un import dans le mauvais sens fait échouer `npm run lint`.
- Pourquoi : changer un détail technique demain (autre bibliothèque d'animation, autre pipeline de rendu) ne doit toucher qu'un seul endroit — jamais la logique du domaine.
