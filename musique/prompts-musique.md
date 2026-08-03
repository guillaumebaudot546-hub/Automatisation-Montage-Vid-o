# Générateur de musiques par thème — prompts sur mesure

Système pour générer des lits musicaux à proposer au praticien. Fonctionne avec
ElevenLabs Music, Suno, Udio, ou tout générateur texte→musique. **Prompts en
anglais** (les modèles répondent mieux), **étiquette FR** montrée au praticien.

---

## 1. Contraintes techniques — TOUJOURS incluses (le socle)

Ces règles sont ajoutées à chaque prompt, quel que soit le thème. Elles font la
différence entre « une chanson » et « un lit sonore pro qui passe sous une voix ».

```
Instrumental only, no vocals, no lyrics, no vocal samples, no spoken word.
No sudden drops, no dramatic build-ups, no big crescendos — consistent gentle
intensity from start to finish so it never fights a spoken voice-over.
Clean loopable structure, no hard ending. Mixed as a background bed: leave the
mid-range (200 Hz–4 kHz) open for speech. Warm, refined, uncluttered. No
recognizable famous melody. Modern production, high fidelity.
```

## 2. Paramètres à régler à chaque génération
- **Durée** : viser 15–20 s de plus que la vidéo (marge de montage + fondu).
- **Intensité** : `très discret` (lit sous voix continue) · `présent`
  (montage rythmé, peu de voix) — indiqué dans chaque thème ci-dessous.
- **BPM** : 60–90 pour du calme, 90–120 pour de l'énergie. Jamais > 120 (médical).

---

## 3. Gabarit maître (remplir les [crochets])

```
[GENRE] background music for a premium medical / dental education video.
[INSTRUMENTS], [TEMPO] tempo, [MOOD] mood. [INTENSITY].
<+ bloc contraintes techniques de la section 1>
```

---

## 4. Bibliothèque de thèmes — prêts à proposer au praticien

Chaque thème = une étiquette FR (montrée au Dr) + un prompt complet (envoyé au
modèle). Le praticien choisit l'étiquette ; l'IA envoie le prompt correspondant.

### 🎻 « Élégance clinique » — classique feutré (défaut premium)
> Pour : gestes chirurgicaux, contenu haut de gamme, image d'expertise.
```
Elegant neoclassical background music for a premium dental surgery video.
Solo piano with a soft string ensemble, slow tempo (~70 BPM), warm, refined,
sophisticated, understated. Very discreet — sits far behind a spoken voice-over.
Instrumental only, no vocals. No dramatic swells, consistent gentle intensity.
Clean loopable structure, open mid-range for speech. High fidelity.
```

### 🌊 « Sérénité » — ambient calme
> Pour : explications posées, pédagogie douce, soins, relaxation.
```
Calm ambient background music for a dental education video. Soft synth pads,
gentle piano notes, subtle warm textures, very slow tempo (~60 BPM), soothing
and reassuring. Extremely discreet — a soft bed under a spoken voice.
Instrumental only, no vocals, no percussion. No build-ups, flat gentle intensity.
Loopable, open mid-range for speech. Clean modern production.
```

### 💡 « Clarté pédagogique » — moderne léger
> Pour : tutoriels, explications de protocole, contenu didactique rythmé.
```
Light modern background music for an educational dental tutorial. Soft
electric piano, warm bass, subtle marimba or plucks, mid tempo (~95 BPM),
bright, clear, professional, motivating but calm. Present but never busy.
Instrumental only, no vocals. Steady groove, no drops or crescendos.
Loopable, open mid-range for speech. Clean high-fidelity production.
```

### 🚀 « Progression » — inspirant, montée maîtrisée
> Pour : formations, promesses de progression, CTA, fin de capsule.
```
Uplifting cinematic background music for a dental training promo. Warm piano,
sustained strings, soft pulsing synth, mid tempo (~100 BPM), hopeful, forward-
moving, inspiring but tasteful. Present intensity. Instrumental only, no vocals.
A gentle sense of momentum WITHOUT a big climax or drop. Loopable, open mid-
range for speech. Modern high-fidelity production.
```

### ⚙️ « Précision technique » — épuré, tech discret
> Pour : démonstration d'appareil, réglages, focus technique.
```
Minimal modern background music for a medical device demonstration. Sparse
piano notes, clean synth pads, subtle low pulse, slow-mid tempo (~85 BPM),
focused, precise, clean, neutral. Very discreet. Instrumental only, no vocals,
minimal percussion. Constant calm intensity, no swells. Loopable, open mid-
range for speech. Crisp high-fidelity production.
```

---

## 5. Flux produit (comment ça s'intègre)
1. À la soumission d'une vidéo, l'IA analyse le ton (pédagogie / geste / promo)
   et **suggère 2 thèmes** au praticien via Telegram (étiquettes FR + préécoute).
2. Le praticien choisit, ou demande un autre thème.
3. L'IA génère avec le prompt correspondant, durée = vidéo + 18 s.
4. Le lit est posté à ~0,04–0,05 de volume (fondus auto), sous la voix.
5. Le choix nourrit ses préférences (`praticiens/<client>.json`) — au fil du temps,
   son thème favori devient le défaut.

## 6. Droits
Musique **générée** = pas de problème SACEM / Content ID (créée à la demande,
pas un enregistrement existant). C'est l'avantage clé du génératif sur un
morceau téléchargé : reproductible, à la bonne durée, juridiquement propre.
Vérifier les CGU du générateur (ElevenLabs / Suno : usage commercial sur plan
payant). Jamais de prompt nommant un artiste ou une œuvre réelle.
```
```
