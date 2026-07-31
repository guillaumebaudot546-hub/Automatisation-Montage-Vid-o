# Hermes Agent — architecture 100 % cloud

**Complément à [hermes-vps-runbook.md](hermes-vps-runbook.md).** Le premier document décrit un VPS que tu administres. Celui-ci décrit la variante sans serveur à gérer : aucune machine locale, aucun OS à maintenir, aucune clé SSH à porter.

Même convention de sourçage : ✅ = vérifié dans les sources de ta version locale (v0.0.1) et dans le site de documentation embarqué (`website/docs/`). ⚠️ = à confirmer au moment de l'exécution, généralement parce que le détail vit côté fournisseur (Fly.io, Modal, Telegram) ou parce que les tarifs bougent.

---

## 1. « Tout en cloud » se décide sur quatre couches

C'est le point que l'on rate le plus souvent, et qui explique la plupart des déceptions. Hermes n'est pas un bloc unique qu'on pose « dans le cloud » : ce sont **quatre couches indépendantes**, chacune avec son propre choix.

| # | Couche | Rôle | Options |
|---|---|---|---|
| 1 | **Modèle** | Inférence LLM | API (Nous Portal, OpenRouter…) — **déjà cloud par nature** |
| 2 | **Gateway** | Le processus qui écoute la messagerie et fait tourner la boucle d'agent | VPS · **PaaS** · conteneur managé |
| 3 | **Terminal backend** | Là où l'agent **exécute ses commandes shell** | `local` · `docker` · `ssh` · `singularity` · **`modal`** · **`daytona`** ✅ |
| 4 | **État** | Config, clés, sessions, mémoire, skills apprises | Volume persistant — **le point dur** |

La couche 1 est cloud dès le départ. La couche 3 a deux backends réellement serverless, `modal` et `daytona`, qui hibernent au repos ✅. La couche 2 est celle où se joue « serveur à administrer ou pas ». Et la couche 4 est celle qui fait échouer les architectures serverless naïves — on y revient en §6, c'est le passage à ne pas survoler.

Autrement dit : tu peux être « tout en cloud » sur les couches 1, 3 et 4 tout en gardant un VPS classique en couche 2. Et inversement, mettre le gateway sur une PaaS ne rend pas magiquement l'exécution des commandes serverless. **Ce sont des décisions séparées.**

---

## 2. Trois niveaux d'ambition

Choisis lequel correspond à ce que tu veux vraiment.

### Niveau 1 — « Rien ne tourne sur mon PC »

Le gateway vit sur un VPS, tu lui parles depuis Telegram sur ton téléphone. Ton poste Windows n'est plus dans la boucle, sauf pour l'administration ponctuelle en SSH.

→ **C'est déjà ce que produit le premier runbook.** Si c'est ça ton besoin, tu n'as rien à changer.

### Niveau 2 — « Aucun serveur à administrer »

Plus d'`apt upgrade`, plus de `ufw`, plus de fail2ban, plus de clés SSH. On déploie l'image Docker officielle sur une PaaS qui gère l'OS, les correctifs et les redémarrages.

→ **C'est l'objet de ce document.**

### Niveau 3 — « Zéro machine allumée quand je ne l'utilise pas »

Scale-to-zero intégral, facturation à l'usage.

→ **Réalisable pour la couche 3, pas pour la couche 2.** Le gateway doit rester joignable. Il existe un contournement (mode webhook + réveil à la demande) mais il casse le planificateur cron — voir §8. Lis ce paragraphe avant de viser ce niveau, c'est le compromis le moins évident du système.

---

## 3. Architecture recommandée

```
┌─ Ton téléphone ─────────── Telegram ────────────┐
│                                                  │
│   ┌──────────────────────────────────────────┐  │
└──▶│  Couche 2 : GATEWAY                      │  │
    │  Fly.io — image Docker officielle        │  │
    │  1 machine partagée, always-on           │  │
    └───────────┬──────────────────┬───────────┘  │
                │                  │              │
    ┌───────────▼──────┐  ┌────────▼───────────┐  │
    │ Couche 4 : ÉTAT  │  │ Couche 3 : SHELL   │  │
    │ Volume Fly       │  │ Modal / Daytona    │  │
    │ /opt/data        │  │ hiberne au repos ✅│  │
    │ (persistant)     │  └────────────────────┘  │
    └──────────────────┘                          │
                │                                 │
    ┌───────────▼──────────────────────────────┐  │
    │ Couche 1 : MODÈLE                        │◀─┘
    │ Nous Portal / OpenRouter (API)           │
    └──────────────────────────────────────────┘
```

