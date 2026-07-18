# SPEC — Palier 1 : chaîne minimale Telegram → montage auto → validation

**Date :** 2026-07-18 · **Référence :** decisions/001-009 · **Statut :** à implémenter
**Règle d'usage :** ouvrir une session Claude Code NEUVE avec ce fichier seul en
tête (cycles-sessions.md). Ne pas implémenter dans une session qui a discuté d'autre chose.

## Objectif (une phrase)
Le praticien envoie un rush + un texte sur Telegram ; il reçoit une vidéo 1 min
montée selon la doctrine, avec sous-titres, et trois boutons [Publier] [Modifier]
[Rejeter] — sans aucune intervention manuelle de Guillaume.

## Périmètre — DANS le palier 1
1. **Bot Telegram** (long polling — fonctionne en local ET sur VPS sans webhook)
   qui reçoit : une vidéo, un texte d'accompagnement, des commandes de correction.
2. **Sonde d'ingestion** (ffmpeg, decision 009) : volumedetect (silencieux ?),
   détection de parole (whisper), métadonnées (durée, résolution).
3. **Sélection de segments** (le moteur validé par le spike, decisions 004-006) :
   scene-detect → ~50 images clés → Claude vision (+transcription si parole)
   → 5-6 timestamps → boucle auto-critique K=3 avec portail doctrine.
4. **Captions** : texte du praticien découpé en fenêtres synchronisées
   (`captions[]` de `ClinicalHighlights` — la brique existe).
5. **Rendu** : `npx remotion render` piloté par l'orchestrateur (local d'abord,
   VPS ensuite — Lambda repoussé au palier 2+). Compression sortie ~20 Mo (NVENC).
6. **Livraison Telegram** : vidéo + boutons inline. [Modifier] accepte une
   correction en langage naturel → régénération. AUCUNE publication automatique.
7. **État par vidéo** : un dossier par job (`jobs/<id>/`) avec un `state.json` —
   reprise sur erreur, historique des essais.

## HORS palier 1 (ne pas construire, même si tentant)
Voix off, face cam, traduction, musique auto, ligne éditoriale hebdo, descriptions
de posts, images IA, publication réseaux, serveur Bot API local (2 Go), Remotion
Lambda, R2. → paliers 2-3, decisions 007-011.

## Architecture technique
- **Langage :** TypeScript/Node (cohérent avec le repo Remotion existant).
- **Bot :** grammY (long polling). Limite standard 20 Mo acceptée au palier 1 —
  tests avec rushes compressés ; le serveur Bot API local (2 Go) arrive au déploiement VPS.
- **Sélection :** API Anthropic, modèle `claude-opus-4-8`, images en résolution
  standard (~1 568 tokens/image). Prompt = doctrine (005) + exemples few-shot
  (les 11 segments validés) + préférences praticien (`praticiens/baudot.json` à créer).
- **Arborescence nouvelle :** `src/pipeline/` (domaine `montage` étendu) —
  `bot.ts`, `sonde.ts`, `segments.ts`, `captions.ts`, `rendu.ts`, `etat.ts`.
  Un fichier = une job, ≤ 300 lignes (architecture.md).
- **Secrets :** `.env` (déjà gitignoré) — `TELEGRAM_BOT_TOKEN`, `ANTHROPIC_API_KEY`.

## Prérequis à fournir par Guillaume (bloquants, ~10 min)
1. **Token de bot Telegram** : parler à @BotFather sur Telegram → `/newbot` →
   copier le token dans `.env`. (Je ne peux pas le faire — c'est ton compte.)
2. **Clé API Anthropic** dans `.env` (console.anthropic.com).
3. Plus tard, au déploiement : VPS Hetzner (~6 €/mois) + compte à créer par toi.

## Definition of Done du palier 1 (verification.md)
- [ ] `npm run test` vert (tests des modules pipeline inclus)
- [ ] `npm run lint` et `npm run check:sizes` verts
- [ ] **Test bout-en-bout réel** : envoyer un extrait de rush depuis le téléphone
      de Guillaume → recevoir la vidéo montée + boutons dans Telegram
- [ ] [Modifier] avec une phrase de correction → nouvelle version reçue
- [ ] Rush muet ET rush avec parole traités par le MÊME flux (decision 009)
- [ ] Aucune publication sans appui explicite sur [Publier] (contrôle déontologique)
- [ ] Preuves montrées (sorties de commandes + captures du flux Telegram)

## Ordre de build suggéré (chaque étape testée avant la suivante)
1. `etat.ts` + `sonde.ts` (testables sans bot ni API)
2. `segments.ts` (réutilise la logique du spike — comparer sur vestibulaire : doit retrouver ~6/6)
3. `captions.ts` + `rendu.ts` (testables sur un jeu de timestamps fixe)
4. `bot.ts` (assemblage, boutons, corrections)
5. Test bout-en-bout depuis le téléphone de Guillaume — AVANT tout contact praticien
   (le numéro ne va au Dr Baudot qu'après un test complet réussi — mémo IMCP)
