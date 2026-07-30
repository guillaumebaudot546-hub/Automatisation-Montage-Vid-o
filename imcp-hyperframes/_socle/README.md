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

## Version de CLI et assets

`npm run socle:check` (inclus dans `npm run check`) vérifie que les 13 projets
HyperFrames tournent sur **une seule version de CLI** et partagent les mêmes
assets de référence. `npm run socle:sync` réaligne.

Le logo canonique vit dans `_socle/assets/logo-mark.png` et est **copié** dans
chaque projet, pas référencé en `../../`. Raison : chaque composition est rendue
depuis son propre dossier, et un chemin remontant hors du projet n'est pas
garanti d'être résolu par le renderer. Casser le rendu de 13 vidéos livrées pour
économiser 2,5 Mo que git déduplique déjà serait un mauvais échange.

## Hors socle

`teaser-01-fondamentaux` est **éjecté** — voir son `teaser.json`, qui documente
pourquoi. Résumé : son animation est sur mesure (trois lignes révélées
individuellement, carte de fin qui chevauche la vidéo à 69 s alors que la vidéo
dure 70 s). Le socle sait maintenant gérer un nombre variable de cartes, une
carte de fin décalée (`endAt`) et une animation propre (`extras`) — mais il anime
la fin en `VID + 0.2` là où teaser-01 écrit `69.2` en dur. Les réconcilier
imposerait de modifier les six teasers déjà vérifiés, sans aucun gain de rendu.

À rattacher le jour où ce teaser doit être retouché de toute façon.
