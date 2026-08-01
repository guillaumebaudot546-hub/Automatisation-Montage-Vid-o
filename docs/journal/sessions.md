# Journal de sessions — notes de clôture

> Une entrée par session, ajoutée AVANT de fermer (cycles-sessions.md).
> L'état courant du code vit dans SESSION-PRD.md ; les décisions dans decisions/.

## 2026-07-31 (suite) — Supports commerciaux, et le coût enfin mesuré

### Le coût réel : 6,91 $, pas 1 €

Hermes stocke le détail par session dans `~/.hermes/state.db`
(`session_model_usage`). La session de montage du 30/07 :

| Poste | Tokens | Coût | Part |
|---|---|---|---|
| **Écriture de cache** | 594 464 | **3,72 $** | **54 %** |
| Lecture de cache | 3 703 390 | 1,85 $ | 27 % |
| Sortie | 53 793 | 1,34 $ | 19 % |
| Entrée non cachée | 118 | ~0 | 0 % |
| | | **6,91 $** | |

Recalculé à la main aux tarifs officiels Opus 4.8 (5 $/25 $ le million) : le
total tombe exactement sur les 6,91 $ annoncés par la base. **L'écriture de
cache était le premier poste**, ce qui confirme le diagnostic du TTL de 5 min :
le contexte était réécrit à 6,25 $/M au lieu d'être relu à 0,50 $/M, soit
**12,5× plus cher**.

Total toutes sessions confondues : **11,22 $**. Guillaume avait relevé 15 € ;
l'écart vient vraisemblablement des sessions Claude Code, facturées sur le même
compte Anthropic mais étrangères au service.

### Proposition commerciale corrigée

`proposition-imcp-studio-video.html` annonçait **« ≈ 1 € par vidéo »** au
Dr Baudot. Écart de 7× avec la mesure. Corrigée en **révision B** (31/07) :
chiffre remplacé, décomposition ajoutée, et la correction elle-même est écrite
dans le document plutôt que masquée. Original conservé en
`proposition-imcp-studio-video.SAUVEGARDE-avant-correction-couts-2026-07-31.html`.

### Livré dans `commercial/`

| Fichier | Ce que c'est |
|---|---|
| `landing-agent-montage.html` | Landing page de l'agent. Charte MedStream reprise de la proposition, images produit extraites des vraies vidéos livrées, coûts mesurés affichés |
| `deck-agents-ia.html` | Catalogue des agents : 4 en production (avec preuve mesurée), 4 à développer (avec le point dur de chacun). Une couleur par domaine |
| `vitrine-agents/` | Mini-vidéo 16:9, 41 s, rendue en local |

### Décision : la vitrine n'est PAS dans `imcp-hyperframes/`

`check-charte` scanne `imcp-hyperframes/` et impose la charte IMCP (cyan
`#49B6C9`). Or cette vidéo est un support **MedStream DCA** et demande une
couleur par agent. Deux mauvaises options écartées : casser le vert du garde-fou,
ou déguiser les noms de tokens pour passer sous son radar. Retenu : la placer
dans `commercial/vitrine-agents/`, hors du périmètre scanné. La charte IMCP
protège les vidéos du praticien, pas les supports de l'agence.

### Défauts trouvés et corrigés en cours de route

