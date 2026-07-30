# Socle partagé des teasers

Les teasers 02 à 07 partageaient **126 lignes identiques sur 144**. Changer le
chrome demandait 6 modifications — ou l'oubli de 5. C'est la RÈGLE 4 de la
doctrine (« pas de composition jetable ») violée à l'échelle du dossier.

Maintenant : **un template + un fichier de données par teaser**.

```
_socle/teaser.template.html        le look, l'animation, la structure  (partagé)
videos/teaser-0X-.../teaser.json   le contenu de CE teaser             (propre)
videos/teaser-0X-.../index.html    GÉNÉRÉ — ne pas éditer à la main
```

## Modifier un montage

**Changer le contenu d'un seul teaser** — textes des cartes, timings, libellé de
module, titre de fin, sous-titres :

1. éditer son `teaser.json`
2. `npm run teasers:build`

Les autres teasers ne bougent pas. Vérifié : une modification de `teaser.json`
ne régénère que son propre `index.html`.

**Changer le look de tous les teasers** — CSS, animation, structure :

1. éditer `_socle/teaser.template.html`
2. `npm run teasers:build`

Une seule fois, les 6 suivent.

**Faire diverger un teaser structurellement** — quand il doit sortir du moule :

```json
{ "eject": true, ... }
```

dans son `teaser.json`. Il quitte le socle, garde son `index.html` tel quel, et
plus aucun build ne l'écrase. Réversible : repasser `eject` à `false`.

## Le garde-fou

`npm run teasers:check` (inclus dans `npm run check`) échoue si un `index.html`
généré a été édité à la main. Sans ça, la modification serait écrasée au prochain
build, silencieusement. Le message dit quoi faire : reporter le changement dans
`teaser.json` ou dans le template, ou assumer la divergence avec `eject`.

## Ce que contient teaser.json

| Champ | Rôle |
|---|---|
| `vid` | durée de la vidéo source, en secondes |
| `rootDur` | durée totale = `vid` + carte de fin |
| `module` | libellé affiché en haut à droite |
| `endTitle` | titre de la carte de fin |
| `cartes[]` | les 3 encarts : `at` (départ), `dur` (durée), `contenu` (HTML) |
| `cues` | la transcription synchronisée — `s`, `e`, `t`, `h` (avec mots-clés en gras) |
| `k` | timings d'animation des cartes |
| `eject` | `true` = sort du socle (optionnel) |

## Garantie d'origine

Le socle a été extrait des 6 teasers **déjà livrés**, et la régénération a été
vérifiée **identique à l'octet près** sur les 6. La factorisation n'a donc rien
changé au rendu : aucune vidéo livrée n'est affectée.

## Hors socle

`teaser-01-fondamentaux` fait 290 lignes et suit une structure différente : il
n'est pas rattaché au socle. Le rejoindre demanderait de le réécrire — à faire
seulement si tu retouches ce teaser de toute façon.
