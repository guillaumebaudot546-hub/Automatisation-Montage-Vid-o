---
name: montage-imcp
description: Doctrine de montage vidéo IMCP — capsules et teasers verticaux/horizontaux à partir des rushes du praticien. À charger AVANT tout montage. Encode les règles apprises au fil des corrections (voir praticiens/<nom>.json et decisions/013).
metadata:
  tags: montage, remotion, vertical, teaser, capsule, IMCP
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
des clips bout à bout dans Remotion. Extraire les soundbites (phrases entières),
les assembler en UNE piste audio avec `ffmpeg acrossfade` (+ lit musical), puis
poser les visuels muets par-dessus, calés sur les temps de la piste. La musique
lie les raccords. C'est la méthode trailer (TeaserTrailer.tsx).

## RÈGLE 4 — moteur unique, pas de composition jetable
Le montage repose sur `CapsuleV2` (voix continue + calques). Un teaser est une
capsule COURTE bâtie sur le meilleur passage continu. Ne pas réécrire une
composition « assemblage de clips » (erreur du teaser v1).

## RÈGLE 5 — qualité & technique
- Source basse déf (WhatsApp) → demander l'original en mode document. Prétraiter si besoin.
- **Un seul encodage** final CRF 18. Remux faststart en copie (pas de ré-encodage).
- **Jamais deux rendus Remotion en parallèle** (conflit de cache → crash). Séquentiel.
- Fichier source > ~1 Go dans public/ casse le bundler → recompresser d'abord.
- Musique = lit discret (~0,03), fondus. Jamais de Saint-Preux (SACEM).

## RÈGLE 6 — la boucle d'apprentissage
Chaque correction du praticien → l'écrire dans `praticiens/<nom>.json` (préférences
+ corrections datées). La vidéo suivante part de ces règles. Ne jamais refaire
deux fois la même erreur corrigée.
