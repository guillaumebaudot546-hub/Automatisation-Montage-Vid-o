# 014 — HyperFrames devient le moteur de montage, Remotion passe en maintenance

**Date :** 2026-07-29 · **Statut :** Actif · **Remplace :** la RÈGLE 4 de la
doctrine `montage-imcp` (« moteur unique = CapsuleV2 »)

## Contexte

Cette décision constate un fait accompli plutôt qu'elle n'ouvre un débat. Entre
le 19 et le 28 juillet 2026, toute la production vidéo est passée à
**HyperFrames** — 13 projets, 30 rendus — pendant que la gouvernance continuait
de décrire Remotion comme le moteur unique.

Preuves relevées à l'audit du 29/07 :

| Fait | Mesure |
|---|---|
| Dernière modification de `src/` (Remotion) | 22/07 |
| Dernière modification de `imcp-hyperframes/` | 28/07 |
| Projets HyperFrames | 13 (`sutures`, `publication`, `capsule-3204`, 7 teasers, 3 `tuto-hermes`) |
| Rendus produits sous HyperFrames | 30 fichiers `.mp4` |
| Occurrences de « HyperFrames » dans `CLAUDE.md`, `decisions/`, `SPEC-PALIER-1.md`, doctrine | **0** |
| Entrées du journal de sessions depuis le 18/07 | **0** |

La capsule *sutures* a même été produite deux fois à vingt minutes d'écart, une
fois par moteur — puis Remotion a été abandonné en cours de route, sans trace
écrite.

Le coût de ce silence n'est pas théorique : parce qu'aucun document ne
mentionnait HyperFrames, aucun garde-fou ne le surveillait. Les 13 compositions
ont dérivé de la charte sans que rien ne le signale (voir « Conséquences »).

## Décision

1. **HyperFrames est le moteur de montage.** Toute nouvelle capsule, tout
   nouveau teaser, toute nouvelle publication se construit en HyperFrames.
2. **Remotion passe en maintenance.** `src/` reste versionné, testé et lintable.
   On y corrige des bugs, on n'y construit plus de nouvelles vidéos. Les
   compositions existantes (`MyComp`, `HeroLoop`, `Clinical*`, `Highlights*`,
   `CapsuleV2`) restent rendues telles quelles tant qu'un besoin existe.
3. **Aucun portage rétroactif.** On ne réécrit pas les compositions Remotion
   livrées en HyperFrames. Elles ont été livrées, elles fonctionnent.
4. **La RÈGLE 4 de la doctrine est réécrite** : « moteur unique » désignait
   CapsuleV2 ; elle désigne désormais le socle HyperFrames partagé. L'intention
   d'origine — *ne pas réécrire une composition jetable par vidéo* — est
   conservée, et se trouve précisément être ce que les 13 projets violent
   aujourd'hui.

## Pourquoi

- **HyperFrames a gagné à l'usage, pas sur le papier.** 13 projets en 9 jours
  contre 3 capsules en un mois : le cycle d'itération est plus court.
- **Le seul choix pire que HyperFrames ou Remotion, c'est les deux.** Deux
  moteurs signifient deux chartes, deux jeux de garde-fous, deux doctrines — et
  une gouvernance qui décrit celui qu'on n'utilise plus.
- **Rien de ce qui a été appris n'est perdu.** La doctrine de montage (voix
  continue, typographie qui met les propos en avant, bookend visage) est
  indépendante du moteur. Seule la RÈGLE 4 était liée à l'implémentation.

## Conséquences

### Immédiates (traitées le 29/07)

- `check-sizes` étendu à `imcp-hyperframes/`, avec un régime de seuils propre
  (400/700) : une composition HyperFrames est un HTML mono-fichier par
  conception, lui appliquer le plafond des modules TS serait un contresens.
  Le remède indiqué est l'extraction en blocs.
- Nouveau `check-charte` : il lit la palette dans `src/theme/baudot.ts` et la
  compare aux compositions HyperFrames. **46 écarts sur 13 compositions.**
  Notamment `--champagne: #d8c7a8` — l'ancien beige que le client a
  explicitement remplacé par le cyan `#49B6C9` — présent dans **les 13**.
- `guard-render` : la RÈGLE 5 interdit deux rendus simultanés depuis le début,
  rien ne l'appliquait. C'est maintenant un hook `PreToolUse` bloquant.
- La doctrine `montage-imcp` a été déplacée de `.agents/skills/` (répertoire que
  Claude Code ne lit pas) vers `.claude/skills/`, et la jonction morte
  `.claude/skills/remotion-best-practices` — qui pointait vers
  `C:\Users\Guillaume\Desktop\my-video-IMCP`, dossier supprimé — a été retirée.
  **La doctrine n'était chargée par aucun mécanisme depuis le déménagement du
  projet.**

### À trancher (non fait ici — décision de Guillaume)

- **Réharmoniser la palette des 13 compositions ?** Cela change le rendu de
  vidéos déjà livrées. `check-charte` reste en mode rapport tant que ce n'est
  pas décidé ; il passe en `--strict` dans le hook une fois l'alignement fait.
- **Purger `concerto.mp3` de l'historique git ?** Le fichier est retiré du
  suivi (voir commit `2d1c385`) mais demeure dans l'historique et sur le remote.
  La purge réécrit tout le dépôt.
- **Factoriser les 7 teasers ?** 126 lignes sur 144 sont identiques entre les
  teasers 02 à 07, le logo est dupliqué 10 fois, et trois versions de la CLI
  HyperFrames cohabitent (0.7.67, 0.7.72, 0.7.77). C'est la RÈGLE 4 —
  « pas de composition jetable » — violée à l'échelle du dossier.

### Sur le palier 1

`SPEC-PALIER-1.md` suppose `npx remotion render` et une limite Telegram de
20 Mo, alors que les rushes réels dépassent 200 Mo (`IMG_3181.mov` = 217 Mo).
Elle doit être réécrite sur HyperFrames avant toute implémentation. Le plus
petit incrément utile reste un aller-retour Telegram avec un montage **figé** —
sans IA, sans sonde, sans boucle — pour prouver la plomberie avant d'y mettre
l'intelligence.

## Note de méthode

Cette décision aurait dû être écrite le 19 juillet, au moment du basculement.
Elle ne l'a pas été, et onze jours de production se sont déroulés hors de tout
garde-fou. La règle « toute décision structurante s'écrit au moment où on la
prend » (`memoire-decisions.md`) n'a pas résisté au premier virage réel.
