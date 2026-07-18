# Cycles courts — discipline de session

> Index : comment ouvrir, dérouler et clore une session de travail. À lire en ouvrant une session, et avant de la clore.

## Une session, un objectif
Ne mélange pas deux sujets sans rapport dans la même conversation : le contexte de l'un pollue l'autre. Sujet sans rapport = nouvelle session, ou `/clear`.

## Démarrer une fonctionnalité non triviale : interroge avant de coder
Si tu pourrais décrire le diff en une phrase, code directement — pas besoin de cette étape. Sinon :
1. Fais-toi interroger sur ce qui n'est pas encore tranché (implémentation, UX, cas limites, compromis) plutôt que de foncer.
2. Demande la rédaction d'un `SPEC.md` une fois les questions posées.
3. Ouvre une session séparée pour l'implémentation, avec seulement `SPEC.md` en tête — un contexte propre implémente mieux qu'un contexte encombré par la discussion qui a produit la spec.

## Pendant la session
- Corrige tôt. Deux corrections ratées sur le même point → arrête-toi, `/clear`, reformule avec ce que tu as appris plutôt que d'insister dans un contexte déjà pollué.
- `/clear` entre deux tâches sans rapport, même courtes.
- Une question annexe qui ne doit pas polluer le fil principal : pose-la en aparté plutôt que dans la conversation principale.

## Clore une session — les DEUX mémoires de ce projet
⚠️ Arbitrage du 2026-07-18 : ce projet a deux fichiers complémentaires, ne pas les confondre.
- **`docs/journal/sessions.md`** (créé au premier usage) — le **log de clôture**, une entrée par session :
```
## [date] — [objectif de la session]
Fait : [ce qui a été livré, vérifié comment]
Reporté : [ce qui reste, et pourquoi]
Prochaine étape : [ce qu'il faut reprendre]
```
- **`SESSION-PRD.md`** — la **photo de l'état courant** du code (compositions, charte, props, commandes). On le met à jour quand l'état change ; on n'y empile pas de log.

Et si la session a produit une décision structurante : elle va dans `decisions/` (voir `memoire-decisions.md`) — au moment où elle est prise, pas à la clôture.
