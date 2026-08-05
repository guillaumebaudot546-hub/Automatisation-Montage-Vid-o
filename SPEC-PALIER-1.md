# SPEC — Palier 1 : Hermes monte et livre depuis Telegram

**Date :** 2026-07-29 (v3) · **Références :** decisions/001-015 · **Statut :** à exécuter
**Remplace :** la v2 du 29/07 (pipeline maison) et la v1 du 18/07 (Remotion).

**Règle d'usage :** ouvrir une session Claude Code NEUVE avec ce fichier seul en
tête (`cycles-sessions.md`).

---

## Objectif (une phrase)

Le praticien envoie un rush + un texte sur Telegram ; il reçoit une vidéo montée
selon la doctrine, avec sous-titres, et valide — sans aucune intervention
manuelle de Guillaume.

## Le changement de nature (decisions/015)

**On n'écrit pas un pipeline. On approvisionne un agent.**

Hermes fournit déjà la passerelle Telegram, la boucle d'agent, l'état, la
mémoire et le moteur de skills. Le travail restant est de lui donner : sa
doctrine, ses outils, son moteur de rendu, et de quoi recevoir des fichiers
lourds.

| Ce qu'on n'écrit plus | Parce que |
|---|---|
| `bot.ts` (grammY) | Hermes **est** la passerelle Telegram |
| `etat.ts` (jobs, reprise) | Hermes gère sessions et mémoire persistante |
| La boucle de correction | Hermes dialogue nativement |

| Ce qu'on fournit | Sous quelle forme |
|---|---|
| La doctrine de montage | Skill Hermes (standard agentskills.io) |
| Les préférences praticien | Données de skill + `AGENTS.md` |
| Le portail doctrine | Outil appelé par l'agent |
| Le moteur de rendu | HyperFrames installé sur le VPS |
| La réception de gros fichiers | Serveur Bot API local (2 Go) |

---

## Étape 0 — Commander le VPS ⬅️ COMMENCER ICI

**Hetzner**, conformément à `prompt-deploiement-hermes.md`. Pas Hostinger : son
modèle repose sur un prix d'appel bas qui grimpe au renouvellement, avec
engagement long — exactement le « piège de renouvellement » que ce document
écartait.

