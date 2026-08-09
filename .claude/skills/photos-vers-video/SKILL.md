---
name: photos-vers-video
description: Des photos ou un texte vers une video montee — par le socle capsule, jamais en ffmpeg brut.
metadata:
  tags: photos, galerie, diaporama, capsule, hyperframes, motion-design, voix-off
---

# Des photos ou un texte vers une vidéo

## Ce que cette skill remplace

Une skill `ffmpeg-image-slideshow` prescrivait un montage en ffmpeg brut pour ce
cas, et affirmait que la doctrine de montage « ne s'applique pas ici ». Le
09/08/2026, elle a produit une vidéo que le praticien a jugée mauvaise :

- police **DejaVu du système** au lieu de Cormorant / Manrope ;
- rectangle **gris translucide** en guise de carton, au lieu des cartes de la
  charte ;
- **aucune animation** hors un `zoompan` ;
- **aucun contrôle** : sans contrat, le portail n'avait rien à juger et a laissé
  passer vingt fois de suite.

Sortir de HyperFrames, c'est sortir du socle — donc des polices, du vocabulaire
d'ombres et des entrées animées. **Il n'y a pas de raison valable de le faire.**

## La règle

**Toute vidéo passe par HyperFrames**, quel que soit le contenu reçu : rush
filmé, texte, photos, ou plans animés. Une photo est un bloc de capsule, pas un
cas à part. Un plan animé non plus.

## La chaîne, dans cet ordre

Quatre commandes. Aucune n'est facultative, aucune ne se remplace par une
commande maison.

```bash
npm run capsule:media      -- <dossier>  # 1. mise au format des médias
npm run capsule:soustitres -- <dossier>  # 2. SI voix off : cale les sous-titres
npm run portail:capsule    -- <dossier>  # 3. contrôle doctrine (0 = passe)
npm run capsule:build         <dossier>  # 4. génération de l'index.html
npm run check                            # 5. dans le dossier du projet
npx hyperframes@0.7.77 render            # 6. rendu
```

**L'ordre compte.** `capsule:media` modifie le `capsule.json` (il y écrit les
noms des fichiers mis au format et la durée de la voix) : le lancer après le
portail invaliderait le reçu, et le rendu serait bloqué.

## 1 · Le contrat `capsule.json`

```json
{
  "type": "capsule-prompt", "charte": "client-01",
  "format": "9:16", "reseau": "instagram reels",
  "pied": "IMCP · Institut Microchirurgie Parodontale",

  "musique": { "fichier": "piste.mp3", "licence": "d'où elle vient" },
  "voix":    { "fichier": "vo.wav", "langue": "fr", "debutSec": 3 },

  "scenes": [
    { "kicker": "Le cas", "lede": ["Rétablissement de", "l'espace biologique"],
      "dureeSec": 4, "bloc": { "type": "rule" },
      "sub": "Chirurgie mini-invasive · Laser **Er-YAG**" },

    { "kicker": "Étape 2", "lede": [], "dureeSec": 5,
      "bloc": { "type": "photo", "data": {
        "fichier": "p02.jpg",
        "cadrage": "panneau",
        "tag": "Étape 2",
        "texte": "Renforcement par **greffe de conjonctif**"
      } } }
  ]
}
```

`**mot**` met le mot en **cyan de la charte**. C'est le seul balisage autorisé,
et c'est la RÈGLE 2 : les mots-clés de chaque sous-titre sont mis en avant.

## 2 · Le cadrage — le choisir, ne pas le subir

| Contenu | Cadrage | Effet |
|---|---|---|
| Gros plan, sujet centré, mêmes proportions que la sortie | `cover` | remplit le cadre, recadre les bords |
| Plan large, slide, schéma, texte dans l'image | `fit` | l'image entière tient, le vide se remplit d'elle-même floutée |
| **Photo clinique paysage → vidéo verticale** | **`panneau`** | l'image occupe les 2/3 hauts, la légende s'installe sur un fond de charte en bas |

**`panneau` est le cadrage par défaut d'une photo clinique en 9:16.** Il a été
créé le 09/08/2026 pour sortir d'un dilemme réel : en `cover` une photo paysage
perdait le sujet clinique par le recadrage, en `fit` elle devenait un timbre
poste au milieu d'un cadre vide. Le praticien a rejeté les deux.

Le portail **mesure les pixels de chaque image** et refuse un cadrage
incompatible avec ses proportions. Il ne te croit pas sur parole.

**Jamais d'étirement** (RÈGLE 5bis).

## 3 · Les plans animés (motion design)

