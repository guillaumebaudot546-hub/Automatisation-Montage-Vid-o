# Guide de déploiement — Agent vidéo pilotable par WhatsApp (Hermes)

**Version :** 1.0 · **Date :** 16/07/2026 · **Pour :** Guillaume (non-développeur)
**Objectif :** le Dr Baudot envoie une vidéo de chirurgie sur WhatsApp → l'agent Hermes dialogue avec lui (texte, musique, voix off, face cam) → monte la vidéo avec le template Remotion IMCP → renvoie un aperçu → publie après validation.

---

## 0. Vue d'ensemble

```
Dr Baudot (WhatsApp)
      │  vidéo brute + choix (texte / M1-M3 / V1-V3 / face cam)
      ▼
Passerelle Hermes (bridge WhatsApp, tourne sur ton PC ou un VPS)
      │
      ▼
Agent Hermes (LLM) — suit le skill "montage-imcp"
      │  1. enregistre la vidéo dans my-video-IMCP/public/clinical/incoming/
      │  2. pose les questions (message type), collecte les réponses
      │  3. génère la voix off (ElevenLabs) si demandée
      │  4. construit les props JSON (segments, captions, musique, faceCam)
      │  5. lance : npx remotion render HighlightsIncoming out/PREVIEW.mp4
      ▼
Aperçu renvoyé sur WhatsApp → corrections → validation finale → publication
```

**Ce qui existe déjà :** Hermes installé (`%LOCALAPPDATA%\hermes\hermes-agent`), le template Remotion 1 min (`ClinicalHighlights`), les SFX, la charte IMCP.
**Ce qui manque :** la passerelle WhatsApp activée, les voix ElevenLabs, la bibliothèque musicale licenciée, 3 nouvelles props dans le template (musique au choix, voix off, face cam), le skill Hermes.

---

## Étape 1 — Vérifier l'installation Hermes (10 min)

Ouvre PowerShell et tape :

```powershell
hermes doctor
```

Tout doit être vert (Python, Node, ffmpeg, git). Si `hermes` n'est pas reconnu, relance l'installeur :

```powershell
iex (irm https://hermes-agent.nousresearch.com/install.ps1)
```

## Étape 2 — Choisir le modèle LLM (15 min)

```powershell
hermes model
```

**Choix retenu : Claude Opus (`claude-opus-4-8`)** via clé API Anthropic (console.anthropic.com → API Keys). Tarif : 5 $/M tokens en entrée, 25 $/M en sortie → ~0,50–1,30 €/vidéo.

Pourquoi Opus et pas moins cher : l'agent tourne sans surveillance sur un VPS, piloté par WhatsApp. Opus suit les règles strictes (« jamais publier sans validation », « max 3 renders ») beaucoup plus fiablement, et le surcoût vs Sonnet est de ~5–8 €/mois seulement pour 10–15 vidéos.

Colle la clé quand Hermes la demande, choisis Anthropic → `claude-opus-4-8`. Teste ensuite : `hermes` puis pose une question simple.

## Étape 3 — Numéro WhatsApp dédié (30 min, décision importante)

⚠️ **Ne branche pas ton numéro personnel.** Le bridge (whatsapp-web.js/Baileys) automatise un compte WhatsApp normal ; Meta peut suspendre un compte automatisé. Avec un numéro dédié, le risque est isolé.

1. Achète une eSIM ou SIM prépayée (~5–10 €) → nouveau numéro.
2. Installe WhatsApp sur un vieux téléphone (ou WhatsApp Business sur ton téléphone actuel, qui accepte un second numéro).
3. Ce numéro devient « l'assistant vidéo IMCP » — le Dr Baudot l'enregistre dans ses contacts.

*Alternative sérieuse (plus tard, si le service devient critique) : WhatsApp Business Cloud API officielle — nécessite vérification Meta Business, mais zéro risque de suspension. Conversations initiées par le praticien : gratuites.*

## Étape 4 — Activer la passerelle WhatsApp (30 min)

```powershell
hermes setup
```

Dans l'assistant, active **WhatsApp**. Hermes lance le bridge Node et affiche un **QR code** : scanne-le avec le téléphone du numéro dédié (WhatsApp → Appareils connectés → Connecter un appareil). La session reste active ensuite.

Puis restreins l'accès dans le fichier de config Hermes (dossier `~/.hermes` ou `%LOCALAPPDATA%\hermes`, fichier `config.yaml`) :

```yaml
whatsapp:
  dm_policy: allowlist
  allow_from:
    - "+33XXXXXXXXX"   # Dr Baudot
    - "+33YYYYYYYYY"   # Guillaume
  group_policy: disabled
```

Sans ça, n'importe qui écrivant au numéro peut piloter l'agent. **Étape non négociable.**

