# Coût par vidéo — état et reste à faire

**Doctrine :** `decisions/016-cout-par-video.md`. Ce fichier est le tableau de
bord d'exécution ; la décision explique le *pourquoi*.

**Règle qui gouverne tout :** on ne coupe que la plomberie. Le raisonnement
(doctrine, préférences, exemples, transcription, choix des segments) ne se
touche pas — il augmente.

---

## Référence

| | |
|---|---|
| Mesure | 30/07/2026, rush 39 s, 59 appels |
| Facture | **6,91 $** (écriture cache 3,72 · relecture 1,85 · sortie 1,34) |
| Volume reconstitué | 7 à 10 M jetons, ~120 000 jetons de contexte par appel |
| Cible | **1 à 1,5 $** par vidéo, sélection sur le meilleur modèle |

⚠️ **Sonnet 5 est en tarif d'introduction (2 $/10 $ par MTok) jusqu'au
31/08/2026**, puis 3 $/15 $. À structure inchangée, la facture monte de 50 % au
1er septembre.

---

## Fait — 01/08/2026

### Étape 1 · Polices hors du HTML ✅

`npm run fonts:extract` · garde-fou `npm run fonts:check` (dans `npm run check`)

- 14 fichiers convertis, **2 020 438 octets retirés** (−81 % à −93 % par fichier)
- 4 `.woff2` dans `_socle/assets/fonts/`, copiés par `npm run socle:sync`
- `socle-assets.mjs` gère les dossiers d'assets et *sème* ceux que le HTML référence

**Vérifié :** round-trip bit-pour-bit contre `HEAD` (4/4), signatures `wOF2`,
0 référence `./fonts/` cassée sur 13 compositions, `teasers:check` à 0 dérive
(le socle regénère toujours l'octet exact), `check-sizes` / `check-charte` verts.

**Reste à faire par Guillaume :** un `npx hyperframes render` sur une
composition, et **regarder le `.mp4`**. Une police manquante ne produit aucune
erreur — elle tombe en fallback sans-serif. La doctrine l'exige ; je ne peux pas
le faire à ta place.

### Étape 4 · Portail en verrou ✅

`scripts/guard-portail.mjs`, branché en hook `PreToolUse`.

Le portail écrit `.portail-ok.json` (empreinte SHA-256 du plan + horodatage) ;
aucun rendu ne part sans reçu couvrant cette version exacte du plan. Validité 1 h.

**Vérifié :** plan valide → portail 0 → rendu autorisé (0). Plan fautif → portail
3 (RÈGLE 0, coupe hors frontière de phrase) → rendu bloqué (2). Reçu absent ou
plan modifié → bloqué (2). Commande non-rendu → ignorée (0).

### Correctif · `guard-render.mjs` multiplateforme ✅

Le garde-fou « jamais deux rendus en parallèle » ne sondait que via
`powershell.exe`. Sur le VPS Linux le `catch` renvoyait `[]` : **il ne protégeait
rien là où la production tourne**. Sonde désormais `ps -eo args=` hors Windows.

---

## Reste à faire, dans cet ordre

### Étape 3 · Sorties d'outils hors du contexte — *config VPS*

La règle est écrite (`deploiement/AGENTS-vps.md`, section « Ce que tu ne charges
pas dans TON contexte ») et doit être **redéployée sur le VPS** :

```bash
scp deploiement/AGENTS-vps.md guillaume@<vps>:/home/guillaume/.hermes/AGENTS.md
```

Puis, une fois les dumps hors contexte, dans `~/.hermes/config.yaml` :

| Réglage | Actuel | Cible | Pourquoi |
|---|---|---|---|
| `proactive_prune_tokens` | 120 000 | **0** | Plus rien à élaguer, et élaguer casse le cache |
| compression | 0,4 | **0,5+** | Se déclenchait sur du volume de plomberie |

**Sauvegarder `config.yaml` horodaté avant chaque modification**, un réglage à la
fois, en remesurant entre deux.

### Étape 2 · Builder `plan.json → index.html` — *le gros morceau*

⚠️ **Ce n'est pas une extension de `teasers-build.mjs`.** Les deux schémas sont
différents :

| | `teaser.json` | `plan.json` |
|---|---|---|
| Champs | `rootDur`, `vid`, `module`, `endTitle`, `cues`, `k`, `cartes[]` | `format`, `reseau`, `spans[]`, `crossfades[]`, `overlays[]`, `captions[]`, `dureeTotaleSec` |
| Source | vidéo longue existante | rush du praticien |

Ce qui manque : la correspondance entre les 5 types d'overlay du portail
(`stat`, `chart`, `site`, `list`, `punch`) et un rendu visuel. **C'est une
décision de design sur le livrable du Dr Baudot, pas une décision technique.**
Je ne l'ai pas prise seul — c'est exactement ce que « sans atténuer la qualité du
montage » interdit.

Méthode recommandée, celle qui a marché pour le socle des teasers : partir de
`videos/capsule-3204/` (montage sur rush déjà livré et validé), en extraire un
template avec placeholders, **et vérifier la régénération octet-pour-octet**.
Une extraction depuis du validé, pas une invention.

À faire avec toi, sur un rendu de référence sous les yeux.

### Étape 5 · Routage modèle — *config VPS*

| Tâche | Modèle | Tarif |
|---|---|---|
| **Sélection des segments** | **Opus 5** | 5 $ / 25 $ |
| Orchestration, décisions de reprise | Sonnet 5 | 3 $ / 15 $ |
| Lancer ffmpeg, lire un code de sortie, formater un titre | Haiku 4.5 | 1 $ / 5 $ |

Après les étapes 1-3, le contexte de sélection retombe à ~15 000 jetons :
**~0,12 $ la passe sur Opus 5, 0,36 $ au plafond K=3**. C'est le réinvestissement
prévu par la décision 016 — le meilleur modèle sur l'étape qui décide si le
praticien accepte la vidéo.

### Étape 6 · Rouvrir le cache — *après mesure*

`cache_ttl` 1 h → 5 min **uniquement si les rendus sortent de la boucle d'agent**
(étape 2). L'écriture 1 h coûte 2× l'entrée, la 5 min 1,25× : −37,5 % sur le
poste le plus gros. Mais le seuil de rentabilité passe de 2 à 3 relectures.
En dernier, mesures à l'appui.

---

## Protocole de mesure

Rejouer **le même rush de 39 s** après chaque étape et noter, par appel :
`cache_creation_input_tokens`, `cache_read_input_tokens`, `output_tokens`, plus le
nombre total d'appels. Dans `mesures/AAAA-MM-JJ-<étape>.json`.

Sans référence, on ne saura pas si un correctif a marché — c'est ce qui a permis
à 11 jours de dérive de passer inaperçus (journal, 19→28/07).