- **Deux tirets cadratins** dans la landing (dont le `<title>`, visible dans
  l'onglet). La règle du skill est binaire, zéro toléré. Corrigés.
- **Composition HyperFrames refusée 3 fois** avant de passer : conteneur racine
  sans `data-composition-id`, sans dimensions, sans `data-start`, puis le
  gabarit détecté comme seconde entrée. Réglé en déplaçant le gabarit dans
  `_source/` (il garde son extension `.html` et sa coloration).
- **Aucun accent dans la vidéo** au premier rendu (« Controleur qualite »,
  « CONFORMITE »). Inacceptable sur un support commercial français, et inutile :
  les polices embarquées couvrent latin-ext. Corrigé.
- **Composition déséquilibrée** : tout le contenu dans la moitié gauche, moitié
  droite vide en 16:9. Passée en trois colonnes, la preuve à droite.

Les deux derniers n'ont été vus qu'en extrayant les images du rendu. Le
`check` passait au vert dans les deux cas : un code de sortie ne remplace pas un
contrôle visuel.

## 2026-07-31 (suite) — Les polices n'ont JAMAIS été chargées par HyperFrames

Question de Guillaume : pourquoi le design, les polices, la charte ne se
retrouvent-ils pas dans les montages du VPS, alors que ses montages faits en
local via Claude étaient conformes ?

**Ce n'était pas un problème de transfert vers le VPS. Le défaut était dans le
projet local depuis le début.**

### Le diagnostic, fichier par fichier

1. `src/theme/baudot.ts` est bien la source de vérité : cyan `#49B6C9`, fond
   navy `#060D18`, display **Cormorant**, corps **Manrope**.
2. **Remotion (`src/`) charge vraiment ces polices** — `src/index.css` contient
   un `@import` Google Fonts. D'où des montages locaux conformes : le PC a
   internet, la police se télécharge.
3. **HyperFrames n'a JAMAIS chargé aucune police.** Aucun `@font-face`, aucun
   `<link>`, aucun fichier `.woff`/`.ttf` dans tout `imcp-hyperframes/`. Les
   compositions écrivaient `font-family` et espéraient que le système fournisse.
4. Pire : elles ne demandaient même pas les bonnes polices — **`EB Garamond`**
   au lieu de Cormorant, **`Roboto`** au lieu de Manrope, sur **13 projets**.
5. Sur le VPS, `fc-list` ne remonte que DejaVu / FreeSans / Noto CJK : **aucune**
   police de la doctrine. Le rendu retombait donc sur une police de secours
   générique, **silencieusement, sans la moindre erreur**.

C'est la définition d'un défaut invisible : rien n'échoue, le rendu sort, et
seul l'œil du praticien voit que ce n'est pas sa charte.

### Correctif : auto-hébergement en base64

Choix de Guillaume : auto-héberger plutôt qu'installer les polices sur le VPS.
Meilleure décision — elle rend le rendu **indépendant du réseau et de la machine**.

- Cormorant (normal + italique), Manrope, JetBrains Mono récupérées en `.woff2`
  (sous-ensemble latin + latin-ext, polices variables : 4 fichiers couvrent
  toutes les graisses), licence OFL — auto-hébergement légitime.
- Embarquées en **base64 dans le `<style>`** de chaque composition : cohérent
  avec le principe « un HTML mono-fichier » du projet, et aucun chemin relatif
  à casser entre local et VPS. Coût : ~142 Ko par fichier.
- `EB Garamond` → `Cormorant`, `Roboto` → `Manrope` sur les 14 fichiers
  (13 projets + le socle). JetBrains Mono conservée : le nom était déjà correct,
  seul le `@font-face` manquait.

### Vérifications

- **14/14 fichiers modifiés**, plus aucune trace de `EB Garamond` / `Roboto`.
- **14/14 rendus refaits** (12 en local, `capsule-3204` en local,
  `teaser-05-formation` sur le VPS) — **zéro erreur**.
- `capsule-3204` : durée **66,3 s inchangée** — l'exclusion de l'hallucination
  Whisper documentée dans son BRIEF tient toujours.
- `npm run check:charte` → **vert**, 13 compositions conformes.
- `npm run check:sizes` → vert (10 fichiers en orange, rien de bloquant).
- Comparaison visuelle à 20 s sur `teaser-05-formation` : le titre passe d'une
  grasse générique à **Cormorant**, les sous-titres de Roboto à **Manrope**.

### Erreur commise en cours de route

En voulant appliquer le correctif au seul `teaser-05-formation` sur le VPS, un
`sed` mal échappé n'a pas restreint la liste de cibles : le script a réinjecté
les `@font-face` dans des fichiers déjà corrigés (doublons) **et** raté sa vraie
cible. Détecté par la vérification qui suivait, corrigé en réécrasant depuis les
versions locales propres, puis refait avec un script `apply_single.js` qui
**refuse d'agir si le fichier est déjà corrigé**. Le garde-fou aurait dû exister
dès le premier script.

## 2026-07-31 — Premier montage réel : post-mortem et correctifs

Première vidéo montée par Hermes depuis Telegram (`teaser-05-formation`).
Résultat jugé mauvais par Guillaume, et **facture de 15 €** là où le spec
annonçait ~1,62 $. Post-mortem sur les données réelles, pas sur des impressions.

### Chronologie établie

| Heure | Événement |
|---|---|
| 22:08 | Rush reçu (41 Mo, 1072×1904, 49 s) — échec `InvalidToken` (chemin de montage, corrigé) |
| 22:19 | Projet créé par Hermes |
| 22:23 | `plan.json` écrit — span unique 12,37→47,37 s, 8 sous-titres, 3 calques |
| 22:28 | Rendu n°1 (76,7 Mo) |
| 22:46 | Rendu n°2 (72,4 Mo) |
| 22:57 | `_FINAL.mp4` |

### Le chiffre

**4 351 765 tokens** pour cette seule session (144 messages, 97 appels d'outils),
contre ~300 000 budgétés. **Facteur 14.**

### Les 5 causes, par impact

1. **Le portail n'a JAMAIS été appelé.** `0` occurrence dans les logs. Trois
   rendus enchaînés sans une seule validation. Cause directe du mauvais résultat
   *et* d'une grande part du coût : un rejet du portail coûte 0 jeton et
   1 seconde, un rendu raté coûte 6 minutes machine plus toute la boucle de
   correction qui suit.
2. **`cache_ttl: 5m` contre des rendus de 6 minutes.** Le cache expirait
   systématiquement *pendant* chaque rendu → tout le contexte refacturé plein
   tarif après chaque rendu. Le levier n°1 annoncé dans le spec était neutralisé
   par ce réglage.
3. **Opus (`claude-opus-4-8`) pour tout**, y compris lire un fichier ou lancer
   une commande.
4. **Contexte cumulatif** : 144 messages, 24 lectures de fichiers injectées
   définitivement.
5. **L'estimation du spec était fausse — à assumer.** Elle chiffrait l'étape de
   *sélection* (~50 images + doctrine + transcription), pas une session agentique
   complète qui écrit 12 Ko de HTML, débogue et rend trois fois.

**Le VPS n'y est pour rien.** Le coût API, ce sont les jetons envoyés à
Anthropic ; le VPS ne joue que sur la vitesse de rendu. Un VPS plus puissant ne
réduirait pas la facture d'un centime.

### Correctifs appliqués

| Correctif | Détail |
|---|---|
| `cache_ttl` 5m → **1h** | Le cache survit désormais aux rendus |
| Modèle principal opus-4-8 → **claude-sonnet-5** | Vérifié actif |
| Auxiliaires (compression, titres, approbation) → **Haiku 4.5** | Tâches triviales |
| Compression déclenchée à **0,4** au lieu de 0,5 | Élagage plus tôt |
| `proactive_prune_tokens` 0 → **120 000** | Les dumps de rendu ne squattent plus le contexte |
| **Rendre sans portail = interdit** | Écrit dans AGENTS.md avec le schéma de boucle et le rappel de l'incident |
| **RÈGLE 5bis format** | Jamais d'étirement ; tableau réseau→cadre (9:16, 16:9, 1:1) ; contrôle `ffprobe` |
| **Roue dentée ⚙️ + liste noire** | Une seule ligne d'avancement modifiée au fil des 6 étapes ; commandes, chemins et traces bannis de la conversation |
| **Recollage de rush multi-parties** | `ffmpeg -f concat -c copy`, sans réencodage ; transcrire le fichier recollé, jamais les morceaux |

Sauvegardes horodatées du `config.yaml` avant chaque modification.

### Sur l'écrasement du format

Vérifié sur le rendu réel : **1080×1920 (9:16), `object-fit: cover`, aucun
étirement**. Le zoom perçu est un effet volontaire léger (`scale 1.02 → 1.07`
sur 35 s) ; la variation de cadrage vient du praticien qui bouge en filmant.
La règle est néanmoins désormais écrite et outillée. À revoir si Guillaume
identifie un instant précis.

### Gros rushes (> 2 Go)

Limite Telegram côté **envoi** : 2 Go (4 Go avec Premium) — pas une limite du
serveur local. Choix de Guillaume : découper avant envoi.
Livré : `Déploiement Hermes IA/decouper-rush.ps1` (découpage sans réencodage,
marge à 1,8 Go) + procédure de recollage côté agent dans `AGENTS.md`.

## 2026-07-30 (suite) — Audit doctrine : deux manques trouvés et comblés

Question de Guillaume : « tous les skills et doctrine déjà implémentés ? »
Vérifié plutôt qu'affirmé — **non**, deux manques réels.

### 1. Les skills HyperFrames n'étaient pas installées dans Hermes

La RÈGLE 7 impose de router par `/hyperframes` et interdit d'écrire une
composition à la main sans passer par lui. L'agent du VPS ne pouvait pas suivre
cette règle. Installées depuis le paquet npm officiel **déjà présent sur le VPS**
(`hyperframes@0.7.77`), pas d'une copie externe : `hyperframes` et
`hyperframes-cli`. Trois skills désormais actives avec `montage-imcp`.

### 2. Les 4 `exemplesValides` pointaient vers des dossiers inexistants

C'est la couche 3 de la doctrine (decision 003) : sans eux l'agent ne connaît que
les échecs à éviter, jamais un modèle de réussite. Le journal du 29/07 notait
« exemplesValides rempli » — mais rempli **dans le JSON**, pas déployé.

Transférés en version légère : `index.html`, `hyperframes.json`, `cues.json`,
`transcript.json`, `BRIEF.md` — **180 Ko au lieu de 646 Mo**. La leçon de montage
est dans la structure, pas dans les rushes sources. Vérifié lisible par
l'utilisateur `guillaume` (le piège de permissions rencontré à l'étape 4).

### Vérification : l'agent s'en sert-il vraiment ?

Question posée sans lui souffler la réponse. Il a cité `index.html` lignes
194-197 avec les attributs exacts (`data-duration="66.3"`), `BRIEF.md` ligne 27,
et `cues.json` (28 phrases, 0,59 → 65,97 s). Contenu impossible à inventer.

### Effet de bord utile : un défaut de mon propre outil

En lisant le BRIEF de capsule-3204, l'agent a exhumé un incident documenté :
Whisper avait halluciné **« Sous-titrage Société Radio-Canada » à 65,97 s**, sur
le silence de fin ; il avait fallu couper à 66,3 s pour l'exclure.

`scripts/transcrire.py` ne filtrait pas ce cas — **il aurait reproduit l'erreur**.
Un cue fantôme est doublement nuisible : il ment sur le contenu, et il offre au
portail une « frontière de phrase » qui n'a jamais été prononcée.

Filtre ajouté (`HALLUCINATIONS`), couvrant les formes connues en français :
mentions de sous-titrage, Amara.org, « merci d'avoir regardé », « abonnez-vous »,
« merci » seul. Les cues écartés sont **affichés**, pas supprimés en silence.

Testé 10 cas : 10/10. Le cas « Merci de votre attention, passons aux sutures »
est conservé — pas de faux positif qui mangerait de la vraie parole.

## 2026-07-30 (suite) — Étape 5, 1er maillon : la transcription

La doctrine impose de transcrire AVANT de monter (RÈGLE 1) et de ne couper
qu'aux frontières de phrases (RÈGLE 0). **Aucun moteur de transcription n'était
installé** : ni `faster_whisper`, ni `openai-whisper`, ni clé OpenAI.

### Choix : transcription locale, non négociable ici

Ce sont des données de santé. Le spec fait localiser le VPS en Allemagne pour le
RGPD ; envoyer l'audio du praticien à une API tierce annulerait ce choix.
`faster-whisper` installé dans le venv Hermes — l'audio ne quitte jamais le VPS.

### Ce que les mesures ont montré (et pourquoi « plus gros modèle » est la
mauvaise réponse)

