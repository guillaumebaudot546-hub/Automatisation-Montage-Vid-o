# 017 — Une capsule depuis un prompt est une AUTRE classe de vidéo

**Date :** 2026-08-02 · **Statut :** Actif · **Complète :** 005, 013, 014, 016

## Contexte

La vidéo FBE du 02/08 a été produite sans rush : un prompt en entrée, une
composition HyperFrames en sortie. C'est la première d'une classe que la
doctrine ne couvrait pas.

Trois constats à ce moment-là :

1. **Aucun garde-fou ne s'appliquait.** `portail-doctrine.mjs` juge un
   `plan.json` — spans, crossfades, couverture des sous-titres — tous dérivés
   d'une transcription. Sans rush, rien à juger. Et `guard-portail.mjs`, corrigé
   la veille, laisse passer tout rendu sans `plan.json`. Cette vidéo est donc
   partie **sans le moindre contrôle**.
2. **L'agent a écrit le HTML à la main** — la faute exacte qui a coûté
   4,35 M de jetons le 30/07 (decision 016).
3. Les règles 0, 1 et 3bis de `montage-imcp` (voix jamais hachée, lire la
   transcription, montrer le praticien) **présupposent toutes un rush**. Les
   plaquer sur une capsule générée n'a aucun sens.

## Décision

**Deux classes de vidéo, deux contrats, deux portails, un seul verrou.**

| Entrée | Doctrine | Contrat | Portail |
|---|---|---|---|
| Rush du praticien | `montage-imcp` | `plan.json` | `portail-doctrine.mjs` |
| Prompt / texte | `capsule-prompt` | `capsule.json` | `portail-capsule.mjs` |

`guard-portail.mjs` reconnaît les deux contrats et refuse le rendu tant que
celui qui s'applique n'a pas de reçu valide. Une composition sans aucun des
deux reste une composition écrite à la main : rien à valider, on passe.

## Ce que le portail capsule juge

Ce qui casse réellement une vidéo **muette**, pas ce qui casse un montage :

1. **La lisibilité** — `mots ÷ (durée − animation d'entrée)`. Confort ≤ 3,2
   mots/s, rejet au-delà de 4,5. C'est le contrôle central : dans une capsule
   muette, un texte qu'on n'a pas le temps de lire est le premier défaut.
2. **Le débordement** — une ligne de titre > 62 caractères passe à la ligne et
   casse le masque d'animation.
3. **La licence musicale** — rejet si absente. La règle non négociable devient
   du code au lieu de dépendre d'une relecture humaine.
4. **La charte** — `src/theme/<nom>.ts` doit exister. Un praticien = un thème.
5. **Le format vs le réseau** — RÈGLE 5bis réutilisée telle quelle.

## Ce que le builder garantit

`capsule-build.mjs` génère `index.html` depuis `capsule.json` + le socle
`_socle/capsule.template.html`. L'agent ne produit que 2 Ko de JSON.

- **La charte n'est jamais écrite dans une composition** : elle est lue dans
  `src/theme/`, source unique (RÈGLE 4bis).
- **Le balisage est restreint** — `**mot**` → cyan (RÈGLE 2), `*mot*` →
  italique. Tout le reste est échappé : l'agent ne peut pas injecter de HTML.
- **Le vocabulaire de blocs est fermé** — 8 types. Un type inconnu est rejeté.
  Étendre le vocabulaire se fait dans le socle, jamais dans une vidéo.
- `capsule:check` détecte toute édition à la main d'un `index.html` généré et
  bloque `npm run check`.

C'est la decision 005 appliquée à la lettre : l'IA décide QUOI, le code décide
COMMENT.

## Conséquences vérifiées le 02/08/2026

- Portail testé sur la vidéo FBE : **rejette la piste `Clinical_Grace.mp3`**
  faute de licence, et signale la scène 3 à 3,6 mots/s.
- Contrôle de lisibilité rejoué sur les durées de la v2 livrée (123 s) :
  scènes 1, 3 et 9 signalées entre 3,6 et 4,2 mots/s. **La v2 était trop dense
  à lire** — le portail l'aurait dit avant le rendu.
- Chaîne complète testée depuis le dossier de la vidéo : portail 3 → rendu
  bloqué 2 ; avec licence, portail 0 → reçu écrit.
- `hyperframes check` sur la composition générée : 0 erreur,
  **50/50 contrôles de contraste WCAG AA**.
- Bug corrigé au passage : `capsule-build` et `portail-capsule` résolvaient
  `src/theme/` et le socle **relativement au dossier de travail**. Hermes lance
  ses commandes depuis le dossier de la vidéo — les deux échouaient. La racine
  est désormais déduite de l'emplacement du script.

## Ce qui reste ouvert

- La vidéo FBE utilise la charte `baudot` alors qu'elle est destinée au
  **Dr Robert Fromental**. Il manque `src/theme/fromental.ts`.
- 8 blocs couvrent le contenu scientifique. Un contenu qui n'y entre pas doit
  remonter à Guillaume, pas être bricolé dans une vidéo.
