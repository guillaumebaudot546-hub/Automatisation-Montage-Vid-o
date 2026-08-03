# PRD — Système vidéo Dr Baudot / IMCP (état de session & règles)

**Version :** 2.1 · **Date :** 2026-07-17 · **Type :** document de reprise de contexte
**Usage :** pointer ce fichier au début d'une session pour reprendre sans perte.
Ne PAS tout coller par défaut — utiliser l'index ci-dessous pour n'ouvrir que la
section utile à la tâche (charge à la demande).

## Où regarder
- **§1** projet · **§2** règle active (ne modifier que les 1 min) · **§3** compositions
- **§4** charte graphique (`src/theme/client-01.ts`) · **§5** templates architecture
- **§6** props éditables · **§7** audio · **§8** sources & assets · **§9** règles de travail
- **§10** commandes · **§11** livrables produits · **§12** backlog
- **ANNEXE A** audit archi (fait) · **ANNEXE B** texte défilant (à faire)

## ⛔ DOCUMENT PARTIELLEMENT PÉRIMÉ — lire ceci avant de s'y fier

Ce PRD décrit l'état **Remotion** au 17/07/2026. Deux choses ont changé depuis :

1. **Le moteur a changé.** La production est passée à HyperFrames le 19/07
   (`decisions/014`). Les §1-§12 décrivent un moteur désormais **en maintenance**.
   Pour monter une vidéo aujourd'hui : `decisions/014` puis la doctrine
   `.claude/skills/montage-imcp/SKILL.md`.
2. **Le chemin du §1 est mort.** `C:\Users\Guillaume\Desktop\my-video-IMCP`
   n'existe plus ; le projet vit dans
   `C:\Users\Guillaume\Desktop\LP MedStream DCA\MONTAGE-IA-IMCP`.

Ce qui reste valable : **§4 la charte graphique** (source de vérité
`src/theme/client-01.ts`, accent cyan `#49B6C9`) et **§7 l'audio**. Le reste est de
l'archive Remotion.

## ⚠️ Direction en cours
La cible a pivoté (2026-07-17) vers un **service cloud automatisé** :
Telegram → images clés → IA choisit les timestamps → rendu → validation
praticien. Voir **[decisions/](decisions/README.md)** (001 Telegram · 002 cloud ·
003 skill 3 couches · 004 spike · 005 IA/code · 014 moteur).
`SPEC-PALIER-1.md` suppose encore `npx remotion render` : à réécrire sur
HyperFrames avant toute implémentation.

---

## 1. Le projet

**Dossier :** `C:\Users\Guillaume\Desktop\my-video-IMCP` (projet **Remotion** — vidéos en React/TypeScript).
**Propriétaire :** Guillaume, **non-développeur** — tout passe par l'IA, explications simples exigées.
**Objet :** production vidéo pour le **praticien client-01 / IMCP** (Institut Microchirurgie Parodontale) : promo de formation, habillage de cas cliniques, versions courtes réseaux, hero web.

## 2. RÈGLE ACTIVE LA PLUS IMPORTANTE

> ⚠️ **Ne modifier QUE les vidéos d'1 minute** (`HighlightsVestibulaire`, `HighlightsSerdat`).
> Les versions longues (`ClinicalVestibulaire`, `ClinicalSerdat`), la promo (`MyComp`) et les hero loops sont **gelées** sauf demande explicite.

## 3. Compositions enregistrées (src/Root.tsx)

| ID | Contenu | Durée | État |
|---|---|---|---|
| `MyComp` | Promo formation IMCP (intro logo, storytelling, 3 chapitres data, CTA) | 114 s ·1080p·60fps | gelée |
| `HeroLoop` / `HeroLoopMobile` | Boucle hero site DentalSynthesis (PRD v1.4), muette, seamless | 24 s ·30fps | gelée |
| `ClinicalVestibulaire` | Cas long « Approfondissement vestibulaire » | 5:24 ·30fps | gelée |
| `ClinicalSerdat` | Cas long « Retrait d'implant au laser » (audio source conservé) | 6:08 ·30fps | gelée |
| **`HighlightsVestibulaire`** | **1 min commentée** (sous-titres + CTA) | 67,5 s ·30fps | **ACTIVE** |
| **`HighlightsSerdat`** | **1 min** | ~57 s ·30fps | **ACTIVE** |

## 4. Charte graphique (source de vérité : `src/theme/client-01.ts`)

