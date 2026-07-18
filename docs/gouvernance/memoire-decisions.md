# Mémoire externalisée — le registre de décisions

> Index : où et comment noter ce qui doit survivre à la conversation. À lire quand tu prends une décision qui engage la suite du projet, ou en fin de session.

## Pourquoi
Une conversation s'oublie — résumée par compaction, ou simplement close. Un fichier reste. Sans registre externe, chaque nouvelle session redécouvre les mêmes arbitrages, ou pire, les recontredit sans le savoir.

## Le registre de CE projet : `decisions/` (un fichier par décision)
⚠️ Arbitrage du 2026-07-18 : ce projet utilise `decisions/` — **un fichier court par
décision + `decisions/README.md` comme index** — et NON le `docs/journal/decisions.md`
unique du gabarit d'origine. Raisons : 11 décisions y vivaient déjà (poussées sur
GitHub), et le format un-fichier-par-décision est plus conforme aux principes du
système (fichiers courts, charge à la demande). Ne pas créer de second registre.

## Ce qui va dans `decisions/`
Uniquement ce qui engage la suite : un choix d'architecture, un arbitrage technique après hésitation, une contrainte externe découverte (limite d'API, contrainte légale, choix du client), un renoncement (« on a essayé X, ça ne marche pas parce que Y »).
N'y va pas : le détail de chaque ligne de code, ce qui est déjà lisible dans le code lui-même, les événements sans conséquence pour la suite.

## Format (un fichier `NNN-titre-court.md`, quelques dizaines de lignes max)
```
# NNN — Titre court
**Date :** AAAA-MM-JJ · **Statut :** Actif / Planifié / Fait / Remplacé par NNN
## Contexte   [pourquoi ce choix se posait]
## Décision   [ce qui a été choisi]
## Pourquoi   [et ce qu'on a écarté, avec la raison]
```
Puis ajouter la ligne dans `decisions/README.md`. Une décision ne se réécrit pas :
si on change d'avis, nouvelle décision qui remplace l'ancienne (statut mis à jour).

## Pendant une compaction
`CLAUDE.md` demande déjà de conserver, lors d'un résumé automatique, la liste des fichiers modifiés et les commandes de vérification. C'est la version « session courante » du même principe : ce qui compte ne doit pas dépendre de la mémoire du modèle.
