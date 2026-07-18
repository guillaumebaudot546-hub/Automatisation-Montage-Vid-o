# 012 — GO palier 1, implémentation en session neuve

**Date :** 2026-07-18 · **Statut :** Actif

## Contexte
Le spike (004) a validé le séquençage (6/6 et 4/5). Guillaume a donné le go
(« fais ce qu'il faut »). La session en cours avait traité de nombreux sujets —
la doctrine (cycles-sessions.md) interdit d'y démarrer l'implémentation.

## Décision
- Le palier 1 est lancé, cadré par **`SPEC-PALIER-1.md`** (périmètre, hors-périmètre,
  architecture, DoD, ordre de build).
- L'implémentation se fait dans une **session Claude Code neuve**, avec le SPEC
  seul en tête.
- Développement **local d'abord** (long polling Telegram = aucun serveur requis
  pour développer et tester) ; VPS + serveur Bot API local au déploiement.

## Écarté
- Démarrer le build dans la session de cadrage (contexte pollué par 10 sujets).
- Remotion Lambda dès le palier 1 (rendu local via CLI suffit pour le pilote —
  Lambda repoussé, la decision 002 reste la cible long terme).

## Prérequis côté Guillaume (bloquants)
Token @BotFather + clé API Anthropic dans `.env` — voir SPEC, section prérequis.
