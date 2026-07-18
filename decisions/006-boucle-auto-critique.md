# 006 — Boucle auto-critique (loop until pass)

**Date :** 2026-07-17 · **Statut :** Actif (spike) / Planifié (prod)

## Contexte
Le praticien ne doit pas corriger à chaque fois. L'IA doit chercher jusqu'à un
résultat optimal. Mais « optimal » a besoin d'un juge, sinon la boucle ne s'arrête
jamais.

## Décision
Boucle bornée à **K=3 itérations**, avec des juges séparés selon ce qui est
vérifiable par machine vs ce qui relève du goût humain.

```
IA propose timestamps
   ▼
① Portail DOCTRINE (code, gratuit, déterministe)
   segment avant 12 s ? alternance zoom/flash cassée ? durée hors 8-10 s ?
   pas de plan final sur le résultat ?  → violation → REJET AUTO, refait
   ▼
② Portail JUGE (sous-agent scopé, angle « histoire du geste claire ? »)
   note faible → refait.  Plafond 3 essais.
   ▼
③ Dr Baudot valide  ← SEUL oracle du goût. Irremplaçable.
```

## Ce que la boucle fait / ne fait pas
- **Tue** les corrections de doctrine : l'IA se les corrige seule avant que Baudot
  voie la vidéo.
- **Ne retire PAS** Baudot de la boucle du goût. « Parfait pour lui » n'est pas
  connaissable par machine. La boucle rend son bouton [Modifier] plus RARE, pas
  absent — chaque validation nourrit la couche 3 (exemples), la proposition
  suivante démarre plus près de son goût.

## Garde-fous obligatoires
- **Plafond K=3.** Sans oracle de goût, une boucle non bornée tournerait sans fin.
- **Coût.** Chaque itération = 1 passe vision ≈ 0,50 €. 3 essais = 1,50 €/vidéo max.
  Le plafond protège le budget API.

## Cas spike vs prod
- **Spike** (decision 004) : oracle = les timestamps manuels. Boucle jusqu'à
  correspondre (± 3 s) ou K=3. On mesure si l'IA *converge* vers le goût de Baudot,
  pas juste si elle tape juste au 1er coup.
- **Prod** : oracle du goût absent → boucle jusqu'aux portails ①+②, puis Baudot.
