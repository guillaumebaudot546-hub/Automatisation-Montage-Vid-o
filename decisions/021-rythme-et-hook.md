# 021 — Le rythme et le hook sont des règles du portail, pas du goût

**Date :** 2026-08-01 · **Statut :** Actif · **Suite de :** 005 (l'IA décide quoi, le code vérifie comment), 016 (coût)

> *Portait le numéro 017 à sa rédaction. Renumérotée en 021 le 08/08/2026 : une
> autre branche de travail avait attribué 017 à « une capsule depuis un prompt »
> en parallèle. Le contenu n'a pas changé.*

## Contexte

Capsule 06 « formation », 9:16, rush de 48 s, livrée au praticien le 01/08.
Retour : *« les animations motion design sont ok mais apparaissent en un seul
bloc au début du monologue, difficile et pas agréable »*, et demande d'un hook
visuel d'ouverture.

Le plan livré :

| Calque | Position | Durée |
|---|---|---|
| `list` (les 3 modules) | 2,0 s | 6 s |
| `punch` | 30,0 s | 5,5 s |
| `punch` | 43,0 s | 4 s |

Les calques sont **bien répartis** sur 52 s. Le défaut est ailleurs : le
praticien n'énumère ses trois modules qu'entre **11,3 s et 29,6 s**. La cascade
arrivait donc **18 secondes avant les mots qu'elle illustre**, posée sur
« mes chers confrères, je voudrais partager notre projet ». D'où l'impression
de bloc décoratif en ouverture.

La préférence *« listes en cascade quand il les énumère »* existait déjà dans
`praticiens/baudot.json`. Elle n'a pas été respectée parce que **rien ne la
vérifiait** : le portail ne regardait qu'une chose sur un calque, sa durée et
son débordement de fin.

## Décision

**Un calque qui illustre un propos déclare le moment qu'il illustre, et le
portail vérifie qu'il est à l'écran à cet instant.**

Trois règles rejetantes, appliquées avant rendu :

| Règle | Ce qu'elle refuse |
|---|---|
| `ancrageCalques` | Un `list`, `chart` ou `stat` sans champ `ancre`, ou dont la fenêtre d'affichage ne contient pas son ancre, ou dont l'ancre tombe hors parole. |
| `rythmeCalques` | Deux calques qui se chevauchent, un écart inférieur à 2,5 s (effet rafale), plus de la moitié des calques illustratifs dans le premier tiers. |
| `hookVisuel` | Aucun calque dans les 1,5 premières secondes ; un hook qui dépasse 3 s. |

Le champ `ancre` est le cœur : l'IA décide **quoi** illustrer et **quand** dans
le discours, le code vérifie seulement la cohérence entre les deux. C'est
l'application directe de la décision 005.

## Pourquoi avant le rendu, et pas après

Un rendu coûte environ 15 minutes de calcul sur le VPS, et le praticien attend
pendant ce temps. Un rejet de portail coûte une seconde et zéro jeton. Les
trois règles ci-dessus auraient refusé le plan du 01/08 **avant** de lancer le
calcul, et le retour aurait porté sur une deuxième version au lieu d'une
première ratée.

## Conséquences

- `scripts/portail-doctrine.mjs` : trois règles ajoutées, seuils lus dans les
  préférences du praticien (prose lisible, pas de constante cachée).
- `praticiens/baudot.json` : préférences `ancrageCalques`, `rythmeCalques`,
  `hookVisuel` ; correction du 01/08 datée.
- Le plan réellement livré est désormais **rejeté** par deux règles. Vérifié
  sur le VPS.

## Piège rencontré, à ne pas réintroduire

La première version de `rythmeCalques` comptait le hook dans le quota du
premier tiers. Elle sanctionnait donc ce que `hookVisuel` **impose** : tout
montage conforme était rejeté. Les règles d'un même portail doivent être
testées ensemble, pas une par une — un jeu de plans conformes qui passe est
aussi important qu'un jeu de plans fautifs qui échoue.
