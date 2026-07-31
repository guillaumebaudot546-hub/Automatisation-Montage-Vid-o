# REPRISE — reprendre ce projet depuis une autre machine

> **Lis ce fichier en premier** si tu arrives sur ce projet depuis un nouvel
> ordinateur (Mac, Linux ou Windows). Il dit où est chaque chose, quoi installer,
> et ce qui reste à faire.
>
> Dernière mise à jour : 2026-07-31

---

## En une phrase

Le Dr Baudot envoie un rush sur Telegram ; un agent (Hermes) hébergé sur un VPS
le monte selon une doctrine écrite, vérifie son propre travail, et lui renvoie la
vidéo pour validation. Ce dépôt contient la doctrine, les outils et la procédure
de déploiement. **Le service tourne sur le VPS, pas sur ton ordinateur.**

## Ce dont tu as besoin sur la nouvelle machine

| Outil | Pourquoi | Vérifier avec |
|---|---|---|
| **git** | récupérer ce dépôt | `git --version` |
| **Node.js 20+** | moteur de rendu HyperFrames, portail doctrine | `node -v` |
| **ffmpeg** | découpe, recollage, inspection des vidéos | `ffmpeg -version` |
| **Une clé SSH** autorisée sur le VPS | administrer le serveur | voir plus bas |

Sur **macOS**, tout s'installe avec [Homebrew](https://brew.sh) :

```bash
brew install git node ffmpeg
```

Sur **Windows**, `winget install Git.Git OpenJS.NodeJS Gyan.FFmpeg`.

## Récupérer le projet

```bash
git clone https://github.com/guillaumebaudot546-hub/Automatisation-Montage-Vid-o.git
cd Automatisation-Montage-Vid-o
npm install
npm run check
```

`npm run check` doit finir **vert**. S'il est rouge, répare avant toute autre
chose — c'est une règle du projet, pas une suggestion.

Le lint affiche une vingtaine d'**avertissements** Remotion (`non-pure-animation`)
sur du code hérité : c'est attendu, `0 errors` est ce qui compte.

Le dépôt est **privé**. Il te faudra être authentifié auprès de GitHub
(`gh auth login`, ou une clé SSH GitHub).

