# 015 — Hermes Agent est l'orchestrateur, pas un bot maison

**Date :** 2026-07-29 · **Statut :** Actif · **Modifie :** `SPEC-PALIER-1.md` (étapes 1 et 3)

## Contexte

Deux chemins visaient le même but sans qu'aucun document ne les compare.

`SPEC-PALIER-1.md` décrivait la construction d'un orchestrateur **maison** :
`bot.ts` (grammY), `sonde.ts`, `segments.ts`, `captions.ts`, `rendu.ts`,
`etat.ts` — tout en TypeScript, à écrire.

En parallèle, `Déploiement Hermes IA/` contient **84 Ko de runbooks** dont
`prompt-deploiement-hermes.md`, qui énonce :

> « Le but réel : reproduire sur le VPS la chaîne de production qu'on a déjà
> construite. Je puisse piloter depuis Telegram la même chaîne de production
> vidéo. »

Hermes Agent (Nous Research, MIT) fournit déjà, prêt à l'emploi : la passerelle
Telegram, la boucle d'agent, la mémoire persistante, un moteur de skills au
standard agentskills.io, 40+ outils, et un hôte MCP.

Écrire `bot.ts` à côté, c'est réimplémenter la passerelle Telegram, la file
d'état et la boucle de correction qu'Hermes livre déjà. C'est le motif exact qui
a coûté cher au projet : deux moteurs vidéo en parallèle pendant onze jours,
aucune décision écrite, la gouvernance décrivant celui qu'on n'utilisait plus
(`decisions/014`).

## Décision

**Hermes Agent est l'orchestrateur du service de montage.** Il n'y a pas de bot
Telegram maison.

Le travail n'est plus « écrire un pipeline » mais **approvisionner un agent** :

| Brique | Devient |
|---|---|
| Passerelle Telegram, file, état, corrections | **Fourni par Hermes** — rien à écrire |
| `.claude/skills/montage-imcp/SKILL.md` | **Skill Hermes** — même standard agentskills.io |
| `praticiens/client-01.json` | Données de la skill + fichier de contexte |
| `scripts/portail-doctrine.mjs` | **Outil** appelé par l'agent (shell, ou exposé en MCP) |
| `imcp-hyperframes/` + CLI HyperFrames | Installés sur le VPS, invoqués par l'agent |
| Règles permanentes du projet | `AGENTS.md` — mécanisme de contexte natif d'Hermes |

## Pourquoi

- **Le format de skill est déjà le bon.** Hermes suit agentskills.io ; la
  doctrine `montage-imcp` est un `SKILL.md` avec frontmatter. Le portage est un
  déplacement de fichier, pas une réécriture.
- **La boucle d'apprentissage existe nativement** (mémoire curatée, création et
  amélioration autonome de skills, recherche dans les sessions passées). La
  RÈGLE 6 de la doctrine — la boucle qui s'était arrêtée toute seule pendant dix
  jours faute de mécanisme — trouve enfin un moteur.
- **Moins de code = moins de dette.** Le projet a une dette documentée de
  planification sans exécution : 11 décisions sur 14 sans code. Le chemin qui
  demande d'écrire le moins est celui qui a le plus de chances d'exister.
- **Les 84 Ko de runbooks sont du travail déjà fait**, phasé et sourcé.

## Conséquences

### Sur la SPEC

`SPEC-PALIER-1.md` est réécrite. L'étape 1 n'est plus « écrire `bot.ts` » mais
« faire tourner Hermes sur le VPS et lui faire rendre une composition figée ».
`sonde.ts` et `segments.ts` deviennent des outils appelés par l'agent, pas des
modules d'un pipeline que nous cadençons.

### Sur le dimensionnement du VPS

`hermes-vps-runbook.md` dimensionne pour un agent qui dialogue (2 Go). Ce VPS
doit en plus **rendre de la vidéo** (HyperFrames = navigateur headless) et
héberger le **serveur Bot API local** qui bufferise des fichiers jusqu'à 2 Go.
Cible : **CPX32** (4 vCPU / 8 Go / 160 Go, ~13,49 €/mois — gamme Regular
Performance vérifiée après la refonte de gamme Hetzner de juin 2026 ;
l'ancienne référence `CPX31` n'existe plus), pas la configuration minimale du
runbook.

### Sur l'hébergeur

Hetzner, conformément à `prompt-deploiement-hermes.md`. Fly.io a été écarté
explicitement par Guillaume (`hermes-simple-cloud.md` reste comme trace de
l'option non retenue, pas comme instruction).

### Ce qui reste vrai de l'ancienne SPEC

Le découpage en étapes livrables séparément, le plafond K=3, le portail doctrine
comme portail ①, le budget chiffré, et la règle « le numéro ne va au Dr Baudot
qu'après un test complet réussi depuis le téléphone de Guillaume ».

### Documents périmés

`GUIDE-DEPLOIEMENT-AGENT-WHATSAPP.md` (16/07) est l'ancêtre de ce plan : agent
vidéo Hermes piloté par WhatsApp, sur template Remotion. Deux fois superseded —
WhatsApp → Telegram (`001`), Remotion → HyperFrames (`014`) — et remplacé par
`Déploiement Hermes IA/hermes-vps-runbook.md`. À archiver, pas à suivre.

## Note de méthode

Cette décision est écrite **avant** la location du VPS, pas onze jours après.
C'est précisément ce que `decisions/014` reprochait au projet de ne pas avoir
fait lors du basculement vers HyperFrames.
