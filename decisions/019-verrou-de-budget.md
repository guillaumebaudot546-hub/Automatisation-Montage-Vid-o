# 019 — Le budget devient un verrou, pas une consigne

**Date :** 2026-08-05 · **Statut :** Actif · **Suite de :** 016, 017, 018

## Contexte

`decisions/018` a mesuré une capsule à **8,79 $** : écriture du cache 65 %,
relecture 29 %, sortie 6 %. Cause unique : **143 803 jetons de contexte par
appel**, et **25 881 jetons réécrits en cache à chaque appel** parce que
l'historique grossissait.

La réponse du 03/08 a été d'écrire « une vidéo = une session neuve » dans
`AGENTS.md` et dans la skill.

**C'est le même pari que « RENDRE SANS PORTAIL EST INTERDIT »** — consigne
écrite en majuscules, ignorée trois fois de suite le 30/07. Une règle qui
dépend de la bonne volonté de l'agent n'est pas un garde-fou. Le projet a déjà
tranché ce point une fois : on transforme la règle en verrou.

## Décision

**`scripts/hook-budget.py` refuse les appels d'outils quand la session sort du
budget.** Branché en `pre_tool_call` **sans matcher** — il voit donc *tous* les
outils, pas seulement le terminal — et **avant** `portail.py` : inutile de
valider un plan dans une session qu'on va de toute façon arrêter.

| Seuil | Défaut | Intention |
|---|---|---|
| `IMCP_CONTEXTE_MAX` | **60 000** jetons/appel | Préventif. Au-delà, chaque appel coûte trop cher *avant même de commencer*. Le remède est une session neuve. |
| `IMCP_BUDGET_USD` | **2,00 $** | Curatif. Filet de dernier recours contre une boucle. |

Le budget est calculé au **tarif standard** (3 $/15 $), pas au tarif
d'introduction de Sonnet 5 : régler un verrou sur un prix qui augmente de 50 %
le 31/08/2026 serait le régler faux.

## Pourquoi bloquer l'outil et pas la réponse

Bloquer un appel d'outil n'empêche pas l'agent de parler. Il garde donc la
possibilité d'expliquer au praticien pourquoi il s'arrête — mais il ne peut
plus dépenser. Le message de blocage lui dit exactement quoi faire : demander
à Guillaume d'ouvrir une conversation neuve et redonner sa demande.

## Politique en cas de panne

Base illisible, table absente, payload incompréhensible : **on laisse passer.**
Un verrou de budget cassé ne doit pas geler la production — il doit se taire.
Toute décision est tracée dans `~/.hermes/logs/budget.log`.

C'est l'inverse de `portail.py`, qui bloque quand il est cassé : lui protège
la qualité livrée au praticien, celui-ci ne protège que de l'argent.

## Vérifié le 05/08/2026 sur le VPS

Cinq chemins testés :

| Cas | Attendu | Obtenu |
|---|---|---|
| Session réelle à 143 803 jetons/appel | bloque | ✅ `block` |
| Seuils relevés | passe | ✅ `approve` |
| `state.db` absente | passe | ✅ `approve` |
| Payload illisible | passe | ✅ `approve` |
| Budget dépassé, contexte correct | bloque | ✅ `block` |

`hermes hooks doctor` : **« All shell hooks look healthy »** — script exécutable,
allowlisté, JSON valide sur payload synthétique, 0,053 s.

## Ce que ça donne comme cible

Une capsule dans une session neuve : contexte ~15 000 jetons/appel, ~15 appels
d'outils. Au tarif standard, de l'ordre de **0,50 $** — contre 8,79 $ mesurés.

Ce chiffre reste une projection tant qu'une capsule n'a pas été produite dans
une session vide avec `scripts/couts.py` relevé avant et après.

## Deux constats d'exploitation

- `~/.hermes/agent-hooks/` appartient à **root**. Ni Guillaume ni un script de
  déploiement ne peuvent y écrire — `portail.py` n'est donc pas maintenable par
  le projet. Les garde-fous du projet vivent désormais dans `~/imcp/scripts/`.
- L'approbation d'un hook passe par `~/.hermes/shell-hooks-allowlist.json`, avec
  contrôle de dérive de `mtime` : **modifier le script le désactive** jusqu'à
  réapprobation. `deploy-vps.sh` doit le vérifier après chaque déploiement.
