# 010 — Descriptions de posts par réseau, doubles propositions

**Date :** 2026-07-18 · **Statut :** Planifié (palier 2-3)

## Contexte
Chaque vidéo/image publiée a besoin d'une description adaptée au réseau. Le ton
LinkedIn ≠ Instagram ≠ TikTok. La description doit suivre la ligne éditoriale
(sauf volonté explicite d'en sortir) et partir des mots clés du praticien.

## Décision — le flux
1. **Mots clés demandés au praticien EN AMONT** (à l'onboarding, puis modifiables
   à tout moment). Stockés dans ses préférences (couche 2, decision 003).
2. À chaque post, l'IA génère **DEUX propositions présentées en parallèle** :
   - **Proposition A** — construite sur les mots clés du praticien + ligne
     éditoriale. TOUJOURS générée en premier. C'est la base.
   - **Proposition B** — suggestion libre de l'IA (angle différent, accroche
     alternative), même ligne éditoriale.
3. Le praticien choisit A, B, ou demande une retouche. Son choix nourrit les
   préférences (le pattern des choix A/B est un signal de goût).

## Adaptation par réseau (automatique)
| Réseau | Ton / forme |
|--------|-------------|
| LinkedIn | professionnel, pédagogique, paragraphes courts, pas d'emoji excessif, hashtags sobres |
| Instagram | direct, accrocheur, emojis, hashtags nombreux, ligne d'ouverture forte |
| TikTok/Shorts | ultra-court, question ou punchline |

Une description PAR réseau ciblé, générée d'un coup, chacune validable séparément.

## Hors-cadre éditorial
Par défaut, la description reste dans la ligne éditoriale hebdo (decision 009).
Si le praticien demande explicitement de sortir du cadre (« pour ce post, autre
sujet »), l'override l'emporte — même logique que decision 007 : l'humain
surcharge, l'IA ne dévie jamais seule.

## Coût
- Génération : texte pur, ~0,01-0,02 €/post (négligeable).
- Build : 1-2 jours (gabarits par réseau + flux Telegram A/B + stockage mots clés).