Le champ `fichier` accepte une **vidéo** exactement comme une image : même bloc,
même cadrage, même carte de légende. C'est ainsi qu'on intègre un plan animé.

```json
{ "kicker": "Avant", "lede": [], "dureeSec": 5,
  "bloc": { "type": "photo", "data": {
    "fichier": "anim-p1.mp4", "cadrage": "panneau",
    "tag": "Avant", "texte": "Situation initiale · **liseret bleu**" } } }
```

Deux choses que `capsule:media` fait pour toi, et qu'il ne faut **jamais** faire
à la main :

1. **la mise au format.** Un plan arrive en paysage, la vidéo sort en vertical.
   `capsule:media` le recompose au format exact, fond de charte compris, et
   réécrit le contrat. Deux tentatives de le faire en CSS ont échoué : le moteur
   possède la lecture des médias et impose son propre placement ;
2. **le placement dans la timeline.** Un `<video>` doit être un clip de premier
   niveau, frère des scènes — imbriqué dans une scène, il reste noir.

## 4 · Voix off

```json
"voix": { "fichier": "vo.wav", "langue": "en", "debutSec": 3 }
```

- `langue` est **obligatoire**. Le portail refuse une voix anglaise dont les
  textes à l'écran sont restés en français : le spectateur entendrait une langue
  et en lirait une autre. C'est le défaut le plus coûteux, parce qu'il ne se
  voit qu'à la relecture du praticien ;
- la musique **descend automatiquement** sous la voix (0,68 → 0,10). Ne le règle
  pas à la main ;
- `capsule:media` mesure la durée réelle et l'écrit au contrat.

**Cloner la voix d'une personne réelle exige son accord explicite**, et cet
accord se note dans le contrat (champ `source`) et dans la fiche praticien.

### Sous-titres — le texte vient de toi, les repères viennent de l'audio

```json
"voix": {
  "fichier": "vo.wav", "langue": "en", "debutSec": 3,
  "sousTitres": [
    { "s": 0, "e": 1, "t": "A restoration violating the **biologic width**." }
  ]
}
```

Tu écris `t` — le texte que la voix prononce, avec les mots-clés en `**cyan**`.
Tu peux laisser `s` et `e` à zéro : `npm run capsule:soustitres` transcrit la
voix, reconnaît chaque réplique et écrit ses vrais repères.

**N'affiche jamais le texte sorti de la transcription.** Sur cette voix, elle a
rendu « pre-**prostatic** surgery » pour « pre-prosthetic », et « the area
glazer » pour « Er-YAG laser ». Elle est excellente pour dire *quand*, mauvaise
pour dire *quoi*. Le portail vérifie ensuite que chaque réplique tient dans la
voix, ne déborde pas de la vidéo, et reste lisible (≤ 4,5 mots/s).

## 5 · Ce que le portail vérifie

- le fichier existe — sinon on découvre un cadre vide après six minutes de rendu ;
- le cadrage est `cover`, `fit` ou `panneau`, **et** compatible avec les
  proportions réelles de l'image ;
- la photo porte une légende ;
- une ligne de titre ne déborde pas du cadre — **en pixels**, pas en nombre de
  caractères : « Microchirurgie » fait 14 caractères et débordait quand même ;
- la piste musicale a une preuve de licence (RÈGLE 5, incident Saint-Preux) ;
- la voix a une langue, et l'écran est dans cette langue ;
- le rythme de lecture : au-delà de 4,5 mots/seconde, personne ne suit.

## 6 · Rythme et mise en valeur

- **Ouvrir sur le problème, pas sur le logo.** La première scène montre ce qui
  cloche ou ce qui intrigue ; la marque ferme, elle n'ouvre pas.
- **Une scène = une idée.** 4 à 5 secondes. En dessous, on ne lit pas.
- **Le titre porte le cas, la légende porte l'étape.** Ne pas dire deux fois la
  même chose à l'écran : sur un plan photo avec un `tag`, le sur-titre flottant
  est supprimé automatiquement — il était redondant, et illisible sur l'image.
- **Chronologie clinique.** Avant → diagnostic → gestes → cicatrisation →
  résultat → après. Un ordre esthétique qui casse la chronologie fait perdre le
  fil du cas.

## 7 · Coût

Ne relis pas les photos une fois la vidéo rendue : une image coûte des milliers
de jetons et ne t'apprend rien que la légende ne dise déjà. Une image de
contrôle suffit, pas dix-sept.

Et **avant chaque nouvelle vidéo, demande à Guillaume de taper `/new`**. Mesuré
le 09/08 : 6,09 $ contre 1,75 $ pour le même travail.