Test sur un échantillon français contenant le vocabulaire du praticien :

| Modèle | Vitesse | « Baudot » | « Er-Yag » | Segmentation |
|---|---|---|---|---|
| `base` | ×6,9 | Bodo ❌ | RR Biomyag ❌ | correcte |
| `small` | ×2,8 | Bodeau ❌ | herbium yag ~ | correcte |
| `medium` | ×1,1 | Baudot ✅ | HerbiomyaG ❌ | **coupe en plein milieu d'une phrase** ⚠️ |

`medium` est 6× plus lent, rate quand même « Er-Yag », **et dégrade la
segmentation** — donc dégrade précisément ce dont la RÈGLE 0 dépend.

**La vraie solution est l'amorce de vocabulaire** (`initial_prompt`) :
avec elle, `base` ET `small` sortent « Dr Baudot » et « laser erbium YAG »
corrects. Retenu : **`small` + amorce**, ×3 temps réel (cours de 13 min → ~4 min),
et `small` garde le découpage en phrases que `base` fusionne.

### Livré

- `scripts/transcrire.py` — amorce du vocabulaire IMCP, sortie `cues.json` au
  format `{s, e, t}` attendu par le portail, option `--srt`. L'amorce est
  l'endroit où ajouter tout terme mal transcrit signalé par le praticien.
