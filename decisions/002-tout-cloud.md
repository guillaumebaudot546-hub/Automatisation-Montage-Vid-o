# 002 — Pipeline 100 % cloud

**Date :** 2026-07-17 · **Statut :** Actif

## Contexte
Où tourne le montage ? Poste Windows de Guillaume, ou cloud ?

## Décision
**Tout en cloud.** Le poste Windows sort complètement de la boucle de production.

## Pourquoi
- Le praticien ne doit subir aucune contrainte technique — il valide, c'est tout.
- Service disponible en permanence, pas dépendant d'un PC allumé.

## Architecture
```
Telegram → VPS Hetzner (Bot API local + orchestrateur + ffmpeg scene-detect)
         → Cloudflare R2 (stockage rushes, purge 30 j = aligné RGPD)
         → Claude Opus 4.8 (reçoit UNIQUEMENT les images clés, jamais le rush)
         → fonction template (code) → Remotion Lambda (rendu)
         → Telegram : vidéo + boutons [Publier] [Modifier] [Rejeter]
```

## Contrainte dure
- **Files API Anthropic plafonne à 500 Mo ; le rush fait 720 Mo.** Le rush ne
  transite JAMAIS par Claude. Seules les images clés (~100 Ko pièce) partent à l'IA.

## Coûts
- VPS Hetzner 6-12 € + R2 ~1 € + Lambda ~1-3 € = **~10-15 €/mois** côté MedStream.
- Claude ~0,50 €/vidéo + ElevenLabs → côté cabinet.

## À vérifier avant de vendre
- **Licence Remotion** : gratuite sous un certain effectif, payante pour les
  sociétés au-delà. Guillaume est seul aujourd'hui — confirmer avant, pas après.