Démarre la passerelle :

```powershell
hermes gateway
```

Test : envoie « bonjour » au numéro depuis ton téléphone → l'agent doit répondre.

## Étape 5 — Préparer les assets (1–2 h, une seule fois)

### 5a. Voix off (ElevenLabs)

1. Compte sur elevenlabs.io → plan **Creator** (~20 €/mois, 100 min de synthèse).
2. Choisis 3 voix françaises dans la bibliothèque : V1 homme posé, V2 femme claire, V3 homme dynamique.
3. Génère pour chacune un extrait de 15 s avec un texte médical type (« Le laser Erbium-YAG permet une dissection sans saignement… »).
4. Enregistre les extraits : `my-video-IMCP/public/voices/preview-V1.mp3`, `preview-V2.mp3`, `preview-V3.mp3`.
5. Crée une clé API ElevenLabs → donne-la à Hermes (variable `ELEVENLABS_API_KEY` dans sa config).

### 5b. Musique — libre de droit + option Instagram natif

**Stratégie hybride retenue** (deux contraintes incompatibles : la bibliothèque musicale Instagram n'est utilisable QUE dans l'app au moment de publier — impossible de graver ces titres dans le MP4 ni de les pré-écouter sur WhatsApp) :

**A. M1/M2/M3 = morceaux libres de droit, gravés dans la vidéo, pré-écoutables :**

1. Sources gratuites à usage commercial : **Pixabay Music** (pixabay.com/music) ou **YouTube Audio Library** (studio.youtube.com → Bibliothèque audio). Zéro abonnement, zéro SACEM.
2. Télécharge 3 morceaux par thème et garde le meilleur de chaque :
   - **M1 — Classe élégant** (piano/cordes, néo-classique)
   - **M2 — Ambient calme** (nappes douces, méditatif)
   - **M3 — Modern tech** (électro minimale, pulsée)
3. Place-les dans `my-video-IMCP/public/music/M1.mp3`, `M2.mp3`, `M3.mp3` + coupe des extraits de 20 s (`M1-preview.mp3`…) avec ffmpeg pour la pré-écoute WhatsApp.
4. Note la source/licence de chaque morceau dans un fichier `public/music/LICENCES.txt`.

**B. Option « MI » = son Instagram natif (meilleure portée algorithme) :**

- Le praticien répond « MI » → la vidéo est rendue **sans musique** (sourceVol conservé) et le son tendance est ajouté dans le composeur Instagram au moment de publier.
- ⚠️ Les comptes Instagram **Business** ont un accès restreint aux musiques populaires (licences Meta) ; un compte **Créateur** a l'accès complet. Vérifier le type de compte du Dr Baudot avant de promettre cette option.
- Pas de pré-écoute WhatsApp possible pour cette option : le choix du titre se fait dans l'app à la publication.

## Étape 6 — Étendre le template Remotion (dev, à faire faire par Claude Code, ~1 session)

Trois ajouts au schéma zod de `ClinicalHighlights` (fichiers `src/clinical/`) — **respecte la règle : seules les compos 1 min sont modifiables** :

1. **`musicChoice`** : `"M1" | "M2" | "M3"` → mappe vers `public/music/*.mp3` (la prop `musicSrc` existe déjà, c'est un simple sélecteur au-dessus).
2. **`voiceoverSrc`** (fichier audio généré par ElevenLabs) + ducking automatique de la musique pendant la voix (le mécanisme de ducking existe déjà pour `hasAudio`).
3. **`faceCam[]`** : `{ src, mode: "intro" | "pip" | "outro", atSec?, durationSec? }` — `intro` = plein écran avant la chirurgie, `pip` = incrustation coin bas-droit (cadre navy800, filet cyan, ~28 % de largeur), `outro` = plein écran avant le CTA.

Vérifications après chaque modif (règles du repo) : `npm run test` vert + `tsc --noEmit` + un still de contrôle.

## Étape 7 — Écrire le skill Hermes « montage-imcp » (1 h)

Hermes suit des skills (dossier `skills/` de son installation, ou apprentissage par instruction). Crée un fichier de consignes qui contient :

1. **Le message type** (celui validé — texte / M1-M3 / V1-V3 / face cam, combinables, fallback 48 h).
2. **Le workflow état par état :**
   - Vidéo reçue → sauvegarder dans `public/clinical/incoming/AAAA-MM-JJ-titre.mp4` → envoyer le message type.
   - « écouter M2 » → envoyer `public/music/M2-preview.mp3`.
   - « MI » (son Instagram natif) → rendre la vidéo SANS musique et noter « ajouter le son dans l'app Instagram à la publication » dans le message de livraison. Préciser qu'aucune pré-écoute WhatsApp n'est possible pour cette option.
   - « écouter V1 » → envoyer `public/voices/preview-V1.mp3`.
   - Texte reçu → découper en captions (~8–12 mots par fenêtre, réparties sur la durée) ; si voix off demandée → appeler ElevenLabs → sauvegarder le wav.
   - Face cam reçue → sauvegarder, noter le mode d'intégration demandé.
   - Construire le JSON de props → lancer `npx remotion render … --props=props.json`.
   - Envoyer l'aperçu sur WhatsApp → « des corrections ? »
   - Corrections → modifier les props → re-render (boucle).
   - « validé » explicite → rendu final → copier sur le Bureau → notifier Guillaume.
3. **Les interdits :** jamais publier sans le mot « validé » du praticien ; jamais toucher aux compos gelées ; jamais dépasser 3 renders sans demander à Guillaume.

Le plus simple : colle ce guide + le message type dans une conversation Hermes et dis-lui « crée ton skill montage-imcp à partir de ça » — c'est sa spécialité (boucle d'apprentissage).

