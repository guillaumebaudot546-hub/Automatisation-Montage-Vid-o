---
name: montage-imcp
description: Doctrine de montage vidéo IMCP — capsules, teasers et publications verticaux/horizontaux à partir des rushes du Dr Baudot. À charger AVANT tout montage, avant même de choisir des timestamps. Moteur = HyperFrames (decision 014). Encode les règles apprises au fil des corrections réelles du praticien (voir praticiens/<nom>.json, decisions/013 et 014).
metadata:
  tags: montage, hyperframes, video, vertical, teaser, capsule, IMCP, doctrine
---

# Doctrine de montage IMCP

> À lire AVANT de monter. Ces règles ne se redemandent pas au praticien — elles
> s'appliquent d'office. Chaque règle vient d'une correction réelle (capsule v1→v6,
> teaser v1→v2). Ne pas les réapprendre à chaque vidéo.

## RÈGLE 0 — la voix est la colonne vertébrale, JAMAIS hachée
La cause n°1 des rejets. Deux fautes à ne PLUS commettre :
1. **Couper un mot / une phrase en cours** → toujours couper aux frontières de
   phrases de la transcription (SRT whisper), jamais au milieu.
2. **Assembler des bouts de voix pris à des endroits éloignés** → même en phrases
   entières, 5 fragments venus de 5 moments différents SONNENT hachés et décousus
   (saut de ton, de contexte, de bruit de fond). ❌ INTERDIT.

**La bonne méthode :** choisir UNE prise de voix CONTINUE (un passage d'un seul
tenant) qui se suffit à lui-même. La voix ne peut pas être hachée si elle n'est
jamais coupée. Si un second passage est indispensable, le raccorder avec un
**fondu audio** (crossfade ~150 ms) — jamais un cut sec.