- `/usr/local/bin/transcrire` — wrapper appelable de n'importe où.
- `config.yaml` : `stt.language` **en → fr** (le praticien parle français, la
  config d'origine était en anglais), `stt.local.model` base → small.
- `AGENTS.md` mis à jour : l'agent sait que les frontières viennent de
  `transcrire`, pas de son estimation.

### Chaîne prouvée

Transcription → portail, testé sur les vraies frontières produites :
coupe à 5 s (milieu de phrase) → **rejet code 3** ;
coupe à 9 s (fin de phrase réelle du transcript) → **accepté code 0**.

## 2026-07-30 (suite) — Étape 4 : les gros fichiers (serveur Bot API local)

Limite de fichier passée de **20 Mo à 2 Go**. Sans ça les rushes de 217 Mo
n'entrent pas, et la compression est la cause n°1 de rejet du praticien.

### Procédure suivie

La doc officielle d'Hermes couvre exactement ce cas
(`website/docs/user-guide/messaging/telegram.md`, section « Large Files »). Suivie
à la lettre plutôt qu'improvisée.

| # | Action | Vérification |
|---|---|---|
| 1 | `api_id`/`api_hash` créés par Guillaume sur my.telegram.org, écrits par lui dans `.env` | format validé sans lire les valeurs : ID numérique, hash hex 32 car. |
| 2 | Docker installé (absent jusque-là) | `docker --version` → 29.1.3 |
| 3 | Identifiants isolés dans `tg-bot-api/.env` (2 lignes seulement, 600) | `cut -d= -f1` → les 2 noms attendus |
| 4 | Conteneur `aiogram/telegram-bot-api` en `--local`, bind **127.0.0.1:8081** | `docker ps` → Up |
| 5 | `logOut` de l'API publique (un bot ne vit que sur un serveur à la fois) | `{"ok":true,"result":true}` |
| 6 | `getMe` contre le serveur local | bot `@hermes0montage0ia_bot` confirmé |
| 7 | `platforms.telegram.extra` ajouté au `config.yaml` (sauvegarde datée avant) | `base_url`, `base_file_url`, `local_mode: true` |
| 8 | Gateway redémarré | log : `Using custom Telegram base_url` + `Using Telegram local_mode` + `Connected to Telegram` |

### Deux erreurs commises et corrigées

1. **`user: "1000:1000"` dans le compose** — le conteneur crashait en boucle
   (`chown: Operation not permitted`). Lecture de l'entrypoint : il doit démarrer
   root pour son `chown` initial, puis descend seul en privilège via
   `--username=telegram-bot-api`. Contrainte retirée.
2. **uid 101 du conteneur = compte `messagebus`, groupe `lxd` sur l'hôte.** Le
   dossier de données sortait en `750` → Hermes (`guillaume`) ne pouvait pas
   lire les fichiers reçus. C'est le piège que la doc signale.
   **Refusé d'ajouter `guillaume` au groupe `lxd`** : sur Ubuntu ce groupe donne
   un accès équivalent root via l'API LXD — ce serait ouvrir une faille pour
   régler un souci de permissions. **ACL ciblée** posée à la place
   (`setfacl -m u:guillaume:rX` + ACL par défaut pour l'héritage).
   Lecture réelle du contenu testée, pas seulement `ls` : OK.

### Plafond vérifié à la source

`plugins/platforms/telegram/adapter.py:822` :
`_max_doc_bytes = 2 Go si extra.base_url défini, sinon 20 Mo`. Notre `base_url`
est défini → plafond 2 Go actif. Vérifié dans le code, pas supposé.

### Test réel effectué

Guillaume a écrit au bot depuis son téléphone : message reçu et réponse envoyée
(361 car.) en passant par le serveur local. La chaîne Telegram → serveur local →
Hermes → doctrine → réponse fonctionne bout-en-bout.

**Reste à prouver** : un vrai fichier de 200+ Mo qui transite (la DoD demande ça
explicitement). Non testé faute de rush sous la main.

## 2026-07-30 (suite) — Étape 3 : la doctrine devient une skill Hermes

### Ce qui a été modifié sur le VPS, action par action

| # | Action | Détail | Vérifié par |
|---|---|---|---|
| 1 | `apt install unzip` | Manquait ; bloquait le téléchargement de chrome-headless-shell par HyperFrames | `unzip -v` → UnZip 6.00 |
| 2 | Node déplacé `/root/.hermes/node/` → `/opt/node/` | `/root` est en `700` : aucun compte non-root ne pouvait exécuter `node`. Symlinks `/usr/local/bin/{node,npm,npx}` repointés | `su - guillaume -c 'node -v'` → v22.23.2 |
| 3 | Swap 4 Go créé | `/swapfile`, ajouté à `/etc/fstab` (persiste au reboot) | `free -h` → Swap 4.0Gi |
| 4 | Projet doctrine transféré | `/home/guillaume/imcp/` : `praticiens/baudot.json`, `scripts/portail-doctrine.mjs`, `imcp-hyperframes/_socle/` | `find` → 5 fichiers |
| 5 | Skill installée | `/home/guillaume/.hermes/skills/video/montage-imcp/SKILL.md` | `hermes skills list` → `montage-imcp \| video \| local \| enabled` |
| 6 | `AGENTS.md` déployé | En `/home/guillaume/.hermes/` (cwd du gateway, lu à chaque conversation) ET `/home/guillaume/imcp/`. Source versionnée : `Déploiement Hermes IA/AGENTS-vps.md` | fichiers présents, 3364 o |
| 7 | Wrapper `portail-doctrine` | `/usr/local/bin/portail-doctrine` — le portail lit `praticiens/<nom>.json` en RELATIF, donc cassé hors racine projet. Le wrapper fixe le `cd`. Source : `Déploiement Hermes IA/portail-doctrine-wrapper.sh` | testé depuis `/tmp` |

### Preuve que le portail fonctionne sur le VPS

Plan **fautif** (3 spans épars = la faute historique du teaser v1) → **code 3**,
8 rejets nommés : frontières de phrase non respectées (×3), 2 coupures pour un
maximum de 1, cuts secs sans fondu (×2), format 16:9 pour Instagram Reels,
sous-titres couvrant 17 % de la voix.

Plan **conforme** (une prise continue, 9:16, sous-titres complets) → **code 0**,
aucune violation. Le portail discrimine ; il ne rejette pas tout.

### Choix de conception retenus

- **Pas de duplication de `baudot.json`.** La règle projet « jamais en double »
  s'applique : un seul exemplaire en `/home/guillaume/imcp/praticiens/`, là où le
  portail le lit. `AGENTS.md` pointe dessus au lieu d'en recopier le contenu.
- **`AGENTS.md` est un pointeur + les règles non négociables**, pas une copie de
  la doctrine — celle-ci vit dans la skill, chargée à la demande. Recopier
  aurait garanti la divergence (c'est exactement ce qui était arrivé à
  l'ancien `AGENTS.md` du projet, cf. son propre contenu).
- **Le portail n'a aucune dépendance externe** (`node:fs`, `node:process`
  seulement) : inutile d'installer Remotion et ses 9 dépendances sur le VPS.

### Dette de sécurité assumée, datée

`PermitRootLogin` reste actif — décision de Guillaume du 30/07 : finir
l'installation d'abord, resécuriser à la fin du palier 1. **À couper avant toute
donnée patient.** Accès de secours vérifié : `guillaume@` fonctionne par clé et
appartient au groupe `sudo` (mais `sudo` exige un mot de passe, donc l'admin
automatisée passera par root tant que ce point n'est pas tranché).

## 2026-07-30 — SPEC-PALIER-1, étape 2 : moteur de rendu sur le VPS

Fait :
- Node v22.23.2 déjà présent sur le VPS (78.47.14.178) — pas eu à l'installer.
- `unzip` manquant, bloquait le téléchargement de chrome-headless-shell par
  HyperFrames → installé (`apt install unzip`).
- Projet test `tuto-hermes-16x9` transféré, rendu en ligne de commande
  (`npx hyperframes@0.7.77 render`), comparé pixel par pixel à un rendu local
  frais (même source `index.html`) : identique (les seuls écarts sont du
  lissage de police sous-pixel, invisible à l'œil). Durée, absence d'audio :
  identiques.
- **Fini quand** de l'étape 2 validé : un `.mp4` produit sur le VPS est
  visuellement identique à un rendu local.

Constaté, à trancher par Guillaume avant l'étape 5 (l'agent devra appeler le
rendu lui-même) :
1. **VPS sous-dimensionné** : 2 vCPU / 3.7 Go RAM / 75 Go disque livrés, alors
   que le spec demandait un CPX32 (4 vCPU / 8 Go / 160 Go). Le rendu a quand
   même abouti (5m51 pour 65s de vidéo, 1 seul worker faute de RAM) mais c'est
   loin de la marge prévue pour des rushes réels plus longs.
2. **Root SSH encore ouvert** : la clé configurée sur ce poste se connecte en
   `root@`, alors que le runbook (DoD phase 2) exige `PermitRootLogin no`.
   Écart de sécurité à corriger — projet traitant des données de patients.
3. **Permission trap** : Node est installé sous `/root/.hermes/node/`, et
   `/root` est en `700`. Résultat : ni `hermes` ni `guillaume` (le compte qui
   fait réellement tourner `hermes-gateway.service`) ne peuvent exécuter
   `node`/`npx` — seul `root` le peut. Bloquant pour l'étape 5 : l'agent
   Hermes (process `guillaume`) devra pouvoir invoquer `hyperframes render`
   lui-même. Nécessite soit un déplacement de l'install Node vers un chemin
   accessible (ex. `/usr/local/node/`), soit un ajustement de permissions
   ciblé — pas un simple `chmod o+x /root`.
4. Déploiement réel diverge du runbook sur un point : pas de Docker
   (`docker compose` absent), Hermes tourne nativement via un venv Python +
   service systemd sous l'utilisateur `guillaume` (pas `hermes`).

Prochaine étape : trancher les 4 points ci-dessus, puis étape 3 (doctrine en
skill Hermes).

## 2026-07-29 — Audit et remise à niveau : la gouvernance rattrape la production

**Trou de journal : 19 → 28/07.** Aucune entrée pendant les 11 jours où
13 projets HyperFrames et 30 rendus ont été produits. C'est ce trou qui a permis
à tout le reste de dériver sans être vu.

Constaté (chaque point vérifié par une commande) :
- `src/capsule/` — 14 fichiers, le moteur des 3 capsules livrées — **jamais
  ajouté à git**. Ni suivi, ni ignoré : perdu au premier incident disque.
- `.claude/skills/remotion-best-practices` = **jonction morte** vers
  `Desktop\my-video-IMCP`, dossier supprimé. La doctrine n'était chargée par
  aucun mécanisme depuis le déménagement du projet.
- `npm run lint` **rouge** (6 erreurs), alors que CLAUDE.md interdit d'avancer
  sur rouge.
- `public/music/concerto.mp3` = l'enregistrement Saint-Preux à l'octet près
  (SHA256 identique), suivi par git et poussé sur le remote, utilisé comme
  musique par défaut — alors que la doctrine l'interdit nommément.
- `TeaserLaserErYag` déclarait 1590 frames pour 1860 réelles (9 s d'écart).
- Les 13 compositions HyperFrames portent l'ANCIEN accent beige `#d8c7a8`,
  remplacé par le cyan `#49B6C9` : 46 écarts de charte, jamais signalés.
- HyperFrames absent de toute la gouvernance : 0 occurrence.

Fait :
- `src/capsule/` versionné (commit `50d2456`).
- Saint-Preux retiré du suivi, `.gitignore` passé en fail-closed avec whitelist
  explicite, musique par défaut sur `ambient-bed.wav` synthétisé (`2d1c385`).
- Lint 6 → 0 erreur. Filet sur CapsuleV2 : 14 → 32 tests. Durées dérivées des
  props, plus aucun littéral (`f7c38d0`).
- `check-sizes` étendu à HyperFrames avec son propre régime de seuils et rendu
  bloquant ; `check-charte` et `guard-render` créés ; `npm run check` (`9fd5850`).
- `decisions/014` : HyperFrames acté comme moteur, Remotion en maintenance.
- Doctrine déplacée dans `.claude/skills/`, RÈGLE 4 réécrite, RÈGLE 4bis
  (charte) et RÈGLE 7 (procédure) ajoutées, exception 3ter bornée.
- `baudot.json` : correction du 29/07 ajoutée, `exemplesValides` rempli (4).
- `CLAUDE.md` et `SESSION-PRD.md` remis en accord avec la réalité.

À trancher par Guillaume :
1. Le dépôt GitHub est-il public ? Si oui, purge d'historique à décider.
2. Réharmoniser la palette des 13 compositions (change des rendus livrés) ?
3. Factoriser les 7 teasers (126/144 lignes identiques) et unifier la CLI.

Prochaine étape : réécrire `SPEC-PALIER-1.md` sur HyperFrames, puis implémenter
le plus petit incrément — un aller-retour Telegram avec un montage figé.

## 2026-07-17/18 — Cadrage complet du service cloud + spike + gouvernance
Fait :
- 12 décisions écrites (decisions/001-012) : Telegram, tout-cloud, skill 3 couches,
  boucle auto-critique, overrides NL, crew, pipeline unifié, descriptions, images IA.
- Spike segments exécuté : vestibulaire 6/6 (2 essais), serdat 4/5 — GO confirmé.
  Découverte : piste audio serdat.mov silencieuse (PRD corrigé).
- Gouvernance installée : CLAUDE.md-index, docs/gouvernance/ (5 modules),
  sous-agents segment-spike + relecteur-adversarial, registre decisions/.
- Poussé sur GitHub : commits a4b3fda (gouvernance+spike), f17d7a1 (socle,
  tag socle-gouvernance-v1).
- SPEC-PALIER-1.md rédigé.
Reporté :
- Implémentation palier 1 → session neuve dédiée (voir SPEC-PALIER-1.md).
- Guide WhatsApp périmé à réécrire version Telegram (au fil du palier 1).
- Vérif licence Remotion avant vente (decision 002).
Prochaine étape :
1. Guillaume : créer le bot via @BotFather + mettre les 2 clés dans .env (10 min).
2. Ouvrir une session neuve : « Lis SPEC-PALIER-1.md et implémente l'étape 1 ».