**Palette IMCP (imposée par le client, remplace l'ancien champagne) :**
| Token | Hex | Usage |
|---|---|---|
| `navy950` | `#060D18` | fond principal |
| `navy900` | `#0A1524` | cartons en relief |
| `navy800` | `#11213A` | cartes/bordures |
| `ivory` | `#EEF3FA` | titres, texte fort |
| `cream` | `#DCE4EF` | corps |
| `slate` | `#9DB1C9` | texte secondaire |
| **`champagne`** | **`#49B6C9`** | **accent unique = CYAN IMCP** (filets, eyebrows, CTA) — le token garde son nom historique |

**Typographies (Google Fonts, importées dans `src/index.css`) :**
- **Cormorant** (serif) — titres/display, italique pour les accents
- **Manrope** (sans) — corps, labels, sous-titres
- Existent aussi : Inter, Plus Jakarta Sans, Playfair Display, JetBrains Mono, Space Grotesk (promo/hero)

**Marque :** logo `public/logo-mark.png` (wordmark IMCP cyan détouré) ; sting animé `public/intro-imcp.mp4` (source 14 s, logo résolu à 8,5 s → toujours trimmer).
**Nom du praticien : TOUJOURS EN MAJUSCULES** → « DR <NOM DU PRATICIEN> » (lower-third, générique).

## 5. Templates réutilisables (architecture)

```
src/theme/client-01.ts            ← tokens DA (SEUL endroit à éditer pour re-brander)
src/clinical/ClientChrome.tsx  ← carton-titre, lower-third, watermark, générique
src/clinical/HighlightExtras.tsx ← sous-titres narratifs (fond TRANSPARENT + text-shadow) + carton CTA
src/clinical/ClinicalWrap.tsx  ← template LONG : sting → carton → contenu intégral → générique
src/clinical/ClinicalHighlights.tsx ← template 1 MIN : sting → carton → segments cutés → CTA → générique
```

**Structure d'une vidéo 1 min :** sting 3 s → carton-titre 2,5 s → N segments (crossfade/flash/zoom) → carton CTA 4 s (si `ctaLine1`) → générique 4 s. Durée auto (`calculateMetadata`).

## 6. Tout est éditable dans le Studio Remotion (panneau droit, « Save defaults »)

Schémas zod → contrôles UI. Props des compos 1 min :
- **`segments[]`** : `startSec`, `durationSec`, `transition` (`fade`|`flash`|`zoom`) — sélection manuelle des moments
- **`soundCues[]`** : `sound` (swoosh/click/bubble/zoom/impact/riser), `atSec`, `volume`, **`pitch` 0,5–2 (tonalité)** — insertion manuelle des sons
- **`captions[]`** : `text`, `fromSec`, `toSec` — commentaire synchronisé, **fond transparent**, ombre portée forte
- **`ctaLine1/ctaLine2`** : carton final (« Maîtriser le LASER en microchirurgie » / « Contactez IMCP »)
- **musique** : `musicSrc`, `musicOffsetSec` (départ dans le morceau), `musicChromeVol` (habillage), `musicBedVol` (pendant geste), `sourceVol` ; ducking auto si `hasAudio`
- Le template long expose en plus : `musicDelaySec`, `musicDuckVol`, `fadeInSec/fadeOutSec`, `sfxVol`

## 7. Audio

- **Musique :** `public/music/concerto.mp3` = Saint-Preux, *Concerto Pour Une Voix* (1995), 4:04, bouclée par `<Loop>`. ⚠️ **Droits SACEM à valider avant diffusion publique** (usage montage local seulement).
- **SFX synthétisés maison** (`public/sfx/`) : swoosh, click, bubble, zoom, impact (wav) + `cinematic-riser.mp3` (pack AutoEdit). Discrets : volumes 0,10–0,16.
- Voix off promo (`MyComp`) : `voiceover-natural-v3.wav` (atempo 1,15, hauteur préservée via ffmpeg).
- ffmpeg dispo : `C:\Users\Guillaume\AppData\Local\CapCut\Apps\7.0.0.2865\ffmpeg.exe` (attention : pas de `-crf` sur cette build → utiliser `h264_nvenc -b:v` ; wav pour l'audio intermédiaire).

## 8. Sources & assets

```
public/clinical/vestibulaire.mp4  (5:01, 1080p30, muet — rush approfondissement)
public/clinical/serdat.mov        (5:45, 540p25 — retrait implant laser. ⚠️ piste audio PRÉSENTE mais SILENCIEUSE, mean -90 dB, constaté au spike du 18/07 — voir decisions/004)
public/intro-imcp.mp4             sting logo (trim : long 165f@30, court 210f@30)
public/logo-mark.png              wordmark IMCP détouré
public/music/concerto.mp3         musique
public/sfx/*                      bruitages
IMCP/                             landing page Next.js (exclue du tsconfig) + DESIGN.md (ancienne DA champagne)
_sources-bruts/Pack Insert Vidéo/ pack AutoEdit (SFX/overlays/MOGRT — MOGRT inutilisables hors Adobe)
```

**Segments retenus (défauts actuels, éditables) :**
- Vestibulaire : 16 s(laser)/55/95/148/196/282(résultat) — 6 segments
- Serdat : 12(radio)/65/115/175/295(comblement) — 5 segments

**Sous-titres Vestibulaire :** 6 cartes calées sur les segments (texte du Dr Baudot condensé : LASER Erbium-YAG dissection sans saignement → outil micrométrique → tensions/apicaliser → suture périoste → matelassiers + PRF 6/0 → fiable/reproductible/suites minimes) + CTA « Contactez IMCP ».

## 9. Règles de travail (CLAUDE.md du projet)

1. **Un fichier = une job, ≤ 300 lignes** (`npm run check:sizes`) — dette connue : `HeroLoop.tsx` 574 l. (gelé).
2. **Dépendances sens unique** : `theme/` n'importe jamais de `scenes/`/`components/`/`hero/` (ESLint).
3. **Après chaque modif : `npm run test`** (vert obligatoire) + typecheck `./node_modules/.bin/tsc --noEmit`.
4. Toujours **still de contrôle** avant rendu complet (`npx remotion still <Comp> out.png --frame=N`).
5. Rendus longs **en arrière-plan** ; kill le studio + `rm -rf node_modules/.cache` avant un render (conflit de cache).
6. Livraison : copier le MP4 sur `C:\Users\Guillaume\Desktop\` puis `Start-Process` pour lecture.

## 10. Commandes

```bash
cd C:\Users\Guillaume\Desktop\my-video-IMCP
npm run dev                    # Studio (http://localhost:3000)
npm run test / check:sizes / lint
npx remotion render HighlightsVestibulaire out/VESTIBULAIRE-1MIN.mp4 --codec=h264 --crf=18 --concurrency=4
npx remotion render HighlightsSerdat      out/SERDAT-1MIN.mp4      --codec=h264 --crf=18 --concurrency=4
```

## 11. Livrables déjà produits (Bureau)

`VESTIBULAIRE-1MIN.mp4` (commentée, captions transparents) · `SERDAT-1MIN.mp4` · `APPROFONDISSEMENT-VESTIBULAIRE-IMCP.mp4` (5:24) · `RETRAIT-IMPLANT-LASER-SERDAT-IMCP.mp4` (6:08) · `IMCP-master-2K.mp4` + `-1080` (promo) · `hero-output/` (webm/mp4/fallback).

## 12. Backlog / points ouverts

- Droits musicaux Saint-Preux (SACEM) avant diffusion.
- ~~HeroLoop.tsx à découper~~ ✅ fait (6 modules).
- Chiffres proof HeroLoop = placeholders (25 ans/500+/98 %) à confirmer.
- Tagline + logo officiel DentalSynthesis jamais fournis (wordmark texte en attendant).
- Ajustements fins des fenêtres `captions[]` au visionnage.
- ~~ANNEXE A : audit architecture~~ ✅ fait (16/07).
- **ANNEXE B** : texte contextuel praticien en défilement rythmé + pipeline de saisie (WhatsApp/dépôt).

---

# ANNEXE A — PRD en attente n°1 : Audit d'architecture & remise en ordre

**Statut : ✅ EXÉCUTÉ le 16/07/2026** (validation globale donnée). Résultats : filet réparé (vitest exclut IMCP/, 3 fichiers · 14 tests verts), HeroLoop découpé 573→6 modules (rendu identique pixel-perfect), Chapter allégé 259→179 (idem), 0 cycle (madge), rangement par domaine confirmé. Incident réparé : git checkout avait restauré un vieux timing.ts → réécrit ; ⚠️ le repo a beaucoup de modifs non commitées, un commit de sauvegarde est recommandé.

## Mandat
Auditer l'architecture du projet pour comprendre pourquoi des modifications cassent du code ailleurs, puis proposer un plan de remise en ordre validé étape par étape.

**Préalable obligatoire :** lire la doc officielle des bonnes pratiques Claude Code
(https://code.claude.com/docs/en/best-practices) — ne pas se fier au seul pré-entraînement.

## Audit en 3 passes (rapport clair attendu)

**PASSE 1 — God files**
- Lister tous les fichiers de code > 300 lignes, du plus gros au plus petit, avec nb de lignes.
- Pour les 5 plus gros : 1 phrase chacun sur les responsabilités qui cohabitent.
- Signaler ceux gros ET souvent modifiés (les plus dangereux). État connu : `src/hero/HeroLoop.tsx` ≈ 574 l.

**PASSE 2 — Rangement**
- Rangement par domaine de sens ou dossiers techniques fourre-tout ?
- Dépendances dans le mauvais sens (métier → détails techniques/affichage) ?
- Cycles de dépendances (A→B→A) ? Lancer un outil de vérification si disponible (ESLint sens unique déjà en place).

**PASSE 3 — Filet de vérification**
- Des tests existent-ils ? **LE PLUS IMPORTANT : s'exécutent-ils vraiment ?** Lancer `npm run test`, rapporter le résultat réel (passés/échoués/désactivés/plantage).
- Si la suite ne tourne pas : priorité n°1 absolue.

## Plan de remise en ordre (après audit, ordonné par impact)
1. **Réparer le filet de vérification** s'il ne tourne pas — rien d'autre avant.
2. **Découper les god files** les plus dangereux, un par un, filet vert après chaque découpe.
3. **Corriger le rangement** (dépendances bon sens, regroupement par domaine).

Pour chaque étape : dire ce qu'on fait, pourquoi, comment on vérifie que rien n'est cassé. **Attendre la validation de Guillaume avant chaque étape.**

---

# ANNEXE B — PRD en attente n°2 : Texte contextuel praticien (défilement rythmé)

**Statut :** à implémenter. **Version 1.0 — 11/06/2026.**

## Contexte & objectif
S'inscrit dans le pipeline d'automatisation vidéo visé (dépôt → montage auto → validation praticien → publication multi-plateformes). Pour **chaque** vidéo soumise : un emplacement où le praticien saisit un **texte contextuel propre à cette vidéo** (explication du cas, intro, légende technique). Ce texte est intégré au montage en **texte défilant progressif**, réparti sur toute la durée, calé sur le rythme du montage (jamais en bloc statique).

## Spécifications
- **Saisie** : champ dédié à chaque soumission, intégré à l'interface existante (bot WhatsApp / interface de dépôt), sans étape complexe. Texte spécifique par vidéo, non générique.
- **Affichage** : défilement progressif sur toute la durée ; rythme lisible, synchronisé au montage ; style conforme à la DA du praticien (tokens `baudot.ts`, logo, typos — cf. §4/5 de ce document).
- **Pipeline** : s'insère à chaque étape sans casser le flux ; texte **modifiable jusqu'à la validation finale** (qui vaut contrôle déontologique/médical).

## Critères d'acceptation
1. Emplacement de saisie clair pour chaque vidéo soumise.
2. Défilement progressif réparti sur la durée totale, en phase avec le rythme.
3. Respect de la charte visuelle (template DA existant).
4. Texte éditable jusqu'à validation finale praticien.
5. Zéro complexification du pipeline (WhatsApp / interface actuelle).

## Points à clarifier avant implémentation
- Interface de saisie exacte : message WhatsApp accompagnant la vidéo brute, ou champ dédié séparé ?
- Limite de caractères pour rester lisible sur ~1 min de vidéo ?
- Position à l'écran : bandeau bas (type sous-titre), latéral, ou zone dédiée du cadrage ?
- Si aucun texte fourni : publication sans texte ou champ obligatoire ?
- Synchronisation : calage sur repères du montage (changements de plan) ou répartition linéaire ?

## Note d'implémentation (lien avec l'existant)
La brique d'affichage existe déjà en partie : `CaptionTrack` (`src/clinical/HighlightExtras.tsx`) = sous-titres fenêtrés, fond transparent, DA conforme, éditables via props zod. Le PRD demande en plus : mode **défilement continu** (scroll/reveal progressif au fil de la vidéo), génération des fenêtres depuis un texte libre (découpage automatique), et branchement amont (saisie praticien → props de la compo). Le pipeline WhatsApp/dépôt/validation n'existe pas encore dans ce repo — périmètre à cadrer.