- **Capsule** = tout le discours du praticien, une coupe max (phrase méta sacrifiable), fondu.
- **Teaser / short** = LE meilleur passage continu de ~30-40 s qui se suffit
  (souvent l'intro : accroche + promesse), PAS un best-of de punchlines éparses.

## RÈGLE 1 — LIRE avant de monter
Toujours transcrire (whisper) et LIRE la transcription en entier AVANT de choisir
quoi que ce soit. Comprendre le fil, l'argument, la promesse. Choisir UN fil
narratif unique. Ne jamais piocher des timestamps sans avoir lu le sens.

## RÈGLE 2 — mettre les propos en avant par la TYPOGRAPHIE, pas par des images brutes
Le praticien veut que ses PROPOS soient valorisés, pas juste illustrés. Par-dessus
la voix continue, poser des calques ANIMÉS qui matérialisent ce qu'il dit :
- Énumération (« 3 réglages : énergie, fréquence, débit ») → `KineticList` en cascade.
- Phrase-structure (« 3 sur la machine, 3 dans les mains ») → `PunchCard` noir + fluo.
- Chiffre cité → `BigStat`. Promesse de progression → `ProgressChart`.
- « mon site » → `SiteCard` (imcpformations.fr). Analogie/schéma → slide ré-animée.
- Mots-clés de CHAQUE sous-titre en **cyan fluo** (balisage `**mot**`).
Les images/slides brutes servent d'appui SOUS la voix, jamais comme seul contenu.

## RÈGLE 3 — s'adapter au FORMAT (9:16 ou 16:9) selon la demande / le réseau
Le format est un PARAMÈTRE, décidé selon la demande ou le réseau cible :
- **9:16 (1080×1920)** — Reels, TikTok, Shorts (défaut réseaux sociaux verticaux).
- **16:9 (1920×1080)** — YouTube, site web, LinkedIn desktop.
- **1:1 (1080×1080)** — feed Instagram carré (si demandé).
Choisir d'après le réseau nommé, sinon 9:16 par défaut (usage social dominant).

### Recadrage selon le contenu ET le format cible
Vérifier le type de contenu de CHAQUE plan (échantillonner l'image AVANT de fixer) :
- **Source verticale → cible 9:16** : plein cadre (`cover`).
- **Source paysage → cible 9:16** : visage centré = `crop` (recadrage centré) ;
  slide / plan large = `fit` (contenu entier + fond flouté). Vérifier image par image.
- **Source verticale → cible 16:9** : `fit` (portrait entier + fond flouté), ou
  privilégier la typographie plein cadre.
- **Source paysage → cible 16:9** : plein cadre (`cover`).

## RÈGLE 3bis — MONTRER le praticien, et fondu enchaîné vers ses visuels
Le praticien doit être PRÉSENT à l'écran, pas seulement en voix off sur des slides.
- **Bookend** : ouvrir et clore sur son VISAGE (talking-head, crop) — présence humaine.
- **Fondu vers le visuel** : quand il COMMENCE à parler d'un élément qu'il affiche
  (slide, schéma, appareil), le montrer LUI d'abord, puis un FONDU ENCHAÎNÉ
  (crossfade ~0,4 s, plans qui se chevauchent) vers le visuel pendant que sa voix
  continue. Jamais un cut sec entre lui et une slide.
- Repérer image par image ses plans visage vs ses slides ; alterner les deux.

## RÈGLE 3ter — trailer d'un cours long : audio pré-assemblé
Pour balayer les points majeurs d'un cours long sans voix hachée : NE PAS butter
des clips bout à bout. Extraire les soundbites (phrases entières), les assembler
en UNE piste audio avec `ffmpeg acrossfade` (+ lit musical), puis poser les
visuels muets par-dessus, calés sur les temps de la piste. La musique lie les
raccords.

**C'est la SEULE exception tolérée à la RÈGLE 0**, et elle est bornée : les
raccords doivent être des `acrossfade` (jamais des cuts), un lit musical continu
doit couvrir toute la piste, et l'assemblage se fait en amont dans ffmpeg — pas
en posant des clips côte à côte dans la composition. Hors de ces trois
conditions, la RÈGLE 0 s'applique sans discussion.

## RÈGLE 4 — un socle partagé, pas une composition jetable par vidéo
**Le moteur est HyperFrames** (decision 014). Remotion (`src/`) est en
maintenance : on y corrige, on n'y construit plus.

L'intention n'a pas changé : une nouvelle vidéo **part du socle commun** et
n'invente pas sa propre structure. Un teaser est une capsule COURTE bâtie sur le
meilleur passage continu — pas un assemblage de clips (erreur du teaser v1).

En HyperFrames, cela veut dire concrètement :
- Le tronc commun (chrome, sous-titres, sting, carte de fin, palette) vit dans
  des **blocs et composants** partagés — `hyperframes.json` → `paths.blocks` et
  `paths.components`. Voir `/hyperframes-registry`.
- Un nouveau projet **installe** ces blocs, il ne recopie pas un `index.html`
  voisin. Le copier-coller entre projets est la faute que cette règle interdit.
- Une seule version de la CLI HyperFrames pour tout le dossier.

*État au 29/07/2026 : cette règle est violée — 126 lignes sur 144 identiques
entre les teasers 02 à 07, logo dupliqué 10 fois, trois versions de CLI. La
factorisation est le premier chantier HyperFrames à mener.*

## RÈGLE 4bis — l'identité passe par la charte, jamais par des valeurs à la main
Toute couleur vient de `src/theme/baudot.ts`, seule source de vérité :
`navy950 #060D18` · `ivory #EEF3FA` · `cream #DCE4EF` · `slate #9DB1C9` ·
**`champagne #49B6C9` — le cyan IMCP, imposé par le client**.

Le `#d8c7a8` beige est l'ANCIEN accent, remplacé. Le retrouver dans une
composition est un bug, pas un choix esthétique. Seuls `--fluo` (cyan fluo des
mots-clés) et `--amber` sont des tokens d'effet libres.

Vérification : `npm run check:charte`. À lancer avant de livrer.

## RÈGLE 5 — qualité & technique
- Source basse déf (WhatsApp) → demander l'original en mode document. Prétraiter si besoin.
- **Un seul encodage** final CRF 18. Remux faststart en copie (pas de ré-encodage).
- **Jamais deux rendus en parallèle** (conflit de cache → crash). Séquentiel.
  Appliqué par le hook `guard-render` : une seconde commande de rendu est refusée.
- Fichier source > ~1 Go dans `public/` casse le bundler → recompresser d'abord.
- Musique = lit discret (~0,03), fondus.
- **Aucune musique sous droits.** Jamais de Saint-Preux — l'œuvre classique est
  dans le domaine public, l'ENREGISTREMENT ne l'est pas. Un renommage de fichier
  ne règle rien : `concerto.mp3` était le fichier Saint-Preux à l'octet près et
  s'est retrouvé poussé sur GitHub. Par défaut : `music/ambient-bed.wav`,
  synthétisé par `scripts/make_music.py`. Toute autre piste demande une preuve
  de licence avant d'entrer dans `public/`.

## RÈGLE 6 — la boucle d'apprentissage
Chaque correction du praticien → l'écrire dans `praticiens/<nom>.json`
(préférences + corrections datées). La vidéo suivante part de ces règles. Ne
jamais refaire deux fois la même erreur corrigée.

**La boucle n'est bouclée que si les trois gestes sont faits :**
1. La correction est écrite dans `corrections[]`, datée, avec la vidéo concernée.
2. Si elle établit une règle générale, la préférence correspondante est mise à
   jour dans `preferences` — sinon la leçon reste enterrée dans un historique.
3. Le segment validé est ajouté à **`exemplesValides[]`**. C'est la couche 3 du
   skill (decision 003) : les exemples few-shot qui montrent à quoi ressemble un
   bon montage. *Un tableau vide veut dire que l'agent n'a jamais vu d'exemple
   de réussite — seulement des descriptions d'échecs à éviter.*

Sans le geste 3, l'agent apprend uniquement ce qu'il ne faut pas faire.

## RÈGLE 7 — comment construire, concrètement
1. **Lire d'abord.** Transcrire (whisper), lire la transcription en entier,
   choisir UN fil narratif (RÈGLE 1). Rien ne commence avant.
2. **Charger le contexte praticien** : `praticiens/<nom>.json` — préférences,
   corrections passées, exemples validés. Ces règles ne se redemandent pas.
3. **Router par `/hyperframes`.** C'est le point d'entrée qui choisit le
   workflow et installe les skills nécessaires. Ne pas écrire une composition
   HyperFrames à la main sans passer par lui.
4. **Partir du socle** (RÈGLE 4), pas d'un `index.html` voisin copié.
5. **Vérifier avant de livrer** : `npm run check` — lint, tests, tailles, charte.
   Un rouge se répare avant d'aller plus loin.
6. **Après le retour du praticien** : appliquer la RÈGLE 6, les trois gestes.

### Ce qui n'est pas encore outillé
Ces règles restent déclaratives — aucun script ne les vérifie aujourd'hui. Les
mécaniser est le chantier suivant :
- RÈGLE 0 : chaque coupe tombe-t-elle sur une frontière de phrase du SRT ?
- RÈGLE 3 : le ratio de sortie correspond-il au réseau demandé ?
- Durée des calques : une infographie ne dépasse pas 5-6 s (préférence
  `dureeInfographies`).

Une règle que rien ne vérifie est un vœu. Les RÈGLES 4bis et 5 ont franchi ce
pas (`check:charte`, `guard-render`) ; les autres pas encore.