**Pourquoi Fly.io en couche 2** : il déploie directement une image Docker (Hermes en fournit une, officielle et testée ✅), propose de **vrais volumes persistants** — ce qui règle la couche 4 — et son CLI permet d'ouvrir un shell distant sans gérer de clés SSH. Railway et Render sont des alternatives valables ; Railway est mentionné aux côtés de Fly.io dans les sources du projet ✅.

**Pourquoi Modal ou Daytona en couche 3** : ce sont les deux seuls backends serverless ✅. L'environnement d'exécution de l'agent hiberne quand il ne s'en sert pas et se réveille à la demande. Bénéfice secondaire important : **l'agent n'exécute plus ses commandes sur la machine qui l'héberge**, donc il ne peut plus modifier son propre code ni sa propre config. La documentation présente d'ailleurs cette séparation comme un choix de sécurité pour le backend `ssh` — « keep agent away from its own code » ✅. Le même raisonnement vaut ici.

---

## 4. Travailler sans rien installer localement

Si « tout en cloud » inclut « je n'installe pas d'outils sur mon PC », il te faut un terminal cloud. Trois voies :

| Voie | Ce que c'est | Coût |
|---|---|---|
| **GitHub Codespaces** | VS Code + terminal Linux dans le navigateur | Gratuit jusqu'à 60 h/mois ⚠️ |
| **Google Cloud Shell** | Terminal gratuit, 5 Go persistants | Gratuit ⚠️ |
| **Fly.io** via navigateur | Déploiement lié à un dépôt GitHub | — |

Le plus simple : **GitHub Codespaces**. Tu forkes le dépôt Hermes, tu ouvres un Codespace dessus, et tu as un terminal complet dans le navigateur, avec `git` déjà configuré. Tout ce qui suit s'exécute là-dedans.

```bash
# Dans le Codespace
curl -L https://fly.io/install.sh | sh
export FLYCTL_INSTALL="/home/codespace/.fly"
export PATH="$FLYCTL_INSTALL/bin:$PATH"
fly auth signup   # ou: fly auth login
```

> ⚠️ Un Codespace s'arrête tout seul après une période d'inactivité. Il sert à **piloter** le déploiement, pas à l'héberger. Le gateway, lui, tourne sur Fly.io en permanence.

---

## 5. Déployer le gateway sur Fly.io

### 5.1 — Récupérer les sources

```bash
git clone https://github.com/NousResearch/hermes-agent.git
cd hermes-agent
```

### 5.2 — Initialiser l'application

```bash
fly launch --no-deploy
```

Réponds :
- **Nom** : `hermes-<quelquechose-d-unique>`
- **Région** : `cdg` (Paris) ou `fra` (Francfort)
- **Postgres / Redis** : **non**, Hermes n'en a pas besoin — tout son état tient dans un répertoire ✅
- **Déployer maintenant** : **non**, il reste le volume et les secrets à configurer

Fly détecte le `Dockerfile` à la racine ✅ et génère un `fly.toml`.

### 5.3 — Créer le volume persistant

**C'est l'étape à ne pas rater.** Sans volume, chaque redéploiement repart d'un système de fichiers vierge : config perdue, mémoire perdue, skills apprises perdues.

```bash
fly volumes create hermes_data --region cdg --size 3
```

