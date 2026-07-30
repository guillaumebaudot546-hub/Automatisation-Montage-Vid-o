# SPEC — Palier 1 : chaîne minimale Telegram → montage auto → validation

**Date :** 2026-07-29 (réécriture) · **Références :** decisions/001-014 · **Statut :** à implémenter
**Remplace :** la version du 2026-07-18, écrite sur Remotion et périmée par `decisions/013` le jour même.

**Règle d'usage :** ouvrir une session Claude Code NEUVE avec ce fichier seul en
tête (`cycles-sessions.md`). Ne pas implémenter dans une session qui a discuté
d'autre chose.

---

## Objectif (une phrase)

Le praticien envoie un rush + un texte sur Telegram ; il reçoit une vidéo montée
selon la doctrine, avec sous-titres, et trois boutons [Publier] [Modifier]
[Rejeter] — sans aucune intervention manuelle de Guillaume.

## Ce qui a changé depuis la version du 18/07

| Point | Avant | Maintenant |
|---|---|---|
| Moteur de rendu | `npx remotion render` | **HyperFrames** (`decisions/014`) |
| Portail doctrine | à écrire | **existe** — `scripts/portail-doctrine.mjs`, testé |
| Préférences praticien | JSON non lu | **lisible par du code** — `src/lib/praticien.ts` |
| Exemples few-shot | `exemplesValides: []` | **4 exemples** dans `praticiens/baudot.json` |
| Modèle | `claude-opus-4-8` | `claude-opus-5` — même prix, plus capable |
| Limite Telegram | 20 Mo « acceptée » | **confrontée au réel** : les rushes font 217 Mo (voir Étape 4) |

---

## Découpage en 4 étapes, chacune livrable seule

L'échec du palier 1 v1 n'était pas technique : 11 décisions écrites, zéro ligne
de code. Ce découpage existe pour que **chaque étape produise quelque chose qui
tourne**, plutôt qu'un grand plan qu'on n'attaque jamais.

### Étape 1 — La plomberie, sans aucune IA ⬅️ COMMENCER ICI

**But :** prouver l'aller-retour Telegram. Rien d'autre.

Le praticien envoie une vidéo → il reçoit **un montage figé** (un teaser existant
re-rendu, ou même le rush inchangé) avec les trois boutons. Pas de sonde, pas de
sélection de segments, pas de boucle, pas d'appel API.

- `src/pipeline/bot.ts` — grammY, long polling (marche en local ET sur VPS)
- `src/pipeline/etat.ts` — un dossier par job `jobs/<id>/` + `state.json`
- `src/pipeline/rendu.ts` — appelle `npx hyperframes render` dans le dossier
  du projet, renvoie le chemin du `.mp4`

**Fini quand :** depuis le téléphone de Guillaume, envoyer une vidéo et recevoir
une vidéo avec les trois boutons. C'est tout.

**Pourquoi d'abord :** c'est la partie qui a le plus de façons d'échouer pour des
raisons bêtes (token, taille de fichier, format, timeout, chemins Windows). La
régler sans IA dans l'équation évite de débugger deux choses à la fois.

### Étape 2 — La sonde

`src/pipeline/sonde.ts` : ffmpeg `volumedetect` (le rush est-il muet ?),
transcription whisper si parole, métadonnées (durée, résolution, ratio).

⚠️ `decisions/009` décrit une sonde qui ne détecte pas ce que `decisions/013`
lui demande. La doctrine actuelle distingue **talking-head** (voix continue +
calques) de **clinique** (geste). La sonde doit donc trancher : y a-t-il un
visage qui parle ? Sans cette sortie, l'étape 3 applique la mauvaise doctrine —
c'est exactement la faute de la capsule v1.

**Fini quand :** la sonde traite le rush muet ET le rush avec parole, et sort un
verdict de type de contenu. Testable sans bot ni API.

### Étape 3 — La sélection de segments et la boucle

`src/pipeline/segments.ts` :

```
scene-detect → ~50 images clés
        ↓
Claude vision (claude-opus-5) + transcription + doctrine + exemples validés
        ↓
plan de montage JSON
        ↓
① PORTAIL DOCTRINE  ← npm run portail (existe, testé, gratuit, déterministe)
        ↓ rejet → refaire, plafond K=3
② portail juge (sous-agent)          ← reste à écrire
        ↓
③ Dr Baudot                          ← seul oracle du goût
```

Le portail ① est **déjà écrit et testé** : il refuse les coupes hors frontières
de phrase, le best-of de punchlines éparses, les cuts secs entre deux prises, un
format incohérent avec le réseau, un calque hors bornes et un sous-titrage
partiel. Sur les données réelles, il laisse passer le teaser-04 livré et rejette
la faute historique du teaser v1 avec 15 motifs.

**Le prompt** = doctrine (`.claude/skills/montage-imcp/SKILL.md`) + préférences
et exemples validés (`praticiens/baudot.json`, lus via `src/lib/praticien.ts`).