**Configuration : 4 vCPU / 8 Go RAM / 160 Go SSD** — chez Hetzner, un **CPX32**
(gamme Regular Performance, AMD EPYC, ~13,49 €/mois — prix vérifié 2026 après la
refonte de gamme de juin, `CPX31` n'existe plus). Pas la config minimale à ~6 €.

*Option à budget serré :* **CX43** (Cost-Optimized, 8 vCPU / 16 Go / 160 Go,
~11,99 €/mois) offre plus de ressources pour moins cher, mais avec un partage de
vCPU plus agressif que CPX. Pour un rendu vidéo en navigateur headless, la
régularité du CPU compte plus que le prix — CPX32 reste le choix par défaut,
CX43 une option à considérer si le budget prime.

Pourquoi plus que ce que dit `hermes-vps-runbook.md` : ce runbook dimensionne un
agent qui **dialogue**. Celui-ci doit en plus :

- **rendre de la vidéo** — HyperFrames pilote un navigateur headless, gourmand
  en RAM et en CPU ;
- **héberger le serveur Bot API local**, qui bufferise sur disque des fichiers
  jusqu'à 2 Go ;
- **stocker** rushes (217 Mo pièce), rendus, images Docker et `~/.hermes`.

Payer 6 € pour un serveur incapable de rendre une vidéo est le mauvais type
d'économie. Localisation : Allemagne ou Finlande (RGPD, données de santé).

**Fini quand :** tu as une IP et une connexion SSH par clé.

## Étape 1 — Hermes vivant sur Telegram

Suivre `Déploiement Hermes IA/hermes-vps-runbook.md`, phases 1 à 7. Le runbook
est complet et sourcé — ne pas le réécrire, l'exécuter.

Résumé de ses phases : clé SSH → durcissement (utilisateur non-root, SSH
verrouillé, ufw, fail2ban, swap) → Docker + `docker compose up -d --build` →
modèle → skills → @BotFather + allowlist → service permanent.

> **Le seul point où il ne faut pas improviser** (le runbook le dit lui-même) :
> **l'allowlist de la phase 6.1.** Écris au bot depuis un compte Telegram NON
> listé dans `TELEGRAM_ALLOWED_USERS` : il doit rester muet. Sinon, coupe le
> gateway, corrige, reteste. Tout le reste se rattrape ; pas ça — c'est un
> service qui traitera des données de patients.

**Fini quand :** tu écris au bot depuis ton téléphone, il répond ; un compte
tiers n'obtient rien.

## Étape 2 — Le moteur de rendu sur le VPS

Installer Node + la CLI HyperFrames (**0.7.77**, la version alignée du socle) et
transférer `imcp-hyperframes/`. Vérifier qu'un rendu passe en ligne de commande,
**avant** d'impliquer l'agent.

⚠️ Le rendu headless demande des dépendances système (bibliothèques Chromium,
polices). Un rendu qui marche sous Windows peut échouer sur un VPS nu pour une
police manquante — vérifier visuellement le `.mp4` produit, pas seulement le code
de sortie.

**Fini quand :** `npx hyperframes render` produit sur le VPS un `.mp4` visuellement
identique à celui rendu en local.

## Étape 3 — La doctrine devient une skill

Le portage est un déplacement, pas une réécriture : Hermes suit le standard
**agentskills.io**, et `.claude/skills/montage-imcp/SKILL.md` en respecte déjà
le format.

1. Installer la skill `montage-imcp` dans Hermes
2. Y joindre `praticiens/client-01.json` (préférences + 4 exemples validés)
3. Mettre les règles permanentes dans `AGENTS.md` — mécanisme de contexte natif
   d'Hermes, lu à chaque conversation
4. Exposer `scripts/portail-doctrine.mjs` comme outil appelable

**Fini quand :** en conversation Telegram, `/montage-imcp` charge la doctrine, et
l'agent sait appeler le portail sur un plan de montage.

## Étape 4 — Les gros fichiers

Serveur Bot API local (`decisions/001`) sur le même VPS : la limite passe de
20 Mo à **2 Go**. Sans lui, tes rushes de 217 Mo ne peuvent pas entrer, et la
compression est la cause n°1 de rejet du praticien (`baudot.json`, corrections
du 18/07 v2 et v3).

**Fini quand :** un rush de 200+ Mo arrive intact et se rend sans recompression.

## Étape 5 — Le montage guidé par la doctrine

C'est seulement ici qu'intervient l'IA de sélection : scene-detect →
transcription → l'agent choisit les segments → **portail doctrine** → rendu.

Le portail ① existe, est testé, et rejette la faute historique du teaser v1 avec
15 motifs. Plafond **K=3** essais — non négociable, c'est ce qui borne le budget.

---

## Budget

**Infrastructure :** ~13,49 €/mois (CPX32) + nom de domaine éventuel.

**Modèle**, sur `claude-opus-5` (5 $ / 25 $ par million de tokens) :

| Poste | Volume | Coût |
|---|---|---|
| ~50 images clés en résolution standard | ~1 568 tokens/image → 78 400 | 0,39 $ |
| Doctrine + préférences + exemples + transcription | ~20 000 tokens | 0,10 $ |
| Sortie (timestamps + justification) | ~2 000 tokens | 0,05 $ |
| **Une passe** | | **~0,54 $** |
| **Plafond K=3** | | **~1,62 $ / vidéo** |

Deux leviers : le **cache de prompt** (doctrine et exemples sont un préfixe
stable → 0,1× sur les itérations 2 et 3, plafond réel sous 1,20 $) et la
**résolution** — monter à 2576 px triple le coût par image, rester en standard
sauf besoin prouvé.

---

## Sauvegarde — pas une formalité

`~/.hermes` contient **tout ce que l'agent a appris** : mémoire, sessions, skills
créées ou améliorées seules. Le perdre, c'est repartir de zéro.

La phase 9 du runbook fournit `backup-hermes.sh` + crontab + rapatriement hors
serveur. **Le rapatriement hors serveur est la partie qui compte** — une
sauvegarde qui vit sur la machine qu'elle protège ne protège de rien.

## HORS palier 1

Voix off, face cam, traduction, musique auto, ligne éditoriale hebdo,
descriptions de posts, images IA, publication automatique sur les réseaux.
→ paliers 2-3, `decisions/007-011`.

## Prérequis à fournir par Guillaume

1. **Compte Hetzner** + CPX32 commandé (~13,49 €/mois)
2. **Token de bot Telegram** : @BotFather → `/newbot`
3. **Ton ID Telegram** : @userinfobot → pour l'allowlist
4. **Clé API du modèle** (Anthropic, ou OpenRouter/Nous Portal selon le runbook)

Je ne peux créer aucun de ces comptes à ta place.

## Definition of Done

- [ ] Allowlist testée : un compte tiers écrit au bot et n'obtient **rien**
- [ ] Un rendu HyperFrames produit sur le VPS, vérifié **visuellement**
- [ ] `/montage-imcp` charge la doctrine en conversation Telegram
- [ ] Le portail doctrine rejette au moins un plan fautif en conditions réelles
- [ ] Un rush de 200+ Mo entre sans recompression
- [ ] **Test bout-en-bout** : rush envoyé depuis le téléphone de Guillaume →
      vidéo montée reçue dans Telegram
- [ ] Une correction en langage naturel → nouvelle version reçue
- [ ] Sauvegarde `~/.hermes` automatique **et rapatriée hors du serveur**
- [ ] Aucune publication sans validation explicite (contrôle déontologique)
- [ ] Preuves montrées : sorties de commandes + captures du flux Telegram

Le numéro ne va au Dr Baudot **qu'après** un test complet réussi depuis le
téléphone de Guillaume (mémo IMCP).
