# 018 — On mesure les jetons, on ne les déduit plus

**Date :** 2026-08-03 · **Statut :** Actif · **Corrige :** l'audit du 03/08 · **Suite de :** 016, 017

## Contexte

L'audit du 03/08 concluait : *« ce n'est pas une mesure, c'est une attribution.
Hermes ne journalise aucun décompte de jetons. »*

**C'était faux.** La donnée était dans `~/.hermes/state.db`, table
`session_model_usage`, depuis le début : `input_tokens`, `output_tokens`,
`cache_read_tokens`, `cache_write_tokens`, `api_call_count`,
`estimated_cost_usd`. J'avais cherché dans les logs sans ouvrir la base.

Preuve que la table est fiable : sa ligne `claude-opus-4-8` du 30/07 affiche
**6,912509 $** — au centime près le 6,91 $ relevé à la main et publié dans la
proposition commerciale.

## Décision

**`scripts/couts.py` est l'instrument de mesure officiel.** Aucun audit de coût
ne repose plus sur une déduction tant que cette commande n'a pas été lancée.

```bash
python3 scripts/couts.py                 # toutes les sessions
python3 scripts/couts.py --session <id>  # une seule
python3 scripts/couts.py --json          # machine
```

Il ajoute trois choses à la table brute :
1. **La décomposition** écriture / relecture / sortie — où part l'argent.
2. **Le contexte moyen par appel** — la grandeur qui explique tout le reste.
3. **Le recalcul au tarif standard**, le tarif d'introduction de Sonnet 5
   (2 $/10 $) s'arrêtant le **31/08/2026**.

## Ce que la mesure a établi

Session `20260730_203305_a54410a5`, Sonnet 5, **8,79 $** :

| Poste | Montant | Part |
|---|---|---|
| **Écriture du cache** | 5,69 $ | **65 %** |
| Relecture du cache | 2,53 $ | 29 % |
| Texte généré | 0,56 $ | 6 % |

Décomposition vérifiée : elle ne tombe juste qu'au tarif d'introduction 2/10 $
avec un cache à 1,25× (TTL 5 min). Les quatre combinaisons possibles ont été
testées, une seule correspond au centime.

**Le chiffre qui explique tout : 143 803 jetons de contexte par appel**, sur
88 appels. Et **25 881 jetons réécrits en cache à chaque appel** — c'est
l'historique qui grossit, et l'écriture coûte 1,25× l'entrée là où la relecture
coûte 0,1×.

Autrement dit : **ce n'est pas relire l'historique qui coûte, c'est le faire
grossir.** Chaque message ajouté force une réécriture de cache.

Cumul de la base : **19,96 M de jetons, 17,32 $** — dont deux tiers sur une
seule session jamais refermée.

## Écart à surveiller

`config.yaml` déclare `cache_ttl: 1h`, mais la facturation correspond à un cache
5 minutes (1,25×). Deux lectures possibles, toutes deux à vérifier :

- le réglage n'est pas appliqué → le cache expire pendant un rendu de 15 min,
  et tout le contexte est réécrit après ;
- il est appliqué mais l'estimateur suppose 1,25× → le coût réel est **12,20 $**
  et non 8,79 $, l'estimation sous-évalue de 39 %.

Dans les deux cas la conclusion opérationnelle est la même : réduire ce qui
s'écrit en cache, c'est-à-dire refermer les sessions.

## Conséquences

- **Seuil chiffré, plus une impression** : au-delà de **60 000 jetons de
  contexte par appel**, `couts.py` signale une session trop chargée. La session
  auditée était à 143 803.
- `scripts/deploy-vps.sh` déploie et **vérifie** — la chaîne capsule et le
  relevé de coûts sont testés à chaque déploiement.
- Le tarif d'introduction Sonnet 5 s'arrête le 31/08/2026 : le même usage
  passera de 17,32 $ à **21,75 $** (+26 %) à comportement inchangé.

## Ce qui reste à instrumenter

`actual_cost_usd` vaut 0 partout et `cost_status` reste `estimated`. Hermes
n'interroge pas l'API de facturation Anthropic. Tant que ce sera le cas,
`couts.py` reste une estimation — fiable au centime sur le cas vérifié, mais
une estimation.
