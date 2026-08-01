# Hermes Agent sur VPS — procédure complète

**Cible** : un agent Hermes qui tourne 24/7 sur un serveur distant, avec sa base de skills, joignable depuis une messagerie (Telegram, Discord, Slack, WhatsApp, Signal, e-mail).

**Logiciel** : [Hermes Agent](https://github.com/NousResearch/hermes-agent) de Nous Research — licence MIT. Monorepo Python (agent, CLI, gateway) + Node (desktop Electron, bridge WhatsApp, dashboard web).

**Documentation officielle** : <https://hermes-agent.nousresearch.com/docs/>

> **Origine des informations de ce document.** Tout ce qui est marqué ✅ a été vérifié directement dans les sources de la version que tu as déjà installée localement (`%LOCALAPPDATA%\hermes\hermes-agent`, v0.0.1) : `README.md`, `SECURITY.md`, `docker-compose.yml`, `.env.example`, `pyproject.toml`, `cli.py`. Ce qui est marqué ⚠️ demande une vérification sur la doc en ligne au moment où tu l'exécutes — soit parce que le détail vit côté fournisseur (Telegram, OVH…), soit parce que le projet est en v0.0.1 et bouge vite.

---

## Sommaire

| Phase | Objet | Durée |
|---|---|---|
| [0](#phase-0--décisions-à-prendre-avant-de-payer) | Décisions préalables | 10 min |
| [1](#phase-1--provisionner-le-vps) | Provisionner le VPS | 10 min |
| [2](#phase-2--durcir-le-serveur-ne-pas-sauter) | Durcir le serveur | 20 min |
| [3](#phase-3--installer-hermes) | Installer Hermes | 15 min |
| [4](#phase-4--brancher-un-modèle) | Brancher un modèle | 5 min |
| [5](#phase-5--la-base-de-skills) | Base de skills | 15 min |
| [6](#phase-6--connecter-la-messagerie) | Connecter la messagerie | 20 min |
| [7](#phase-7--faire-tourner-en-permanence) | Service permanent | 10 min |
| [8](#phase-8--dashboard-en-tunnel-ssh) | Dashboard (tunnel SSH) | 5 min |
| [9](#phase-9--sauvegardes-et-mises-à-jour) | Sauvegardes, mises à jour | 15 min |
| [10](#phase-10--checklist-de-sécurité-avant-ouverture) | Checklist sécurité | 10 min |

Compter **2 h** au total en prenant son temps, dont beaucoup d'attente (téléchargements, propagation DNS si tu en mets).

---

## Avertissement à lire en premier

Hermes est un agent **avec accès shell** à la machine sur laquelle il tourne. C'est tout son intérêt, et c'est aussi tout le risque. Trois conséquences concrètes :

1. **Toute personne qui peut écrire au bot peut faire exécuter des commandes sur ton VPS.** D'où la règle absolue de la phase 6 : une *allowlist* d'utilisateurs autorisés, sans exception. `SECURITY.md` du projet est explicite — un adaptateur exposé au réseau sans allowlist est considéré comme un bug, pas comme une configuration permissive. ✅
2. **Le dashboard stocke tes clés d'API en clair.** Il écoute sur `127.0.0.1` par défaut. Ne l'expose jamais sur Internet — on y accède par tunnel SSH (phase 8). ✅
3. **La seule vraie frontière de sécurité est l'isolation du conteneur.** Ni la validation de commandes, ni le filtrage de motifs destructeurs, ni les listes d'outils autorisés ne sont considérés comme des barrières fiables par les auteurs eux-mêmes. ✅ C'est pourquoi ce document recommande le déploiement **Docker** et pas l'installation directe sur l'hôte.

Conséquence pratique : mets cet agent sur un VPS **dédié à ça**. Pas sur la machine qui héberge un site de production, une base client ou quoi que ce soit qui contienne des données de patients.

---

## Phase 0 — Décisions à prendre avant de payer

Quatre choix. Les trois premiers sont réversibles à peu de frais, le quatrième moins.

### 0.1 — Hébergeur

Le README annonce « un VPS à 5 $ ». C'est réaliste pour l'agent lui-même, qui n'exécute pas le modèle : l'inférence part chez un fournisseur d'API. Le VPS ne fait que porter la boucle d'agent, le gateway et les outils.

| Hébergeur | Entrée de gamme | Remarque |
|---|---|---|
| **Hetzner** (CX22) | 3,79 € + 0,50 € IPv4 = **4,29 €/mois HT**, 2 vCPU / 4 Go / 40 Go | Meilleur rapport ressources/prix. Datacenters DE/FI. |
| **OVH / Scaleway** | ~5 €/mois | Français, facturation FR, RGPD simple à justifier. |
| **DigitalOcean / Vultr / Linode** | 5–6 $/mois, 1 Go | Écosystème et docs très fournis. |

**Recommandation : Hetzner CX22** (2 vCPU / 4 Go), ou un équivalent d'au moins 2 Go. Le CX22 dépasse le plancher, c'est voulu : 2 Go est le minimum vital, pas la cible.

Sur le dimensionnement, sois prudent : **je n'ai trouvé aucun minimum de RAM déclaré** dans les sources du projet. ⚠️ Le « 5 $ VPS » du README correspond typiquement à 1 Go. Or l'image Docker embarque Python 3.11+, Node, ffmpeg, ripgrep, et le gateway peut faire tourner plusieurs adaptateurs en parallèle. Sur 1 Go tu vivras sous la menace du OOM-killer. Prends **2 Go**, et ajoute du swap (phase 2.6) quoi qu'il arrive.

Localisation : prends l'Europe. La latence compte peu (l'agent est asynchrone), mais si tu traites un jour des données liées à ton activité médicale, un hébergeur et un datacenter européens simplifient beaucoup la conversation RGPD.

### 0.2 — Système

**Ubuntu 24.04 LTS.** C'est ce que visent les scripts d'installation et la majorité de la doc. Debian 12 marche aussi. Évite Alpine (musl casse des roues Python) et les distributions exotiques.

### 0.3 — Messagerie

Choisis maintenant, ça conditionne la phase 6.

| Plateforme | Difficulté | Ce qu'il faut | Verdict |
|---|---|---|---|
| **Telegram** | ⭐ Très simple | Un token via @BotFather, 2 min | **Commence par là**, même si tu comptes utiliser autre chose ensuite |
| **Discord** | ⭐⭐ Simple | Application + bot dans le portail développeur | Bon si tu as déjà un serveur |
| **Slack** | ⭐⭐⭐ Moyen | App Slack, deux tokens (`xoxb-` + `xapp-`), scopes | Pertinent en usage pro/équipe |
| **E-mail** | ⭐⭐ Simple | IMAP/SMTP | Pratique pour les rapports asynchrones |
| **Signal** | ⭐⭐⭐⭐ Difficile | `signal-cli`, un numéro dédié | Le plus privé, le plus pénible |
| **WhatsApp** | ⭐⭐⭐⭐⭐ Le pire | Bridge Node, appairage QR, non officiel | Voir l'avertissement en 6.5 |

**Recommandation : Telegram pour la mise en route.** Le gateway gère plusieurs plateformes simultanément — tu en ajouteras d'autres après, sans rien casser. Valider la chaîne complète avec la plateforme la plus simple t'évite de confondre un problème de configuration Hermes avec un problème d'API tierce.

### 0.4 — Fournisseur de modèle

Hermes est agnostique. Vérifié dans le README : Nous Portal, OpenRouter (200+ modèles), NovitaAI, NVIDIA NIM, Xiaomi MiMo, z.ai/GLM, Kimi/Moonshot, MiniMax, Hugging Face, OpenAI, ou n'importe quel endpoint compatible. ✅

Deux voies :

- **Nous Portal** (`hermes setup --portal`) — un abonnement, un login OAuth, et tu obtiens le modèle *plus* le Tool Gateway (recherche web Firecrawl, génération d'images FAL, TTS OpenAI, navigateur cloud Browser Use). ✅ Le moins de frottement : une seule clé au lieu de cinq comptes.
- **Clé par service** — plus de contrôle, plus de comptes à gérer. OpenRouter est le meilleur compromis si tu veux garder la main sur le choix de modèle.

Tu peux mélanger : le Tool Gateway se règle par backend, pas en tout-ou-rien. ✅

> **Note sur ce que tu as déjà.** Hermes est installé sur ton poste Windows (`%LOCALAPPDATA%\hermes`). Ta config locale — provider, modèle, skills — vit dans `~/.hermes`. Elle n'est **pas** transférée automatiquement vers le VPS : les deux installations sont indépendantes. Tu peux copier des morceaux de config à la main, mais reconfigure les secrets côté serveur plutôt que de recopier des clés d'un poste à l'autre.

---

## Phase 1 — Provisionner le VPS

Cette phase se fait dans l'interface de ton hébergeur. Je ne peux pas la faire à ta place : elle demande ton compte et ton moyen de paiement.

### 1.1 — Générer une paire de clés SSH (sur ton poste Windows, pas sur le serveur)

```bash
ssh-keygen -t ed25519 -C "hermes-vps" -f "$HOME/.ssh/hermes_vps"
```

Mets une passphrase. Deux fichiers apparaissent :
- `~/.ssh/hermes_vps` — la clé **privée**. Elle ne quitte jamais ton poste.
- `~/.ssh/hermes_vps.pub` — la clé **publique**. C'est celle-là que tu colles chez l'hébergeur.

Récupère la publique :

```bash
cat "$HOME/.ssh/hermes_vps.pub"
```

### 1.2 — Créer le serveur

Dans l'interface de l'hébergeur :

1. Image : **Ubuntu 24.04 LTS**
2. Type : 2 vCPU, 2 Go de RAM **au minimum** — le CX22 recommandé en offre 4
3. Localisation : Europe (Nuremberg, Helsinki, Gravelines, Paris…)
4. **Clé SSH : colle la clé publique de l'étape 1.1.** Ne choisis pas l'authentification par mot de passe.
5. Nom : `hermes-agent`
6. IPv4 : oui (certaines API tierces sont mal à l'aise en IPv6 seul)

Note l'adresse IP publique attribuée.

### 1.3 — Première connexion

```bash
ssh -i "$HOME/.ssh/hermes_vps" root@ADRESSE_IP
```

À la première connexion, SSH affiche l'empreinte de la clé du serveur et demande confirmation. En principe on la compare à celle affichée dans la console de l'hébergeur. En pratique presque personne ne le fait ; si tu veux le faire proprement, l'empreinte est visible dans la console web ou via le KVM de l'hébergeur.

---

## Phase 2 — Durcir le serveur (ne pas sauter)

Un VPS avec une IP publique reçoit des tentatives de connexion automatisées dans l'heure qui suit sa création. Ces étapes ne sont pas optionnelles, et elles précèdent l'installation d'Hermes — pas l'inverse.

Tout ce qui suit s'exécute **sur le serveur**, connecté en root.

### 2.1 — Mettre à jour

```bash
apt update && apt upgrade -y
```

Si un redémarrage est demandé (`/var/run/reboot-required`), fais-le tout de suite : `reboot`, puis reconnecte-toi.

### 2.2 — Créer un utilisateur non-root

Hermes ne doit pas tourner en root.

```bash
adduser --disabled-password --gecos "" hermes
usermod -aG sudo hermes
```

Reporte ta clé SSH sur ce compte :

```bash
mkdir -p /home/hermes/.ssh
cp /root/.ssh/authorized_keys /home/hermes/.ssh/authorized_keys
chown -R hermes:hermes /home/hermes/.ssh
chmod 700 /home/hermes/.ssh
chmod 600 /home/hermes/.ssh/authorized_keys
```

Donne-lui un mot de passe (il servira pour `sudo`) :

```bash
passwd hermes
```

**Vérifie maintenant, depuis une seconde fenêtre de terminal, que ça fonctionne** — avant de couper l'accès root :

```bash
ssh -i "$HOME/.ssh/hermes_vps" hermes@ADRESSE_IP
sudo whoami   # doit répondre : root
```

Si cette vérification échoue, ne passe pas à 2.3. Tu te fermerais dehors.

### 2.3 — Verrouiller SSH

```bash
sudo nano /etc/ssh/sshd_config
```

Règle ces quatre directives (décommente si nécessaire) :

```
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
X11Forwarding no
```

Applique :

```bash
sudo sshd -t && sudo systemctl restart ssh
```

Le `sshd -t` teste la syntaxe avant de recharger. S'il renvoie une erreur, **corrige-la avant de redémarrer le service** : un fichier de conf invalide peut te bloquer l'accès.

Garde ta session courante ouverte et teste dans une nouvelle fenêtre. Tant que la session actuelle est vivante, tu as un filet.

### 2.4 — Pare-feu

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw enable
sudo ufw status verbose
```

Remarque importante : **on n'ouvre que le port 22.** Le gateway Hermes en mode *polling* (Telegram, Discord, Slack en Socket Mode) établit des connexions **sortantes** — il n'a besoin d'aucun port entrant. C'est un vrai avantage de sécurité, et la raison pour laquelle je recommande le polling plutôt que les webhooks.

Tu n'ouvriras un port entrant que si tu choisis les webhooks Telegram (`TELEGRAM_WEBHOOK_PORT`, ✅) ou l'API compatible OpenAI — deux cas traités plus loin, avec leurs précautions.

### 2.5 — fail2ban

```bash
sudo apt install -y fail2ban
sudo systemctl enable --now fail2ban
sudo fail2ban-client status sshd
```

Avec `PasswordAuthentication no`, le bruteforce SSH est déjà sans objet. fail2ban sert surtout à faire taire les logs et à couper les scanners.

### 2.6 — Swap

Indispensable sur 1 Go, fortement conseillé sur 2 Go.

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

Sur un VPS à disque SSD/NVMe, réduire la tendance à swapper évite l'usure inutile :

```bash
echo 'vm.swappiness=10' | sudo tee /etc/sysctl.d/99-swappiness.conf
sudo sysctl --system
```

Vérifie : `free -h`

### 2.7 — Fuseau horaire

L'agent a un planificateur cron intégré. ✅ Un fuseau mal réglé et tes tâches de 8 h du matin partent à 9 h.

```bash
sudo timedatectl set-timezone Europe/Paris
timedatectl
```

### 2.8 — Mises à jour de sécurité automatiques

```bash
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

## Phase 3 — Installer Hermes

Deux voies. Elles ne se valent pas.

### Voie A — Docker (recommandée)

C'est la voie à privilégier, pour la raison exposée en tête de document : **l'isolation du conteneur est la seule frontière de sécurité que les auteurs considèrent comme solide**. ✅ Un agent qui peut lancer des commandes shell est bien mieux dans un conteneur que sur l'hôte.

Le dépôt fournit un `Dockerfile` et un `docker-compose.yml` prêts. ✅

#### 3.A.1 — Installer Docker

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker hermes
```

Déconnecte-toi et reconnecte-toi pour que l'appartenance au groupe `docker` prenne effet, puis vérifie :

```bash
docker run --rm hello-world
```

#### 3.A.2 — Récupérer les sources

```bash
cd ~
git clone https://github.com/NousResearch/hermes-agent.git
cd hermes-agent
```

#### 3.A.3 — Construire et lancer

Les variables `HERMES_UID` / `HERMES_GID` sont **obligatoires** : elles alignent l'utilisateur interne du conteneur sur celui qui possède `~/.hermes` côté hôte. Sans elles, tu te retrouves avec des fichiers appartenant à l'UID 10000 que tu ne peux plus lire. ✅

```bash
HERMES_UID=$(id -u) HERMES_GID=$(id -g) docker compose up -d --build
```

La première construction prend un moment (Python, Node, ffmpeg, ripgrep).

Le compose définit deux services : ✅
- **`gateway`** — le processus principal, commande `gateway run`, `restart: unless-stopped`
- **`dashboard`** — l'interface web, sur `127.0.0.1:9119`, jamais exposée

Les données persistent via le volume `~/.hermes:/opt/data`. ✅ C'est ce répertoire qu'il faudra sauvegarder (phase 9).

Vérifie :

```bash
docker compose ps
docker compose logs -f gateway
```

> **Deux pièges Docker documentés dans le compose.** ✅
> 1. Si tu redéfinis l'`entrypoint`, `/init` doit rester la première commande de la chaîne. C'est le PID 1 de s6-overlay : il exécute les scripts d'initialisation (droits, réconciliation de profil) et met en place l'arbre de supervision. Le contourner casse le gateway silencieusement.
> 2. Le compose utilise `network_mode: host`. Le conteneur partage donc la pile réseau de l'hôte — ton `ufw` s'applique, mais ne compte pas sur l'isolation réseau du conteneur comme couche de sécurité.

Pour lancer une commande Hermes dans le conteneur :

```bash
docker compose exec gateway hermes doctor
```

### Voie B — Installation directe sur l'hôte

Plus simple à explorer, moins bien isolée. Acceptable pour un VPS jetable dédié, à éviter si la machine porte autre chose.

```bash
curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash
source ~/.bashrc
```

> **Sur le `curl | bash`.** Ce motif exécute du code distant sans revue. C'est la méthode officielle du projet, et Hermes est de toute façon un agent auquel tu vas confier un shell — le modèle de menace est particulier. Si tu veux quand même regarder avant d'exécuter :
> ```bash
> curl -fsSL https://hermes-agent.nousresearch.com/install.sh -o install.sh
> less install.sh
> bash install.sh
> ```

L'installateur prend en charge `uv`, Python 3.11, Node.js, ripgrep et ffmpeg. ✅ Contrainte de version vérifiée dans `pyproject.toml` : **Python ≥ 3.11 et < 3.14**. ✅ Ubuntu 24.04 fournit 3.12, c'est bon.

Vérifie :

```bash
hermes doctor
```

`hermes doctor` est ton outil de diagnostic tout au long de ce document. ✅

---

## Phase 4 — Brancher un modèle

Sans modèle, l'agent ne fait rien. Deux options selon le choix de la phase 0.4.

### 4.1 — Voie Nous Portal (la plus courte)

```bash
hermes setup --portal
```

Login OAuth, provider réglé sur Nous, Tool Gateway activé. ✅

Sur un serveur sans navigateur, l'OAuth va afficher une URL à ouvrir sur ton poste. ⚠️ Le mécanisme exact (code d'appairage ou redirection locale) dépend de la version — suis ce qu'affiche le terminal. Si le flux exige une redirection vers `localhost`, ouvre un tunnel depuis ton poste :

```bash
ssh -i "$HOME/.ssh/hermes_vps" -L 8080:localhost:8080 hermes@ADRESSE_IP
```

Contrôle ensuite : `hermes portal info` ✅

### 4.2 — Voie clé par service

```bash
hermes setup        # assistant complet
# ou, plus ciblé :
hermes model        # choix du provider et du modèle
hermes config set   # valeur par valeur
```

`hermes model` liste les providers disponibles et permet de basculer sans toucher au code. ✅ En session, la commande `/model <nom>` fait la même chose à chaud. ✅

### 4.3 — Test

```bash
hermes
```

Tu obtiens la TUI (édition multiligne, autocomplétion des slash-commands, historique, sortie d'outils en streaming). ✅ Dis-lui bonjour. Si la réponse arrive, la chaîne modèle est bonne.

En Docker : `docker compose exec gateway hermes`

---

## Phase 5 — La base de skills

C'est le cœur de ce qui rend Hermes intéressant. Trois couches distinctes, qu'il vaut mieux ne pas confondre.

### 5.1 — Ce que contient l'installation

Vérifié dans les sources : ✅

- **`skills/`** — les skills fournies, par domaine : `apple`, `autonomous-ai-agents`, `creative`, `data-science`, `devops`, `dogfood`, `email`, `github`, `media`, `mlops`, `note-taking`, `productivity`, `research`, `smart-home`, plus un `index-cache`.
- **`optional-skills/`** — 19 catégories supplémentaires, non activées par défaut : `blockchain`, `communication`, `finance`, `gaming`, `health`, `mcp`, `migration`, `security`, `software-development`, `web-development`…

### 5.2 — Skills Hub

Hermes est compatible avec le standard ouvert **[agentskills.io](https://agentskills.io)**. ✅

Sous-commandes confirmées dans `cli.py` : ✅

```bash
hermes skills search <terme>    # chercher dans le hub
hermes skills browse            # parcourir
hermes skills install <nom>     # installer
```

En conversation, `/skills` liste ce qui est disponible et `/<nom-du-skill>` en invoque un directement. ✅

⚠️ Les options fines de ces commandes (portée, épinglage de version, mise à jour en masse) ne sont pas documentées dans le README local. Lance-les avec `--help` sur ta version.

### 5.3 — La boucle d'apprentissage

C'est la particularité du projet, et ça mérite d'être compris avant de l'activer, parce que ça écrit sur le disque tout seul. Ce que le README annonce : ✅

- **Mémoire curatée par l'agent**, avec des rappels périodiques pour persister ce qui compte
- **Création autonome de skills** après une tâche complexe
- **Auto-amélioration des skills** en cours d'usage
- **Recherche dans les sessions passées** via SQLite FTS5 avec résumé par LLM
- **Modélisation de l'utilisateur** via [Honcho](https://github.com/plastic-labs/honcho)

Autrement dit, l'agent fabrique et modifie ses propres skills au fil du temps. C'est puissant et c'est exactement pourquoi la sauvegarde de `~/.hermes` (phase 9) n'est pas une formalité : **c'est là que vit tout ce que ton agent a appris.** Perdre ce répertoire, c'est repartir de zéro.

### 5.4 — Outils

```bash
hermes tools
```

40+ outils organisés en *toolsets*, activables par groupe. ✅ Le principe à garder en tête : chaque outil activé est une capacité de plus, donc une surface de risque de plus. N'active pas tout « au cas où ».

### 5.5 — MCP

Hermes est hôte MCP : tu peux brancher n'importe quel serveur MCP pour étendre ses capacités. ✅ Le fichier `mcp_serve.py` à la racine indique qu'il peut aussi **exposer** ses propres outils en MCP. ⚠️ Vérifie la page MCP de la doc pour la configuration précise.

### 5.6 — Fichiers de contexte

Hermes lit des fichiers de contexte qui façonnent chaque conversation. ✅ Le dépôt contient d'ailleurs un `AGENTS.md` de 71 Ko — c'est le mécanisme appliqué à lui-même. C'est là que tu mettras tes règles permanentes (ton métier, tes conventions, ce que l'agent doit toujours ou ne jamais faire).

---

## Phase 6 — Connecter la messagerie

### 6.1 — La règle non négociable

Avant toute chose. `SECURITY.md` est catégorique, et je le reformule parce que c'est le point où une erreur coûte cher : ✅

> **Une allowlist est obligatoire pour chaque adaptateur exposé au réseau.** Un adaptateur sans allowlist ne doit ni traiter de requête, ni router d'approbation, ni relayer de sortie. Le projet qualifie de **bug** tout chemin de code qui échoue en mode ouvert.

Concrètement : un bot Telegram est joignable par n'importe qui connaissant son nom. Sans `TELEGRAM_ALLOWED_USERS`, le premier inconnu qui tombe dessus obtient un shell sur ton VPS. Ce n'est pas un risque théorique.

Variables d'allowlist vérifiées dans `.env.example` : ✅

```
TELEGRAM_ALLOWED_USERS      # IDs séparés par des virgules
SLACK_ALLOWED_USERS
WHATSAPP_ALLOWED_USERS
TEAMS_ALLOWED_USERS
GOOGLE_CHAT_ALLOWED_USERS
```

### 6.2 — Configuration guidée

```bash
hermes gateway setup
```

L'assistant couvre les plateformes. ✅ En Docker :

```bash
docker compose exec gateway hermes gateway setup
```

### 6.3 — Telegram (voie recommandée)

**a. Créer le bot.** Dans Telegram, écris à **@BotFather** : `/newbot`, choisis un nom et un identifiant. Il renvoie un token de la forme `123456789:AAE...`.

Ce token est un secret équivalent à un mot de passe. Ne le mets pas dans un fichier versionné par git.

**b. Récupérer ton ID utilisateur numérique.** Écris à **@userinfobot**, il renvoie ton ID (un nombre, pas ton `@pseudo`). C'est ce nombre qui va dans l'allowlist.

**c. Configurer.** Via l'assistant (`hermes gateway setup`), ou directement dans `~/.hermes/.env` :

```bash
TELEGRAM_BOT_TOKEN=123456789:AAE...
TELEGRAM_ALLOWED_USERS=123456789
TELEGRAM_HOME_CHANNEL=123456789
```

`TELEGRAM_HOME_CHANNEL` est le salon par défaut pour la livraison des tâches cron. ✅

Protège le fichier :

```bash
chmod 600 ~/.hermes/.env
```

**d. Démarrer.**

```bash
hermes gateway start
```

**e. Tester.** Écris à ton bot dans Telegram. Il doit répondre.

Puis vérifie l'allowlist — c'est le test qui compte : demande à quelqu'un d'autre (ou depuis un second compte) d'écrire au bot. **Il ne doit rien obtenir.** Si un compte non listé reçoit une réponse, arrête le gateway et corrige avant d'aller plus loin.

**f. Polling ou webhook ?** Par défaut, polling : aucun port entrant, rien à ouvrir dans `ufw`. **Reste là-dessus.** Les webhooks (`TELEGRAM_WEBHOOK_URL`, `TELEGRAM_WEBHOOK_PORT=8443`, `TELEGRAM_WEBHOOK_SECRET`) ✅ imposent un port ouvert, un certificat TLS valide et un reverse proxy. Ça ne se justifie qu'à fort volume. Si tu y viens un jour, `TELEGRAM_WEBHOOK_SECRET` est marqué « recommended for production » dans les sources — traite-le comme obligatoire.

### 6.4 — Slack, Discord, e-mail

Mêmes principes, secrets différents.

**Slack** — deux tokens : `SLACK_BOT_TOKEN` (`xoxb-…`) et `SLACK_APP_TOKEN` (`xapp-…`), plus `SLACK_ALLOWED_USERS`. ✅ Le second indique un fonctionnement en Socket Mode, donc sans port entrant. ⚠️ Les scopes OAuth à accorder sont à prendre dans la doc messagerie.

**Discord** — application + bot dans le portail développeur, token, invitation sur ton serveur. ⚠️ Nom exact des variables à confirmer dans l'assistant.

**E-mail** — IMAP/SMTP. Utilise un compte dédié et un mot de passe d'application, jamais les identifiants principaux de ta boîte.

### 6.5 — WhatsApp : à lire avant de t'y lancer

Le dépôt contient `scripts/whatsapp-bridge/` (un projet Node séparé) et `.env.example` expose `WHATSAPP_ENABLED` et `WHATSAPP_ALLOWED_USERS`. ✅

Trois raisons de garder ça pour la fin :

1. **Ce n'est pas l'API officielle WhatsApp Business.** Un bridge qui pilote un compte utilisateur passe par des voies non supportées par Meta. Le compte peut être suspendu.
2. **L'appairage se fait par QR code**, à refaire à chaque expiration de session — pénible sur un serveur sans écran.
3. **La session est un secret de premier ordre** : elle donne accès à ton compte WhatsApp personnel.

Si WhatsApp est ton objectif final, fais quand même Telegram d'abord. Ça valide tout le reste de la chaîne et t'évite de déboguer deux inconnues à la fois.

---

## Phase 7 — Faire tourner en permanence

### Si tu es en Docker

C'est déjà fait : `restart: unless-stopped` dans le compose. ✅ Le conteneur redémarre au reboot et après un crash.

```bash
docker compose ps
docker compose logs -f gateway
docker compose restart gateway
```

### Si tu es en installation directe

Il faut un service systemd. Adapte le chemin de `hermes` (`which hermes`) :

```bash
sudo tee /etc/systemd/system/hermes-gateway.service > /dev/null <<'EOF'
[Unit]
Description=Hermes Agent Gateway
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=hermes
Group=hermes
WorkingDirectory=/home/hermes
ExecStart=/home/hermes/.local/bin/hermes gateway run
Restart=on-failure
RestartSec=10
# Durcissement raisonnable. Attention : l'agent a besoin d'écrire dans
# ~/.hermes et d'exécuter des commandes — un durcissement plus agressif
# (ProtectSystem=strict, NoNewPrivileges) casse des fonctionnalités.
PrivateTmp=true

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now hermes-gateway
sudo systemctl status hermes-gateway
```

Journal :

```bash
journalctl -u hermes-gateway -f
```

⚠️ Vérifie le nom exact de la sous-commande sur ta version : le compose utilise `gateway run` ✅ tandis que le README documente `hermes gateway start` ✅. `run` est vraisemblablement la forme longue non détachée, adaptée à systemd. Teste à la main avant d'installer le service.

---

## Phase 8 — Dashboard en tunnel SSH

Le dashboard écoute sur `127.0.0.1:9119`. **Il stocke des clés d'API.** ✅ Ne l'expose pas — ni en `--host 0.0.0.0`, ni avec `--insecure`.

Depuis ton poste Windows :

```bash
ssh -i "$HOME/.ssh/hermes_vps" -L 9119:localhost:9119 hermes@ADRESSE_IP
```

Puis ouvre <http://localhost:9119> dans ton navigateur. Le trafic passe chiffré dans le tunnel SSH ; le port reste fermé côté serveur.

C'est la méthode recommandée par le projet lui-même. ✅ Si tu as un jour besoin d'un accès permanent, la seule voie acceptable est un reverse proxy **avec authentification** devant — pas une exposition directe.

### API compatible OpenAI

Le compose prévoit d'exposer une API compatible OpenAI, désactivée par défaut. Pour l'activer il faut **les deux** variables, `API_SERVER_KEY` étant obligatoire pour l'authentification : ✅

```
API_SERVER_HOST=0.0.0.0
API_SERVER_KEY=<secret long et aléatoire>
```

Les sources renvoient explicitement à `docs/user-guide/api-server.md` avant de faire ça sur une machine exposée à Internet. ⚠️ Suis ce conseil : c'est ouvrir un accès réseau à un agent qui a un shell.

---

## Phase 9 — Sauvegardes et mises à jour

### 9.1 — Ce qu'il faut sauvegarder

**`~/.hermes`**, entièrement. C'est là que vivent la config, les secrets, l'historique des sessions, la mémoire, les profils utilisateur et **les skills que l'agent s'est créées lui-même**. Sans ça, une réinstallation te rend un agent amnésique.

### 9.2 — Sauvegarde locale automatique

```bash
mkdir -p ~/backups

cat > ~/backup-hermes.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
STAMP=$(date +%Y%m%d-%H%M%S)
DEST="$HOME/backups"
tar czf "$DEST/hermes-$STAMP.tar.gz" -C "$HOME" .hermes
# Ne garder que les 14 dernières
ls -1t "$DEST"/hermes-*.tar.gz | tail -n +15 | xargs -r rm --
EOF

chmod +x ~/backup-hermes.sh
```

Une archive par nuit à 3 h, via la crontab de l'utilisateur `hermes` :

```bash
crontab -e
```

```
0 3 * * * /home/hermes/backup-hermes.sh >> /home/hermes/backups/backup.log 2>&1
```

### 9.3 — Sauvegarde hors du serveur

Une sauvegarde qui vit sur la machine qu'elle protège n'est pas une sauvegarde. Rapatrie-la sur ton poste :

```bash
scp -i "$HOME/.ssh/hermes_vps" hermes@ADRESSE_IP:~/backups/hermes-*.tar.gz ./
```

Ces archives **contiennent tes clés d'API en clair**. Stocke-les dans un endroit chiffré, pas dans un dossier synchronisé au tout-venant.

Pour aller plus loin, `restic` ou `borgbackup` vers un stockage objet (Backblaze B2, Hetzner Storage Box) donnent chiffrement et déduplication. Tu peux aussi demander à Hermes de gérer ça : il a un planificateur cron intégré, et « sauvegarde nocturne » fait partie des exemples cités par le projet. ✅

### 9.4 — Mettre à jour

En installation directe : ✅

```bash
hermes update
hermes doctor
```

En Docker :

```bash
cd ~/hermes-agent
git pull
HERMES_UID=$(id -u) HERMES_GID=$(id -g) docker compose up -d --build
```

**Sauvegarde avant chaque mise à jour.** Le projet est en v0.0.1 : les changements de rupture sont normaux à ce stade.

---

## Phase 10 — Checklist de sécurité avant ouverture

À passer en revue avant de considérer l'installation comme opérationnelle.

**Serveur**
- [ ] Connexion root SSH désactivée (`PermitRootLogin no`)
- [ ] Authentification par mot de passe désactivée (`PasswordAuthentication no`)
- [ ] `ufw` actif, seul le port 22 ouvert
- [ ] fail2ban actif
- [ ] Mises à jour automatiques activées
- [ ] Hermes ne tourne **pas** en root
- [ ] Swap en place

**Hermes**
- [ ] **Une allowlist configurée pour chaque plateforme activée** — le point le plus important
- [ ] Allowlist testée : un compte non autorisé n'obtient **rien**
- [ ] `~/.hermes/.env` en `chmod 600`
- [ ] Dashboard sur `127.0.0.1`, accès par tunnel SSH uniquement
- [ ] API server désactivée, ou activée avec `API_SERVER_KEY`
- [ ] Aucun secret dans un dépôt git
- [ ] Sauvegarde nocturne en place **et restauration testée une fois**

**Sur le fond**
- [ ] Ce VPS est dédié à Hermes — pas de site de production, pas de données patients dessus
- [ ] Tu as conscience que l'agent peut exécuter des commandes shell et que le conteneur est ta vraie barrière
- [ ] Les outils activés (`hermes tools`) sont ceux dont tu as besoin, pas la totalité

---

## Dépannage

| Symptôme | Piste |
|---|---|
| N'importe quoi | `hermes doctor` d'abord ✅ |
| Le bot ne répond pas | Gateway démarré ? (`docker compose ps` / `systemctl status`). Ton ID est-il dans l'allowlist ? Token correct ? |
| Le bot répond aux inconnus | Allowlist absente ou mal formée. **Coupe le gateway immédiatement**, corrige, redémarre. |
| Erreurs de modèle | `hermes model` pour vérifier provider et clé ; `hermes portal info` en voie Portal ✅ |
| Le conteneur redémarre en boucle | `docker compose logs gateway`. Vérifie que `/init` est bien PID 1 si tu as touché l'entrypoint ✅ |
| Fichiers illisibles après un run Docker | `HERMES_UID` / `HERMES_GID` non passés au `compose up` ✅ |
| Processus tué sans raison | OOM. `dmesg | tail`, `free -h`. Ajoute du swap ou monte en RAM. |
| Cron au mauvais horaire | `timedatectl` — fuseau du serveur ✅ |
| Dashboard inaccessible | Normal : `127.0.0.1` seulement. Passe par le tunnel SSH (phase 8). |

**Ressources**
- Documentation : <https://hermes-agent.nousresearch.com/docs/>
- Dépôt et issues : <https://github.com/NousResearch/hermes-agent>
- Discord Nous Research : <https://discord.gg/NousResearch>
- Skills Hub : <https://agentskills.io>
- Vulnérabilités : `security@nousresearch.com` — et **pas** en issue publique ✅

---

## Ordre de marche résumé

```
Phase 0   Décider : hébergeur, OS, messagerie, modèle
Phase 1   ssh-keygen → créer le VPS avec la clé publique → se connecter
Phase 2   apt upgrade → utilisateur hermes → verrouiller SSH → ufw → fail2ban → swap → fuseau
Phase 3   Docker → git clone → HERMES_UID=$(id -u) HERMES_GID=$(id -g) docker compose up -d --build
Phase 4   hermes setup --portal   (ou hermes model)
Phase 5   hermes skills search/install → hermes tools
Phase 6   @BotFather → token → @userinfobot → ID → ALLOWED_USERS → gateway start → TESTER L'ALLOWLIST
Phase 7   Docker : rien à faire. Sinon : service systemd.
Phase 8   ssh -L 9119:localhost:9119 → http://localhost:9119
Phase 9   backup-hermes.sh + crontab + rapatriement hors serveur
Phase 10  Checklist
```

Le seul point où il ne faut pas improviser : **l'allowlist de la phase 6.1.** Tout le reste se rattrape.
