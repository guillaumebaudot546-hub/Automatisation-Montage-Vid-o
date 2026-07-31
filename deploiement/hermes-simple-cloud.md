# Hermes Agent — setup simple, cloud, avec contrôle

Un chemin, pas un menu. Décisions tranchées ci-dessous, raisons données une fois, pas de tableau comparatif à relire.

---

## Ce qui est décidé

| Couche | Choix | Pourquoi pas l'alternative |
|---|---|---|
| Hébergement | **Fly.io**, 1 machine always-on | Volumes persistants natifs, déploiement direct de l'image Docker officielle |
| Terminal backend | **`local`** (dans la machine Fly) | La machine Fly EST déjà une micro-VM isolée (Firecracker) — Modal/Daytona ajoutent un compte et une couche sans gain réel ici |
| Messagerie | **Telegram, polling** | Zéro port entrant, zéro certificat TLS, marche en 5 min |
| Modèle | **OpenRouter** ou **Nous Portal** | Une clé, choix libre de modèle |

Ce n'est pas l'option la plus "pure cloud-native" possible. C'est celle qui marche en un après-midi et que tu peux surveiller sans deuxième doc à ouvrir.

---

## Setup — 8 commandes qui comptent

Depuis un terminal cloud (GitHub Codespaces — gratuit, rien à installer chez toi) ou n'importe quel terminal Linux/WSL.

```bash
# 1. CLI Fly
curl -L https://fly.io/install.sh | sh
export PATH="$HOME/.fly/bin:$PATH"
fly auth signup

# 2. Sources
git clone https://github.com/NousResearch/hermes-agent.git
cd hermes-agent

# 3. App (sans DB, sans déploiement immédiat)
fly launch --no-deploy
# région: cdg (Paris) — nom: hermes-<toi>

# 4. Volume — ÉTAPE QUI NE DOIT PAS ÊTRE RATÉE
fly volumes create hermes_data --region cdg --size 3
```

Édite `fly.toml` généré, ajoute :

```toml
[[mounts]]
  source = "hermes_data"
  destination = "/opt/data"

[env]
  HERMES_UID = "10000"
  HERMES_GID = "10000"

[[vm]]
  size = "shared-cpu-1x"
  memory = "2gb"

[http_service]
  min_machines_running = 1   # always-on, sinon le cron ne se déclenche jamais
```

```bash
# 5. Déployer
fly deploy

# 6. Secrets (Telegram + modèle)
fly secrets set TELEGRAM_BOT_TOKEN="<via @BotFather>"
fly secrets set TELEGRAM_ALLOWED_USERS="<ton ID via @userinfobot>"
fly secrets set OPENROUTER_API_KEY="<ta clé>"

# 7. Config interactive
fly ssh console
hermes setup
hermes gateway start

# 8. Vérif
hermes doctor
```

**Test obligatoire avant de considérer que c'est fini** : écris au bot depuis un compte Telegram non listé dans `TELEGRAM_ALLOWED_USERS`. Il doit répondre rien. Si non — coupe le gateway, corrige, reteste.

---

## Le moyen de contrôle

Quatre outils, pas un de plus. Chacun répond à une question différente.

### 1. Telegram — "est-ce vivant, que fait-il"

C'est déjà ton interface. Deux commandes intégrées :

```
/status      → état de la plateforme courante
/platforms   → état de toutes les plateformes connectées
```

Suffit pour 90% du contrôle au quotidien : tu lui parles, il répond, c'est vivant.

### 2. `fly logs` — "que s'est-il passé"

```bash
fly logs
```

Flux en direct. Premier réflexe si le bot ne répond plus.

### 3. `fly ssh console` — "je veux intervenir"

```bash
fly ssh console
hermes doctor      # diagnostic complet
hermes gateway restart
```

Pas de clé SSH à gérer, Fly s'en charge. C'est ton accès admin.

### 4. Dashboard web — "je veux voir, pas taper"

Le dashboard Hermes tourne en `127.0.0.1:9119` dans la machine, jamais exposé publiquement (il stocke des clés API en clair). Tunnel à la demande :

```bash
fly proxy 9119:9119
```

Puis ouvre `http://localhost:9119` — vue skills, sessions, config, coûts modèle.

**Bonus** : `fly.io/apps` (dashboard web Fly) donne CPU, RAM, redémarrages, coût — sans rien ouvrir en local.

---

## Routine de contrôle recommandée

| Fréquence | Action |
|---|---|
| Chaque usage | `/status` dans Telegram — réflexe, pas une tâche |
| 1×/semaine | `fly logs` — 30 secondes, repère les erreurs récurrentes |
| 1×/mois | `fly proxy 9119:9119` → dashboard, coup d'œil skills/coûts |
| Avant chaque `fly deploy` | sauvegarde du volume (ci-dessous) |

---

## Sauvegarde — une commande, à ne pas sauter

```bash
fly ssh console
tar czf /tmp/hermes-$(date +%Y%m%d).tar.gz -C /opt/data .
exit
fly ssh sftp get /tmp/hermes-*.tar.gz .
```

`/opt/data` contient tout ce que l'agent a appris — skills auto-créées, mémoire, sessions. Le perdre = agent qui repart de zéro. Demande-lui carrément de le faire lui-même chaque nuit (il a un cron intégré) — plus fiable que d'y penser toi-même.

---

## Coût

~6 €/mois (machine 2 Go always-on + volume 3 Go) + coût modèle à l'usage (OpenRouter, variable).

---

## Si un jour tu veux évoluer

- **Économiser sur les heures creuses** → webhook + scale-to-zero, mais tu perds le cron pendant que la machine dort. Pas dans ce setup, volontairement.
- **Isoler encore plus le shell** → `terminal.backend: modal`, un compte de plus. Pas nécessaire ici : la machine Fly isole déjà.
- **Autre messagerie** → `hermes gateway setup` gère Discord/Slack/WhatsApp en plus, sans rien redéployer.

Ces trois cas sont dans `hermes-cloud-runbook.md` si besoin un jour. Pas maintenant.
