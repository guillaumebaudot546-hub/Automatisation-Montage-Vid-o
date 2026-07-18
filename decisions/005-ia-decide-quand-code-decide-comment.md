# 005 — L'IA choisit *quand*, le code impose *comment*

**Date :** 2026-07-17 · **Statut :** Actif

## Contexte
Concilier « l'IA fait le montage elle-même » et « doctrine solide reproductible ».

## Décision
L'IA ne décide **que les timestamps** (5-6 nombres). Tout le reste est du code
déterministe extrait de `src/Root.tsx`.

## La doctrine observée dans le code (déterministe)
| Règle | Valeur |
|-------|--------|
| Premier segment | toujours `fade` |
| Suite | alternance stricte `zoom`/`flash` |
| Durées | 8-10 s |
| Jamais de segment avant | 12 s (on saute l'installation) |
| Dernier plan | sur le résultat (86-94 % de la durée) |
| Nombre de segments | 5 à 6 |

Vérifié sur les 2 vidéos existantes : le pattern de transitions et de durées est
identique. Seuls les timestamps diffèrent.

## Pourquoi
- Une IA qui déciderait aussi des transitions dériverait d'une vidéo à l'autre →
  perte de reproductibilité.
- En réduisant la surface IA à une liste de 5-6 nombres, le test devient mesurable
  (voir [004](004-spike-avant-build.md)) et le risque est circonscrit.

## Conséquence
Le `SKILL.md` (doctrine) est écrivable dès maintenant, sans attendre le spike —
il code les règles ci-dessus. Le spike ne teste que la partie IA (les timestamps).
