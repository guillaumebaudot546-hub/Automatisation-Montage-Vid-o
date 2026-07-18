# CLAUDE.md — Vidéo promo IMCP / DentalSynthesis

> Index pour Claude Code : lis ce fichier en entier au démarrage — il est volontairement court.
> Les fichiers ci-dessous ne sont PAS préchargés : va les lire quand le sujet devient pertinent, pas avant.

| Fichier | À lire quand... |
|---|---|
| `docs/gouvernance/architecture.md` | tu crées, déplaces ou fais grossir un fichier |
| `docs/gouvernance/verification.md` | une tâche semble terminée, avant de la déclarer finie |
| `docs/gouvernance/memoire-decisions.md` | tu prends une décision technique qui engage la suite |
| `docs/gouvernance/cycles-sessions.md` | tu ouvres ou tu t'apprêtes à clore une session |
| `docs/gouvernance/sous-agents.md` | une tâche est bruyante (recherche) ou doit être vérifiée par un regard neuf |
| `decisions/README.md` | AVANT toute reprise — la cible a pivoté vers un service cloud automatisé (Telegram → montage IA → validation praticien) |
| `SESSION-PRD.md` | tu as besoin de l'état détaillé du code actuel (index en tête du fichier) |

## Identité
- Projet : production vidéo pour le Dr Baudot / IMCP — aujourd'hui montage Remotion assisté,
  cible : service cloud automatisé (voir `decisions/`).
- Stack : **Remotion** (vidéo en code React/TypeScript, versionnable et testable).
- Utilisateur : **Guillaume, non-développeur** — tout passe par l'IA. Explique chaque action
  en langage simple avant de l'exécuter ; quand tu modifies, dis ce que tu fais et pourquoi.
- On **enrichit l'existant**, on ne repart jamais de zéro.

## Les 5 domaines de sens
Chaque chose appartient à UN domaine. On range par domaine, pas par type technique.

| Domaine     | Rôle                                  | Où ça vit                                              |
|-------------|---------------------------------------|--------------------------------------------------------|
| `identite`  | Cœur : palette, typo, branding        | `src/theme/`                                           |
| `montage`   | Timeline, scènes, rythme, durées      | `src/scenes/`, `src/Composition.tsx`, `src/lib/timing.ts` |
| `audio`     | Voix off, musique, effets sonores     | `src/components/Sfx.tsx`, `public/` (voiceover/sfx), `_sources-bruts/ElevenLabs/` |
| `rendu`     | Export, formats, ratios               | `remotion.config.ts`, `scripts/`                       |
| `assets`    | Médias bruts (laser, instruments, personne) | `public/`, `IMCP - IA/`, `_sources-bruts/` (médias non encore intégrés) |

## Commandes (à ne jamais deviner)
- Tests : `npm run test`
- Lint + sens des dépendances : `npm run lint`
- Taille des fichiers : `npm run check:sizes`
- Studio (aperçu live) : `npm run dev`
- Build vidéo finale : `npm run build`

## Règles non négociables
- **Un fichier, une responsabilité** — cible 150-200 lignes, plafond dur 300. Découpe avant
  que ça déborde. Garanti par le hook `check-sizes` (déjà actif après chaque Edit/Write).
  Dette god-file réglée le 16/07/2026 : `HeroLoop.tsx` découpé en 6 modules (`architecture.md`).
- **Le cœur ne dépend pas des détails** — `src/theme/` n'importe JAMAIS depuis `scenes/`,
  `components/`, `hero/`. Garanti par ESLint (`architecture.md`).
- **Rien n'est « terminé » sur impression.** Une tâche n'est close que si elle passe la
  Definition of Done. Toujours montrer la preuve (sortie de commande), jamais juste l'affirmer.
  Pour une tâche à condition mesurable, utilise `/goal` plutôt que d'enchaîner les relances
  manuelles (`verification.md`).
- **Toute décision structurante s'écrit** dans `decisions/` (un fichier par décision,
  README-index) — pas seulement dans la conversation (`memoire-decisions.md`).
- **Une session, un objectif.** Après 2 corrections ratées sur le même point : `/clear` et
  reformule, ne t'entête pas. Note de clôture avant de fermer (`cycles-sessions.md`).
- **Recherche bruyante = sous-agent**, pour ne pas polluer la conversation principale
  (`sous-agents.md`). Agents disponibles : `segment-spike`, `relecteur-adversarial`.

## Workflow imposé
1. Explorer / comprendre avant de modifier.
2. Faire UN changement à la fois.
3. Relancer `npm run test` et `npm run check:sizes` après le changement.
4. Si rouge → réparer avant d'aller plus loin.

## Rituel de mémoire (source unique)
- Décision qui engage la suite → `decisions/` au moment où elle est prise.
- État du code → `SESSION-PRD.md`. Clôture de session → `docs/journal/sessions.md`
  (créé au premier usage). **Jamais en double** — `AGENTS.md` n'est qu'un pointeur vers ici.

## Compaction
Si le contexte est résumé automatiquement, conserve toujours : la liste des fichiers modifiés,
les commandes de vérification, et les décisions d'architecture en cours.