3 Go suffisent largement au départ (l'état est surtout du SQLite et du texte). Le volume est extensible ensuite.

### 5.4 — Configurer `fly.toml`

La documentation Docker officielle est formelle : **`/opt/data` est la source unique de vérité** pour toute la configuration, les clés d'API, les sessions, les skills et les mémoires ✅. L'image elle-même est *stateless* et peut être remplacée par une nouvelle version sans rien perdre ✅.

Il faut donc monter le volume exactement sur `/opt/data` :

```toml
app = "hermes-<ton-nom>"
primary_region = "cdg"

[build]
  dockerfile = "Dockerfile"

[[mounts]]
  source = "hermes_data"
  destination = "/opt/data"

[env]
  HERMES_UID = "10000"
  HERMES_GID = "10000"

[[vm]]
  size = "shared-cpu-1x"
  memory = "2gb"
```

Trois précisions qui évitent des heures de débogage :

**Ne redéfinis pas l'`entrypoint`.** L'image utilise `/init` (s6-overlay) comme PID 1 : il applique les droits, réconcilie les profils et monte l'arbre de supervision avant tout démarrage de service. Le contourner casse le gateway **silencieusement** ✅.

**`HERMES_UID` / `HERMES_GID` sont nécessaires**, même ici. Ils alignent l'utilisateur interne sur le propriétaire des fichiers du volume ✅.

**2 Go de RAM.** Aucun minimum n'est déclaré dans les sources ⚠️, mais l'image embarque Python 3.11+, Node, ffmpeg et ripgrep, et le gateway peut faire tourner plusieurs adaptateurs en parallèle. En dessous, tu vis sous la menace de l'OOM-killer.

### 5.5 — Déployer

```bash
fly deploy
fly status
fly logs
```

---

## 6. La couche 4 : pourquoi la persistance décide de tout

Le passage à comprendre avant de faire des choix d'architecture.

Le volume `/opt/data` contient ✅ :

| Contenu | Conséquence si perdu |
|---|---|
| `.env` | Clés d'API à ressaisir |
| `config.yaml` | Configuration à refaire |
| `sessions/` | Historique des conversations perdu |
| `memories/` | **Tout ce que l'agent sait de toi, effacé** |
| skills | **Les skills que l'agent s'est créées, effacées** |

Rappel de la boucle d'apprentissage : Hermes **crée ses propres skills** après les tâches complexes, les **améliore en cours d'usage**, entretient une mémoire curatée et une recherche plein-texte sur ses sessions passées ✅.

Autrement dit, **ce volume *est* ton agent.** L'image Docker n'est qu'un exécutable interchangeable ; la valeur accumulée est entièrement dans `/opt/data`.

C'est pour cette raison que les plateformes serverless à système de fichiers éphémère (Cloud Run, Lambda, Vercel) sont **inadaptées à la couche 2**, quelle que soit leur élégance par ailleurs. Un agent qui perd sa mémoire à chaque redéploiement n'est plus un agent qui apprend — c'est un chatbot sans état. Fly.io convient parce qu'il offre de vrais volumes ; Railway et Render également ⚠️.

Autre effet utile de la persistance : au redémarrage, un réconciliateur lit `gateway_state.json` et **relance automatiquement** les profils dont le dernier état enregistré était `running` ✅. Seul un gateway que tu as explicitement arrêté (`hermes gateway stop`) reste éteint. Un redémarrage de machine, une montée de version ou un crash ne demandent donc aucune intervention.

---

## 7. Secrets et configuration

Sur une PaaS, les secrets ne vont pas dans un fichier — ils vont dans le gestionnaire de la plateforme, chiffré au repos et injecté à l'exécution.

```bash
fly secrets set TELEGRAM_BOT_TOKEN="123456789:AAE..."
fly secrets set TELEGRAM_ALLOWED_USERS="123456789"
fly secrets set OPENROUTER_API_KEY="sk-or-..."
```

Chaque `fly secrets set` redémarre l'application.

Pour la configuration interactive, ouvre un shell dans le conteneur :

```bash
fly ssh console
hermes setup
hermes doctor
```

`fly ssh console` gère les clés pour toi — rien à générer, rien à stocker localement. C'est exactement ce qu'on cherchait.

Pour **Nous Portal**, la documentation précise que le jeton de rafraîchissement persiste dans le volume monté ✅ : l'authentification ne se fait donc qu'une fois.

```bash
fly ssh console
hermes setup --portal
```

⚠️ Sur une machine sans navigateur, l'OAuth affichera une URL ou un code d'appairage. Suis ce qu'indique le terminal.

---

## 8. Messagerie : polling ou webhook, et ce que ça coûte vraiment

Décision structurante, avec un compromis que personne ne mentionne.

### Polling (par défaut ✅)

Le gateway interroge Telegram en continu. **Aucun port entrant**, donc aucune surface d'attaque réseau. Mais le processus doit rester allumé en permanence.

```toml
[[vm]]
  size = "shared-cpu-1x"
  memory = "2gb"

# Always-on : indispensable en polling
[http_service]
  min_machines_running = 1
```

### Webhook

Le mode webhook existe explicitement **« pour les déploiements cloud type Fly.io/Railway »** ✅ — c'est écrit tel quel dans les sources.

```bash
fly secrets set TELEGRAM_WEBHOOK_URL="https://hermes-<ton-nom>.fly.dev/telegram"
fly secrets set TELEGRAM_WEBHOOK_PORT="8443"
fly secrets set TELEGRAM_WEBHOOK_SECRET="<chaîne longue et aléatoire>"
```

`TELEGRAM_WEBHOOK_SECRET` est noté « recommended for production » dans les sources ✅. Traite-le comme obligatoire : sans lui, n'importe qui connaissant ton URL peut injecter de faux événements.

Le webhook autorise le scale-to-zero : la machine dort et se réveille sur requête entrante.

### Le compromis que le scale-to-zero cache

**Une machine endormie n'exécute pas de cron.**

Hermes embarque un planificateur cron avec livraison sur les plateformes de messagerie — rapports quotidiens, sauvegardes nocturnes, audits hebdomadaires, en langage naturel ✅. Si la machine dort à 3 h du matin, **rien ne se déclenche**. Le réveil est provoqué par une requête entrante, pas par l'horloge.

Donc :

| Ton usage | Configuration |
|---|---|
| Conversation seule, pas d'automatisation | Webhook + scale-to-zero — le moins cher |
| **Tâches planifiées (le cas courant)** | **Polling + `min_machines_running = 1`** |

Si tu tiens au scale-to-zero *et* aux tâches planifiées, il faut un déclencheur externe qui réveille l'application à heure fixe (cron GitHub Actions, ou un service de ping) ⚠️. C'est de la complexité en plus pour économiser environ 2 €/mois — rarement un bon calcul.

### La règle qui ne change pas

Quel que soit le mode : **allowlist obligatoire**. `SECURITY.md` qualifie de *bug* tout adaptateur exposé au réseau qui fonctionne sans allowlist ✅. Sans `TELEGRAM_ALLOWED_USERS`, le premier inconnu qui trouve ton bot obtient un shell.

Le test qui compte : écris au bot depuis un compte **non** listé. Il ne doit rien obtenir.

---

## 9. Couche 3 : exécution serverless des commandes

C'est ici que le « tout en cloud » prend son sens le plus fort — et le gain de sécurité le plus net.

### Modal

Vérifié dans la documentation ✅ :

```bash
fly ssh console
uv pip install modal
modal setup
hermes config set terminal.backend modal
```

Modal s'authentifie par son CLI, pas par variable d'environnement — aucune clé à mettre dans `.env` ✅.

### Daytona

```bash
fly secrets set DAYTONA_API_KEY="<ta-clé>"
fly ssh console
hermes config set terminal.backend daytona
```

Variables confirmées : `DAYTONA_API_KEY`, `TERMINAL_DAYTONA_IMAGE` ✅.

### Ressources et persistance du sandbox

Réglages communs à tous les backends conteneurisés ✅ :

```yaml
terminal:
  backend: modal          # ou daytona
  container_cpu: 1
  container_memory: 5120     # Mo — défaut 5 Go
  container_disk: 51200      # Mo — défaut 50 Go
  container_persistent: true # paquets et fichiers survivent aux sessions
```

Image par défaut pour les deux : `nikolaik/python-nodejs:python3.11-nodejs20` ✅.

Garde `container_persistent: true` — sinon l'agent réinstalle ses dépendances à chaque session ✅.

### Le durcissement dont tu hérites gratuitement

Tous les backends conteneurisés appliquent ✅ :

- racine en lecture seule
- toutes les capacités Linux retirées
- pas d'élévation de privilèges
- limite à 256 processus
- isolation complète des namespaces
- espace de travail persistant par volume, jamais par couche racine inscriptible

C'est nettement meilleur que ce que tu obtiendrais en `local` sur un VPS — et c'est l'argument principal en faveur de cette architecture, avant même le confort d'exploitation.

---

## 10. Sauvegardes de cloud à cloud

Même en PaaS, la sauvegarde reste ton affaire. Un volume Fly peut être perdu ; une fausse manœuvre aussi.

### Snapshots Fly

```bash
fly volumes list
fly volumes snapshots list <volume-id>
```

Fly prend des snapshots quotidiens automatiques ⚠️ (rétention à vérifier selon le plan). **Ce n'est pas suffisant comme sauvegarde unique** : c'est le même fournisseur, la même région, le même compte.

### Sauvegarde vers un stockage objet

Depuis le conteneur :

```bash
fly ssh console
tar czf /tmp/hermes-$(date +%Y%m%d).tar.gz -C /opt/data .
```

Puis vers un bucket S3-compatible (Tigris est intégré à Fly, Backblaze B2 et Scaleway conviennent aussi ⚠️).

**Le plus élégant : demande-le à l'agent.** Il a un planificateur cron intégré et « sauvegarde nocturne » figure parmi les exemples cités par le projet ✅. Une consigne en langage naturel suffit — sous réserve que la machine soit allumée à l'heure dite (§8).

⚠️ Ces archives **contiennent tes clés d'API en clair**. Bucket privé, chiffrement au repos, jamais dans un dossier partagé.

---

## 11. Coûts

⚠️ Ordres de grandeur, tarifs de mémoire, à vérifier chez chaque fournisseur.

| Poste | Configuration | Estimation |
|---|---|---|
| Fly.io machine | `shared-cpu-1x`, 2 Go, always-on | ~5–8 €/mois |
| Fly.io volume | 3 Go | ~0,50 €/mois |
| Modal / Daytona | À l'usage, hibernation au repos | ~0–5 €/mois selon activité |
| Modèle | Nous Portal ou OpenRouter | Variable — souvent le premier poste |
| **Total infra** | | **~6–14 €/mois** |

À comparer : un VPS Hetzner CX22 revient à ~4 €/mois, mais avec l'administration système à ta charge. La PaaS coûte quelques euros de plus et t'enlève les correctifs de sécurité, le pare-feu, fail2ban, les redémarrages et la surveillance.

Le vrai calcul n'est pas 4 € contre 8 €. C'est : combien vaut une heure de ton temps, et combien d'heures par an passerais-tu à maintenir l'OS.

---

## 12. VPS ou PaaS

| Critère | VPS (runbook 1) | PaaS (ce document) |
|---|---|---|
| Coût infra | ~4 €/mois | ~6–14 €/mois |
| Administration OS | À ta charge | Aucune |
| Correctifs de sécurité | `unattended-upgrades` à configurer | Fournisseur |
| Pare-feu / fail2ban | À configurer | Sans objet |
| Clés SSH | À générer et protéger | `fly ssh console` |
| Redéploiement | `git pull` + rebuild | `fly deploy` |
| Persistance | Répertoire hôte | Volume déclaré |
| Contrôle | Total | Encadré par la plateforme |
| Souveraineté des données | Ton serveur | Fournisseur |
| **Pour qui** | Tu es à l'aise en admin Linux | Tu veux que ça tourne |

Les deux sont légitimes. Le premier runbook garde toute sa valeur si tu veux la maîtrise complète, ou si l'hébergement des données chez un tiers américain pose un problème dans ton contexte médical — Fly.io est une société américaine, même avec une région parisienne. C'est un point à considérer sérieusement si des données de patients approchent un jour ce système, et un argument de poids pour Scaleway ou OVH.

---

## 13. Marche à suivre condensée

```
1.  Codespace (ou Cloud Shell)      → terminal cloud, rien d'installé localement
2.  fly auth signup                 → compte
3.  git clone hermes-agent          → sources
4.  fly launch --no-deploy          → app créée, sans Postgres ni Redis
5.  fly volumes create hermes_data  → 3 Go — ÉTAPE CRITIQUE
6.  fly.toml                        → mount /opt/data + 2 Go RAM + HERMES_UID/GID
7.  fly deploy                      → en ligne
8.  fly secrets set ...             → token Telegram + ALLOWED_USERS + clé modèle
9.  fly ssh console → hermes setup  → modèle, outils
10. hermes config set terminal.backend modal   → shell serverless
11. hermes gateway setup / start    → messagerie
12. TESTER L'ALLOWLIST              → un compte non autorisé n'obtient RIEN
13. Sauvegarde vers stockage objet  → ne pas se reposer sur les snapshots Fly
```

---

## 14. Checklist

**Architecture**
- [ ] Volume monté sur `/opt/data` — sans ça, tout est perdu à chaque déploiement
- [ ] `HERMES_UID` / `HERMES_GID` définis
- [ ] Entrypoint non redéfini (`/init` reste PID 1)
- [ ] 2 Go de RAM au minimum
- [ ] `terminal.backend` sur `modal` ou `daytona` — l'agent n'exécute plus rien sur son propre hôte

**Sécurité**
- [ ] **Allowlist configurée pour chaque plateforme activée**
- [ ] **Allowlist testée depuis un compte non autorisé**
- [ ] Secrets dans le gestionnaire de la plateforme, pas dans un fichier versionné
- [ ] `TELEGRAM_WEBHOOK_SECRET` défini si mode webhook
- [ ] Dashboard non exposé — tunnel via `fly ssh console` ou `fly proxy`
- [ ] API server désactivée, ou activée avec `API_SERVER_KEY` ✅

**Exploitation**
- [ ] `min_machines_running = 1` si tu utilises le cron (§8)
- [ ] Sauvegarde hors Fly configurée
- [ ] **Restauration testée une fois** — une sauvegarde jamais restaurée n'est pas une sauvegarde
- [ ] `fly logs` consulté après le premier déploiement

---

## 15. Dépannage

| Symptôme | Piste |
|---|---|
| Config perdue après déploiement | Volume non monté sur `/opt/data` — la cause n°1 ✅ |
| Le conteneur boucle au démarrage | `fly logs`. Entrypoint redéfini ? `/init` doit rester PID 1 ✅ |
| Fichiers illisibles dans le volume | `HERMES_UID` / `HERMES_GID` absents de `fly.toml` ✅ |
| Processus tué sans message | OOM — passe à 2 Go ou plus |
| Le bot ne répond plus la nuit | Scale-to-zero + polling. Voir §8 |
| Le cron ne se déclenche pas | Machine endormie. `min_machines_running = 1` |
| Le bot répond à des inconnus | Allowlist absente. **Coupe le gateway immédiatement** |
| Diagnostic général | `fly ssh console` puis `hermes doctor` ✅ |

**Ressources**
- Documentation Hermes : <https://hermes-agent.nousresearch.com/docs/>
- Docs embarquées dans ton install : `%LOCALAPPDATA%\hermes\hermes-agent\website\docs\`
- Dépôt : <https://github.com/NousResearch/hermes-agent>
- Discord Nous Research : <https://discord.gg/NousResearch>
- Fly.io : <https://fly.io/docs/>
- Modal : <https://modal.com/docs> · Daytona : <https://www.daytona.io/docs>
- Vulnérabilités : `security@nousresearch.com`, **pas** en issue publique ✅

---

## En un paragraphe

Le « tout en cloud » utile, ce n'est pas de chercher le scale-to-zero à tout prix : c'est de mettre **l'exécution des commandes** sur un sandbox serverless (`modal` ou `daytona`), de confier **l'OS** à une PaaS, et de garder **l'état** sur un volume persistant correctement sauvegardé. Le gateway, lui, gagne à rester allumé — quelques euros par mois pour que le cron fonctionne et que l'agent réponde sans latence de réveil. La seule étape où une erreur est irrattrapable reste le montage du volume sur `/opt/data`.
