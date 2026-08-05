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
- Dans ce projet, `src/` est en **4 couches**. Une couche n'importe jamais d'une couche au-dessus d'elle :

  | Couche | Contenu | Peut importer |
  |---|---|---|
  | 0 | `theme/` — identité : palette, typo | rien |
  | 1 | `lib/` — logique pure, schémas | 0 |
  | 2 | `components/` — briques d'interface | 0, 1 |
  | 3 | `scenes/` `hero/` `clinical/` `capsule/` — compositions | 0, 1, 2, et entre elles |
  | 4 | `Root.tsx` `Composition.tsx` — assemblage | tout ; **personne ne l'importe** |

- Les compositions de la couche 3 peuvent s'appeler entre elles (`capsule/` réutilise déjà des blocs de `clinical/`) : c'est du partage entre pairs, pas une inversion.
- ✅ **Déjà en place** : garanti par ESLint — un import dans le mauvais sens fait échouer `npm run lint`.
- *Étendu le 04/08/2026.* La règle ne couvrait que `src/theme/`, soit 2 fichiers sur 70 : juste, mais symbolique. Les 68 autres n'avaient aucune contrainte de sens.
- Pourquoi : changer un détail technique demain (autre bibliothèque d'animation, autre pipeline de rendu) ne doit toucher qu'un seul endroit — jamais la logique du domaine.
