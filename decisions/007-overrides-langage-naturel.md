# 007 — Overrides d'effets par langage naturel

**Date :** 2026-07-17 · **Statut :** Planifié (après spike)

## Contexte
Le praticien veut pouvoir demander en langage naturel des zooms/effets différents
à des moments précis (« zoom plus lent sur le plan du laser », « pas de flash
ici »). Ça semble contredire la decision 005 (le code impose le *comment*).

## Décision
Pas de contradiction, à condition stricte :
- **L'IA ne freelance JAMAIS les effets.** Elle applique la doctrine par défaut.
- **Le praticien PEUT surcharger** par demande explicite. **L'override bat le défaut.**
- Le goût vient de l'humain, la cohérence du code, l'IA n'invente rien.

## Plafond dur — l'IA n'est pas un moteur de rendu
Un LLM ne fait pas de motion design. Il ne peut appliquer que des effets **déjà
codés dans le template Remotion**. L'IA fait la correspondance « mots du praticien
→ entrée de la palette ». Elle ne peut pas rendre un effet qui n'existe pas.

- **Template actuel = 3 transitions** : `fade`, `flash`, `zoom`. C'est tout.
- « Niveau expert motion design » = **qualité de la bibliothèque codée**, pas magie
  du LLM. L'expertise vit dans le template ; l'IA est experte à *choisir et placer*.

## Conséquence sur la boucle 006
Le portail DOCTRINE (①) ne rejette un effet que là où le praticien **n'a pas**
surchargé. Un override explicite n'est jamais une « violation ».

## Build requis (après validation du spike)
1. Enrichir la palette d'effets Remotion — chaque effet codé une fois. Matière :
   skill `remotion-best-practices` (transitions, timing, motion, audio).
2. Parseur langage naturel → palette (mapping mots → effet + paramètres).
3. Couche préférences praticien (decision 003) mémorise les overrides récurrents.

## Ordre
NE PAS construire avant que le spike (004) ait prouvé le séquençage. La palette et
l'override décorent le séquençage ; le séquençage n'est pas encore prouvé.