## Étape 8 — Test end-to-end (1 h)

Depuis TON téléphone (tu es dans l'allowlist) :

1. Envoie une vidéo courte quelconque → le message type doit arriver.
2. Réponds « écouter M2 » → l'extrait audio doit arriver.
3. Réponds « 1 + M2 + V1 » puis un texte de 500 caractères → l'agent doit confirmer, générer la voix, lancer le render.
4. Vérifie l'aperçu reçu : texte défilant, musique, voix off, charte IMCP.
5. Demande une correction (« texte plus tard ») → nouveau render.
6. Envoie « validé » → fichier final sur le Bureau.

Ne donne le numéro au Dr Baudot qu'après un test complet réussi.

## Étape 9 — Mise en service sur VPS (choix retenu)

1. **VPS :** Hetzner CPX31 (~13 €/mois, 4 vCPU/8 Go) ou OVH équivalent. ⚠️ Ne prends pas le VPS à 5 € (2 vCPU/2 Go) : le **rendu Remotion tourne sur le VPS** et a besoin de CPU/RAM — 4 vCPU minimum, sinon un render 1 min prend >30 min.
2. Installation Hermes Linux en une ligne : `curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash`.
3. Clone le repo vidéo sur le VPS : `git clone https://github.com/guillaumebaudot546-hub/Automatisation-Vid-o.git` puis `npm install`. ⚠️ Les rushes (`public/clinical/`) et grosses musiques sont exclus du repo — transfère-les une fois via `scp` ou re-télécharge-les.
4. Refais le pairing WhatsApp (QR) depuis le VPS — la session précédente sur ton PC saute.
5. `hermes gateway` en service systemd (démarrage auto, relance en cas de crash) — demande à Claude Code de générer le fichier service.
6. Sauvegarde hebdo : commit + push du repo depuis le VPS.
7. Surveille le premier mois : consommation API (console Anthropic → Usage) et crédits ElevenLabs.

---

## Coûts récapitulatifs

| | Par vidéo | Par mois (10–15 vidéos) |
|---|---|---|
| LLM Claude Opus 4.8 (5 $/25 $ par M tokens) | 0,50–1,30 € | 8–20 € |
| Voix off ElevenLabs | ~0,20 € | 20 € (forfait Creator) |
| Musique (Pixabay / YouTube Audio Library / son Instagram natif) | 0 € | 0 € |
| WhatsApp (bridge) | 0 € | 0 € |
| VPS Hetzner CPX31 (rendu inclus) | — | ~13 € |
| **Total** | **≈ 0,70–1,50 €** | **≈ 41–53 €** |

## Risques & points légaux (à lire avant mise en production)

1. **RGPD / données de santé :** les vidéos de chirurgie sont des données patients. WhatsApp est chiffré de bout en bout, mais les fichiers transitent par Meta et sont stockés sur ton PC/VPS. Minimum : consentement patient écrit pour chaque cas filmé, disque chiffré (BitLocker), pas de nom de patient dans les fichiers.
2. **Suspension WhatsApp :** le bridge compte perso viole techniquement les CGU de WhatsApp. Numéro dédié = risque isolé. Si le service devient critique → migrer vers l'API Business officielle.
3. **Déontologie :** la validation finale du praticien vaut contrôle déontologique (règle déjà dans le PRD) — l'agent ne publie JAMAIS seul.
4. **Musique :** ne diffuse rien publiquement avec le Concerto Saint-Preux tant que la licence n'est pas réglée. Les morceaux Pixabay/YouTube Audio Library sont libres pour usage commercial (garde `LICENCES.txt` à jour comme preuve). Les sons de la bibliothèque Instagram ne s'utilisent QUE dans l'app à la publication — jamais gravés dans le fichier vidéo.