**Fini quand :** rejouer le spike sur vestibulaire retrouve ~6/6 segments.

### Étape 4 — Assemblage et corrections

`captions.ts` (texte du praticien découpé en fenêtres), boutons inline,
[Modifier] qui accepte une correction en langage naturel et régénère.

---

## Le problème de taille, traité franchement

`IMG_3181.mov` fait **217 Mo**. `IMG_3204.mov` fait **212 Mo**. La limite
standard de l'API Bot Telegram est de **20 Mo**. La version précédente de cette
SPEC écrivait « limite 20 Mo acceptée au palier 1 » — ce n'était pas un
arbitrage, c'était le problème repoussé.

Trois options, à trancher au moment où l'étape 1 fonctionne :

| Option | Coût | Conséquence |
|---|---|---|
| **Rush compressé** pour les tests | 0 € | Suffit pour l'étape 1. Qualité dégradée — c'est déjà la cause n°1 des rejets du praticien (`baudot.json`, corrections v2 et v3) |
| **Serveur Bot API local** | VPS ~6 €/mois | Limite passe à 2 Go. **C'est la vraie solution** et elle règle aussi le problème de qualité à la racine |
| Envoi hors Telegram (lien) | 0 € | Casse la promesse « le praticien envoie et reçoit dans Telegram » |

**Recommandation :** rush compressé pour l'étape 1, serveur Bot API local dès
l'étape 2. Ne pas contacter le Dr Baudot avant que le serveur local tourne — la
qualité perçue est son motif de rejet le plus constant.

## Budget API, chiffré

Modèle : `claude-opus-5` — **5 $ / million de tokens en entrée, 25 $ en sortie**.

| Poste | Volume | Coût |
|---|---|---|
| ~50 images clés en résolution standard | ~1 568 tokens/image → 78 400 | 0,39 $ |
| Doctrine + préférences + exemples + transcription | ~20 000 tokens | 0,10 $ |
| Sortie (timestamps + justification) | ~2 000 tokens | 0,05 $ |
| **Une passe** | | **~0,54 $** |
| **Plafond K=3** | | **~1,62 $ / vidéo** |

Deux leviers, à activer dès l'étape 3 :

- **Cache de prompt.** Doctrine, préférences et exemples sont un préfixe stable :
  mis en cache, ils passent à 0,1× sur les itérations 2 et 3. Le plafond réel
  tombe sous 1,20 $.
- **Résolution.** `claude-opus-5` accepte jusqu'à 2576 px sur le grand côté, soit
  jusqu'à ~4 784 tokens par image — **triple le coût**. Rester en résolution
  standard sauf besoin prouvé de finesse.

Le plafond K=3 protège ce budget. Il n'est pas négociable.

---

## Architecture technique

- **Langage :** TypeScript/Node, cohérent avec `src/`.
- **Arborescence :** `src/pipeline/` — `bot.ts`, `sonde.ts`, `segments.ts`,
  `captions.ts`, `rendu.ts`, `etat.ts`. Un fichier = une job, ≤ 300 lignes
  (`architecture.md`, garanti par le hook `check-sizes`).
- **Secrets :** `.env` (déjà gitignoré) — `TELEGRAM_BOT_TOKEN`, `ANTHROPIC_API_KEY`.
- **Rendu :** `npx hyperframes render` dans le dossier du projet. Un seul rendu à
  la fois — le hook `guard-render` refuse le second.

## HORS palier 1 (ne pas construire, même si tentant)

Voix off, face cam, traduction, musique auto, ligne éditoriale hebdo,
descriptions de posts, images IA, publication réseaux, Remotion Lambda, R2.
→ paliers 2-3, `decisions/007-011`.

## Prérequis à fournir par Guillaume (bloquants, ~10 min)

1. **Token de bot Telegram** : @BotFather → `/newbot` → coller dans `.env`.
   (Je ne peux pas le faire, c'est ton compte.)
2. **Clé API Anthropic** dans `.env` (console.anthropic.com).
3. Au déploiement : VPS Hetzner (~6 €/mois), compte à créer par toi.

## Definition of Done du palier 1

- [ ] `npm run check` vert — lint, tests, tailles, charte, socle, CLI
- [ ] Tests des modules pipeline inclus
- [ ] **Test bout-en-bout réel** : envoyer un rush depuis le téléphone de
      Guillaume → recevoir la vidéo montée + boutons dans Telegram
- [ ] [Modifier] avec une phrase de correction → nouvelle version reçue
- [ ] Rush muet ET rush avec parole traités par le MÊME flux (`decisions/009`)
- [ ] Le portail doctrine rejette au moins un plan fautif en conditions réelles
- [ ] Aucune publication sans appui explicite sur [Publier] (contrôle déontologique)
- [ ] Preuves montrées : sorties de commandes + captures du flux Telegram

Le numéro ne va au Dr Baudot **qu'après** un test complet réussi depuis le
téléphone de Guillaume (mémo IMCP).
