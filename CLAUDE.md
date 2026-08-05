# CLAUDE.md — Vidéo IMCP / Dr Baudot

> Index pour Claude Code : lis ce fichier en entier au démarrage — il est volontairement court.
> Les fichiers ci-dessous ne sont PAS préchargés : va les lire quand le sujet devient pertinent, pas avant.

| Fichier | À lire quand... |
|---|---|
| `decisions/014-hyperframes-moteur-officiel.md` | **AVANT tout montage** — quel moteur, et pourquoi |
| `decisions/015-hermes-orchestrateur.md` | **AVANT de toucher au service cloud** — Hermes orchestre, pas de bot maison |
| `REPRISE.md` | **tu arrives sur une machine neuve** — où est quoi, quoi installer, ce qui reste |
| `deploiement/hermes-vps-runbook.md` | tu déploies ou administres le VPS (10 phases, sourcé) |
| `deploiement/AGENTS-vps.md` | tu changes les règles permanentes de l'agent Hermes (à redéployer sur le VPS) |
| `.claude/skills/montage-imcp/SKILL.md` | tu montes une vidéo **à partir d'un rush** (doctrine) |
| `.claude/skills/capsule-prompt/SKILL.md` | tu génères une vidéo **à partir d'un prompt** (decision 017) |
| `praticiens/client-01.json` | tu montes pour le Dr Baudot : préférences, corrections passées, exemples validés |
| `docs/gouvernance/architecture.md` | tu crées, déplaces ou fais grossir un fichier |
| `docs/gouvernance/verification.md` | une tâche semble terminée, avant de la déclarer finie |
| `docs/gouvernance/memoire-decisions.md` | tu prends une décision technique qui engage la suite |
| `docs/gouvernance/cycles-sessions.md` | tu ouvres ou tu t'apprêtes à clore une session |
| `docs/gouvernance/sous-agents.md` | une tâche est bruyante (recherche) ou doit être vérifiée par un regard neuf |
| `decisions/README.md` | AVANT toute reprise — index des 14 décisions |
| `SESSION-PRD.md` | ⚠️ décrit l'état Remotion au 17/07, **pas** la production HyperFrames actuelle |

## Identité
- Projet : production vidéo pour le Dr Baudot / IMCP — cible : service cloud
  automatisé (Telegram → montage IA → validation praticien), voir `decisions/`.
- **Moteur : HyperFrames** (`imcp-hyperframes/`) — decision 014.
  **Remotion (`src/`) est en maintenance** : on y corrige, on n'y construit plus.
- Utilisateur : **Guillaume, non-développeur** — tout passe par l'IA. Explique
  chaque action en langage simple avant de l'exécuter ; quand tu modifies, dis
  ce que tu fais et pourquoi.
- On **enrichit l'existant**, on ne repart jamais de zéro.

## Les 5 domaines de sens
Chaque chose appartient à UN domaine. On range par domaine, pas par type technique.

| Domaine     | Rôle                                  | Où ça vit                                              |
|-------------|---------------------------------------|--------------------------------------------------------|
| `identite`  | Cœur : palette, typo, branding        | `src/theme/` — **source de vérité des deux moteurs**   |
| `montage`   | Compositions, timeline, rythme        | `imcp-hyperframes/` (actif) · `src/scenes/`, `src/capsule/`, `src/lib/timing.ts` (maintenance) |
| `audio`     | Voix off, musique, effets sonores     | `public/music/`, `public/sfx/`, `_sources-bruts/ElevenLabs/` |
| `rendu`     | Export, formats, ratios               | `hyperframes render` · `remotion.config.ts`, `scripts/` |
| `assets`    | Médias bruts (laser, instruments, personne) | `public/`, `IMCP - IA/`, `_sources-bruts/`        |

## Commandes (à ne jamais deviner)
- **Tout vérifier : `npm run check`** (lint + tests + tailles + charte)
- Tests : `npm run test`
- Lint + sens des dépendances : `npm run lint`
- Taille des fichiers (src/ ET compositions HyperFrames) : `npm run check:sizes`
- **Charte couleur des compositions : `npm run check:charte`**
- **Polices hors du HTML : `npm run fonts:check`** (extraction : `npm run fonts:extract`)
- **Capsule depuis un prompt** (decision 017) — l'agent n'écrit JAMAIS de HTML :
  `npm run portail:capsule -- <projet>` → `npm run capsule:build <projet>` →
  `npm run check` dans le dossier → rendu. Dérive : `npm run capsule:check`.
- Studio Remotion (maintenance) : `npm run dev`
- Montage HyperFrames : passer par le routeur `/hyperframes`, jamais à la main
- Aperçu / rendu d'une composition : `npm run dev` / `npm run render` **dans son dossier**

## Règles non négociables
- **Un fichier, une responsabilité.** `src/` : cible 150-200 lignes, plafond dur 300.
  Compositions HyperFrames : seuils 400/700 — c'est un HTML mono-fichier par
  conception, le remède est l'extraction en blocs, pas le découpage. Garanti par
  le hook `check-sizes` (bloquant, exit 2).
- **Le cœur ne dépend pas des détails** — `src/theme/` n'importe JAMAIS depuis
  `scenes/`, `components/`, `hero/`. Garanti par ESLint (`architecture.md`).
- **La charte est verrouillée.** Toute couleur vient de `src/theme/client-01.ts`.
  Accent = cyan `#49B6C9`. Le beige `#d8c7a8` est l'ancien accent remplacé par le
  client : le retrouver est un bug. `npm run check:charte`.
- **Aucune musique sous droits.** Défaut : `music/ambient-bed.wav` (synthétisé).
  Toute autre piste exige une preuve de licence. Un renommage de fichier ne
  règle rien — c'est exactement comme ça que du Saint-Preux s'est retrouvé sur
  GitHub (decision 014).
- **Jamais deux rendus en parallèle** — conflit de cache. Appliqué par le hook
  `guard-render`.
- **Rien n'est « terminé » sur impression.** Une tâche n'est close que si elle
  passe la Definition of Done. Toujours montrer la preuve (sortie de commande),
  jamais juste l'affirmer (`verification.md`).
- **Toute décision structurante s'écrit** dans `decisions/` (un fichier par
  décision, README-index) — pas seulement dans la conversation. *Cette règle n'a
  pas résisté au basculement vers HyperFrames : 11 jours de production sans une
  ligne écrite. C'est le mode de défaillance à surveiller.*
- **Une session, un objectif.** Après 2 corrections ratées sur le même point :
  `/clear` et reformule, ne t'entête pas. Note de clôture avant de fermer.
- **Recherche bruyante = sous-agent** (`sous-agents.md`).
  Agents disponibles : `segment-spike`, `relecteur-adversarial`.

## Workflow imposé
1. Explorer / comprendre avant de modifier.
2. Faire UN changement à la fois.
3. Relancer `npm run check` après le changement.
4. Si rouge → réparer avant d'aller plus loin.

## Rituel de mémoire (source unique)
- Décision qui engage la suite → `decisions/` **au moment où elle est prise**.
- Correction du praticien → `praticiens/<client>.json` : la correction datée, la
  préférence mise à jour, ET le segment ajouté à `exemplesValides`. Les trois,
  sinon la boucle n'est pas bouclée (doctrine, RÈGLE 6).
- Clôture de session → `docs/journal/sessions.md`.
- **Jamais en double** — `AGENTS.md` n'est qu'un pointeur vers ici.

## Compaction
Si le contexte est résumé automatiquement, conserve toujours : la liste des
fichiers modifiés, les commandes de vérification, et les décisions
d'architecture en cours.