> **Les rushes et les rendus ne sont PAS dans le dépôt** (médias lourds, exclus
> par `.gitignore`). Tu récupères le code et la doctrine, pas les vidéos. Les
> rendus se refont avec `npm run render` dans le dossier de chaque composition.
>
> Conséquence : sur un clone frais, le test d'intégrité des médias **se met en
> veille** (il n'a rien à vérifier). Dès que tu rapatries les rushes dans
> `public/`, il redevient actif et signale tout chemin fautif. Si tu veux
> travailler sur les compositions Remotion, copie les médias depuis la machine
> qui les détient — ils ne transiteront jamais par GitHub.

## Où est quoi

| Tu cherches… | C'est ici |
|---|---|
| **Le point d'entrée pour l'IA** | [`CLAUDE.md`](CLAUDE.md) — à lire en entier au démarrage |
| **La doctrine de montage** | [`.claude/skills/montage-imcp/SKILL.md`](.claude/skills/montage-imcp/SKILL.md) |
| **Les préférences du praticien** | [`praticiens/baudot.json`](praticiens/baudot.json) — corrections datées + exemples validés |
| **Les décisions structurantes** | [`decisions/`](decisions/README.md) — 15 décisions indexées |
| **La gouvernance** | [`docs/gouvernance/`](docs/gouvernance/) — architecture, vérification, mémoire, sessions, sous-agents |
| **L'historique des sessions** | [`docs/journal/sessions.md`](docs/journal/sessions.md) — ce qui a été fait et pourquoi |
| **Le plan du palier en cours** | [`SPEC-PALIER-1.md`](SPEC-PALIER-1.md) |
| **Tout le déploiement VPS** | [`deploiement/`](deploiement/) — voir ci-dessous |
| **La charte graphique** | [`src/theme/baudot.ts`](src/theme/baudot.ts) — **source de vérité unique** |
| **Les compositions vidéo** | [`imcp-hyperframes/`](imcp-hyperframes/) — moteur actif |
| **Remotion** | [`src/`](src/) — **maintenance seulement**, on n'y construit plus |

### Le dossier `deploiement/`

| Fichier | Rôle |
|---|---|
| `hermes-vps-runbook.md` | La procédure complète d'installation du VPS, en 10 phases |
| `AGENTS-vps.md` | **Les règles permanentes de l'agent** — déployé sur le VPS en `~/.hermes/AGENTS.md` |
| `backup-hermes.sh` | Sauvegarde nocturne de la mémoire de l'agent (tourne sur le VPS) |
| `rapatrier-sauvegarde.sh` | **Rapatrie la sauvegarde hors du serveur** — à lancer depuis ta machine |
| `docker-compose.tg-bot-api.yaml` | Serveur Telegram local (fait passer la limite de 20 Mo à 2 Go) |
| `portail-doctrine-wrapper.sh` | Rend le portail appelable de n'importe où sur le VPS |
| `decouper-rush.ps1` | Découpe un rush > 2 Go avant envoi Telegram, sans réencoder |

**Si tu modifies un de ces fichiers, redéploie-le sur le VPS** — la copie du
serveur ne se met pas à jour toute seule. Les commandes sont dans
`docs/journal/sessions.md`, entrées du 30 et 31 juillet.

## Se connecter au VPS

```bash
ssh -i ~/.ssh/ta_cle root@78.47.14.178
```

**Ta clé SSH ne se copie pas depuis l'autre machine par simple glisser-déposer.**
Deux options :

1. **Recommandé** — génère une nouvelle paire sur le Mac
   (`ssh-keygen -t ed25519 -C "mac-imcp"`), puis ajoute la clé **publique** au
   serveur, depuis une machine qui y a déjà accès :
   ```bash
   ssh root@78.47.14.178 "echo 'CONTENU_DE_LA_CLE_PUBLIQUE' >> ~/.ssh/authorized_keys"
   ```
2. Copier la clé privée existante — possible, mais une clé privée qui voyage est
   une clé privée qui fuit. Si tu le fais : `chmod 600` à l'arrivée, et jamais
   par mail ni messagerie.

Compte non-root disponible : `guillaume@78.47.14.178` (c'est lui qui fait tourner
l'agent).

## Vérifier que le service tourne

```bash
ssh root@78.47.14.178 "systemctl is-active hermes-gateway.service; docker ps --filter name=tg-bot-api --format '{{.Status}}'"
```

Attendu : `active` et `Up ...`. Sinon :

```bash
ssh root@78.47.14.178 "systemctl restart hermes-gateway.service; cd /home/guillaume/tg-bot-api && docker compose up -d"
```

**Ton ordinateur n'a aucun rôle dans le fonctionnement quotidien.** Il sert à
administrer et à développer. Tu peux l'éteindre : le bot continue de répondre.

## Sauvegarde — à faire régulièrement

Le VPS produit une archive chaque nuit à 3 h. **Rapatrie-la sur ta machine** :

```bash
./deploiement/rapatrier-sauvegarde.sh
```

Elle atterrit dans `~/Sauvegardes/hermes/`. Le script vérifie l'intégrité et ne
garde que les 8 dernières.

⚠️ **L'archive contient les clés d'API et le token du bot.** Ne la dépose pas
telle quelle sur un cloud partagé.

## Ce qui reste à faire (palier 1)

| | Point de la Definition of Done |
|---|---|
| ❌ | **Allowlist testée** — un compte tiers écrit au bot et n'obtient rien. *Le spec désigne ce point comme le seul à ne pas improviser : données de patients.* |
| ❌ | **Root SSH à désactiver** (`PermitRootLogin no`) — dette assumée le 30/07, à solder avant toute donnée patient |
| ❌ | Correction en langage naturel → nouvelle version reçue |
| 🟡 | Test bout-en-bout réussi (le premier essai a échoué : portail non appelé) |
| ✅ | Rendu VPS vérifié visuellement · doctrine chargée · portail rejette un plan fautif · rush > 20 Mo · sauvegarde rapatriée |

## Les règles à ne pas contourner

1. **Aucune publication sans validation explicite du praticien** — données de santé.
2. **Jamais de rendu sans avoir appelé le portail doctrine.** Plafond 3 essais.
3. **La voix n'est jamais hachée** — coupes aux frontières de phrases uniquement.
4. **L'accent est le cyan `#49B6C9`.** Le beige `#d8c7a8` est un bug.
5. **Aucune musique sous droits.** Une œuvre du domaine public ne rend pas son
   enregistrement libre.
6. **Rien n'est « terminé » sans preuve** — sortie de commande, pas affirmation.

Le détail vit dans [`CLAUDE.md`](CLAUDE.md) et la doctrine.
