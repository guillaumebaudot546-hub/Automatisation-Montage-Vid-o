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
- Le tronc commun (chrome, sous-titres, animation, carte de fin, palette) vit
  dans **`imcp-hyperframes/_socle/teaser.template.html`**. Chaque teaser n'a plus
  que ses données propres dans `teaser.json` ; son `index.html` est **généré**.
- Un nouveau teaser part du socle : il ne recopie pas un `index.html` voisin.
  Le copier-coller entre projets est la faute que cette règle interdit.

**Comment modifier — lire avant de toucher à un `index.html` :**
| Tu veux changer… | Tu édites… | Puis |
|---|---|---|
| le contenu d'UN teaser | son `teaser.json` | `npm run teasers:build` |
| le look de TOUS les teasers | `_socle/teaser.template.html` | `npm run teasers:build` |
| faire diverger un teaser | `"eject": true` dans son `teaser.json` | il garde son HTML |

Ne jamais éditer un `index.html` généré à la main : `npm run teasers:check`
(dans `npm run check`) échoue, parce que le prochain build écraserait la
modification en silence. Détail : `imcp-hyperframes/_socle/README.md`.

*Le socle a été extrait des 6 teasers livrés avec régénération vérifiée
identique à l'octet près — aucune vidéo livrée n'a changé. Restent à traiter :
le logo dupliqué 10 fois, les trois versions de CLI (0.7.67 / 0.7.72 / 0.7.77),
et `teaser-01` qui suit une structure différente.*

## RÈGLE 4bis — l'identité passe par la charte, jamais par des valeurs à la main
Toute couleur vient de `src/theme/baudot.ts`, seule source de vérité :
`navy950 #060D18` · `ivory #EEF3FA` · `cream #DCE4EF` · `slate #9DB1C9` ·
**`champagne #49B6C9` — le cyan IMCP, imposé par le client**.

Le `#d8c7a8` beige est l'ANCIEN accent, remplacé. Le retrouver dans une
composition est un bug, pas un choix esthétique. Seuls `--fluo` (cyan fluo des
mots-clés) et `--amber` sont des tokens d'effet libres.

Vérification : `npm run check:charte`. À lancer avant de livrer.

## RÈGLE 4ter — la profondeur et le mouvement ont un vocabulaire fixe

Ces valeurs ne s'inventent pas à chaque vidéo. Elles ont été **relevées sur les
13 compositions livrées** : c'est le langage visuel de la marque, pas une
préférence esthétique du moment. Une composition qui invente ses propres ombres
ou ses propres courbes ne ressemble plus aux précédentes — c'est ce qui est
arrivé au premier montage produit par l'agent (30/07).

### Les ombres — trois usages, trois valeurs

| Usage | Valeur |
|---|---|
| **Carte / panneau posé sur la vidéo** | `box-shadow: 0 30px 90px rgba(0,0,0,0.6), 0 0 60px rgba(95,232,255,0.12)` |
| Élément secondaire, moins détaché | `box-shadow: 0 24px 70px rgba(0,0,0,0.55)` |
| **Accent fluo** (pastille, filet, focus) | `box-shadow: 0 0 16px rgba(95,232,255,0.75)` |

L'ombre porte **toujours deux couches** sur les cartes principales : une ombre
noire large qui décolle l'élément du fond, et une **lueur cyan très faible**
(`0.12`) qui le relie à la charte. Sans la seconde, la carte paraît collée ;
avec une lueur trop forte, elle devient un néon.

### Le texte — lisibilité d'abord

| Usage | Valeur |
|---|---|
| Texte sur vidéo (sous-titres, titres) | `text-shadow: 0 3px 20px rgba(0,0,0,0.9)` |
| Mot-clé fluo mis en avant | `text-shadow: 0 0 16px rgba(95,232,255,0.8), 0 0 5px rgba(95,232,255,0.6)` |
| Titre avec halo doux | `text-shadow: 0 0 15px rgba(150,225,255,0.34), 0 2px 7px rgba(0,0,0,0.72)` |

Le texte posé sur une image en mouvement **doit** porter une ombre noire : sans
elle, il devient illisible dès que le fond s'éclaircit — et le fond bouge.

### Le fond derrière une carte

`filter: blur(48px) brightness(0.34) saturate(1.1)` — la vidéo continue de
vivre derrière le panneau, assombrie et floutée, jamais remplacée par un aplat.
C'est ce qui garde la présence du praticien à l'écran (RÈGLE 3bis) même quand
une infographie occupe le cadre.

### Le mouvement

| Paramètre | Valeur | Pourquoi |
|---|---|---|
| Courbe par défaut | `power3.out` | démarre vite, s'arrête en douceur : l'élément « arrive », il ne glisse pas |
| Courbe secondaire | `power2.out` | mêmes intentions, plus discrète |
| Rebond léger | `back.out(1.6)` à `back.out(2.2)` | **réservé aux accents** (chiffre-choc, pastille). Jamais sur du texte courant |
| Mouvement continu (caméra, balayage) | `none` | une caméra qui accélère se remarque, et on ne doit pas la remarquer |
| Durée d'entrée | **0,35 à 0,6 s** | en dessous ça claque, au-dessus ça traîne |
| Décalage d'entrée | `y: 16` à `y: 40` puis `y: 0` | l'élément monte en place ; jamais d'entrée latérale sur du texte |

**La caméra respire, elle ne zoome pas.** Sur un plan fixe, un `scale` de 1,02 à
1,07 sur toute la durée suffit à empêcher l'image de paraître morte. Au-delà,
on recadre le praticien sans le vouloir.

**Les entrées se décalent en cascade** (~0,08 à 0,12 s entre deux lignes d'une
liste) : c'est ce qui donne la lecture guidée d'une énumération (RÈGLE 2).

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

## RÈGLE 8 — le portail doctrine, avant de rendre

Une règle que rien ne vérifie est un vœu. Ces règles sont désormais **vérifiées
par du code** — portail ① de la boucle auto-critique (`decisions/006`) :

```bash
npm run portail -- plan.json cues.json
```

Le plan de montage est un JSON : `format`, `reseau`, `spans[]`, `crossfades[]`,
`overlays[]`, `captions[]`, `dureeTotaleSec`. `cues.json` est la transcription
(`{s, e, t}` par phrase).

Ce que le portail refuse, **sans appel API et sans avis** :
- une coupe qui ne tombe pas sur une frontière de phrase (RÈGLE 0) ;
- plus d'une coupure dans la voix — le best-of de punchlines éparses ;
- un raccord en cut sec entre deux prises (fondu < 0,15 s) ;
- un format qui ne correspond pas au réseau visé (RÈGLE 3) ;
- un calque posé au-delà de la fin — il serait invisible, sans aucune erreur ;
- un sous-titrage couvrant moins de 80 % de la voix.

Il **avertit** sans bloquer sur une infographie qui s'attarde au-delà de 6 s.

Sortie `0` = passe, `3` = rejet. **Plafond 3 essais** : au-delà, remonter à
Guillaume plutôt que boucler.

Ce portail rejette la faute historique du teaser v1 et de la capsule v1 —
5 timestamps épars, voix hachée. Il ne juge pas le goût : ce qui passe va au
portail ② (juge), puis au Dr Baudot, seul oracle du goût.

### Ce qui n'est toujours pas outillé
- Le portail ② (juge « l'histoire du geste est-elle claire ? ») reste à écrire.
- RÈGLE 3bis : présence du praticien à l'image, bookend — non vérifiable sans
  analyse d'image.
- RÈGLE 2 : « les propos sont-ils mis en avant » relève du jugement.
