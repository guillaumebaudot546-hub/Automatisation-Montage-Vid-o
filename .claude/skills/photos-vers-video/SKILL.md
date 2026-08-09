---
name: photos-vers-video
description: Des photos vers une video — par le socle capsule, jamais en ffmpeg brut.
metadata:
  tags: photos, galerie, diaporama, capsule, hyperframes, motion-design
---

# Des photos vers une vidéo

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
filmé, texte, ou photos. Une photo est un bloc de capsule, pas un cas à part.

## Comment faire

1. **Déposer les photos** dans le dossier du projet.
2. **Écrire `capsule.json`** — une scène par photo, bloc `photo` :

```json
{
  "type": "capsule-prompt", "charte": "client-01",
  "format": "9:16", "reseau": "instagram reels",
  "pied": "IMCP · Microchirurgie parodontale",
  "scenes": [
    { "kicker": "Le cas", "lede": ["Rétablissement de", "l'espace biologique"],
      "dureeSec": 5, "bloc": { "type": "rule" },
      "sub": "Chirurgie mini-invasive · Laser **Er-YAG**." },

    { "kicker": "Étape 2", "lede": [], "dureeSec": 6,
      "bloc": { "type": "photo", "data": {
        "fichier": "p02.jpg",
        "cadrage": "cover",
        "tag": "Étape 2",
        "texte": "Renforcement par **greffe de conjonctif**"
      } } }
  ]
}
```

3. **Valider** : `npm run portail:capsule -- <dossier>` — sortie 0 = passe.
4. **Générer** : `npm run capsule:build <dossier>` → `index.html`.
5. **Rendre** : `npx hyperframes@0.7.77 render` dans le dossier.

## Le champ `cadrage` — le choisir, ne pas le subir

| Contenu de la photo | Cadrage | Effet |
|---|---|---|
| Gros plan clinique, portrait, sujet centré | `cover` | remplit le cadre, recadre les bords |
| Plan large, slide, schéma, texte dans l'image | `fit` | l'image entière tient, le vide se remplit d'elle-même floutée |

**Jamais d'étirement** (RÈGLE 5bis) : le portail rejette tout autre valeur.
Regarde chaque photo avant de choisir — un plan large en `cover` perd son sujet.

## Ce que le portail vérifie

- le fichier existe (sinon le rendu sort un cadre vide après six minutes) ;
- le cadrage est `cover` ou `fit` ;
- la photo porte une légende — sinon il avertit : le spectateur ne saura pas ce
  qu'il regarde.

## Musique

Défaut : `public/music/ambient-bed.wav`, synthétisé, libre de droits. Toute autre
piste exige une preuve de licence **avant** d'entrer dans le projet (RÈGLE 5).
Un renommage ne règle rien — c'est ainsi qu'un enregistrement sous droits s'est
retrouvé sur GitHub (decision 014).

## Coût

Ne relis pas les photos une fois la vidéo rendue : une image coûte des milliers
de jetons et ne t'apprend rien que la légende ne dise déjà. Une image de contrôle
suffit, pas dix-sept.
