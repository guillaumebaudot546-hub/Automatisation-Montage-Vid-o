# CLAUDE.md — Vidéo promo IMCP / DentalSynthesis

## Qui je suis
Guillaume, **non-développeur**. Je construis ce projet via l'IA, je ne code pas moi-même.
Explique-moi tout en langage simple, pas de jargon. Quand tu modifies, dis ce que tu fais et pourquoi.

## Ce que fait le projet
Vidéo **promotionnelle de formation médicale (dentaire)**, rendu **épuré / premium / orienté conversion**.
Outil : **Remotion** (la vidéo est faite en code React/TypeScript, donc versionnable et testable).
On **enrichit la vidéo existante**, on ne repart jamais de zéro.

## Les 5 domaines de sens
Chaque chose appartient à UN domaine. On range par domaine, pas par type technique.

| Domaine     | Rôle                                  | Où ça vit                                              |
|-------------|---------------------------------------|--------------------------------------------------------|
| `identite`  | Cœur : palette, typo, branding        | `src/theme/`                                           |
| `montage`   | Timeline, scènes, rythme, durées      | `src/scenes/`, `src/Composition.tsx`, `src/lib/timing.ts` |
| `audio`     | Voix off, musique, effets sonores     | `src/components/Sfx.tsx`, `public/` (voiceover/sfx), `_sources-bruts/ElevenLabs/` |
| `rendu`     | Export, formats, ratios               | `remotion.config.ts`, `scripts/`                       |
| `assets`    | Médias bruts (laser, instruments, personne) | `public/`, `IMCP - IA/`, `_sources-bruts/` (médias non encore intégrés) |

## RÈGLE NON-NÉGOCIABLE : un fichier = une seule job
- Un fichier ne fait **qu'une seule chose**.
- **Cible : 150–200 lignes.** On découpe **à 300 lignes** (limite dure).
- Si un fichier grossit, on le **coupe en morceaux** avant d'ajouter du neuf.
- Vérifier à tout moment : `npm run check:sizes` (vert = OK, rouge = un fichier trop gros).
- Note : `src/hero/HeroLoop.tsx` (573 l.) dépasse déjà — à découper en priorité.

## RÈGLE de dépendance : le cœur ne dépend pas des détails
- `src/theme/` (identité = le cœur) **ne doit JAMAIS importer** depuis `scenes/`, `components/`, `hero/`.
- Sens autorisé : les scènes/composants utilisent le thème. **Jamais l'inverse.**
- Garanti par ESLint — un import dans le mauvais sens fait échouer `npm run lint`.

## Le filet de sécurité (tests)
- Lancer après CHAQUE modif importante : **`npm run test`**
- **Vert** = tout tient. **Rouge** = quelque chose est cassé, ne pas continuer avant que ce soit vert.
- Les tests vivent à côté du code testé, en `*.test.ts`.

## Commandes utiles
- `npm run dev` — ouvrir le studio Remotion (aperçu live)
- `npm run test` — lancer le filet de sécurité
- `npm run check:sizes` — vérifier qu'aucun fichier ne dépasse 300 lignes
- `npm run lint` — vérifier le code + le sens des dépendances
- `npm run build` — fabriquer la vidéo finale

## Workflow imposé
1. Explorer / comprendre avant de modifier.
2. Faire UN changement à la fois.
3. Relancer `npm run test` et `npm run check:sizes` après le changement.
4. Si rouge → réparer avant d'aller plus loin.
