# 001 — Telegram, pas WhatsApp

**Date :** 2026-07-17 · **Statut :** Actif

## Contexte
Le praticien envoie ses rushes et ses demandes via messagerie. Choix du canal.

## Décision
**Telegram**, via le **serveur Bot API local auto-hébergé** (open source).

## Pourquoi
- **Taille des fichiers.** Les rushes font 720 Mo (`vestibulaire.mp4`) et 207 Mo
  (`serdat.mov`). WhatsApp Business Cloud API plafonne les médias à **16 Mo** →
  pipeline techniquement impossible. Telegram Bot API standard plafonne à 20 Mo,
  mais le **serveur Bot API local monte à 2 Go**.
- **Pas de ban.** Les bridges WhatsApp non officiels (Hermes, Baileys,
  whatsapp-web.js) violent les CGU → risque de bannissement du numéro en plein
  service client médical.
- **Messages proactifs natifs.** La ligne éditoriale hebdomadaire ne demande
  aucune approbation de template et ne coûte rien (WhatsApp l'imposerait).
- **Claviers inline** → préécoute des voix off native (boutons Voix 1/2/3).

## Conséquences
- Le Dr Baudot doit installer Telegram (friction réelle en France, WhatsApp y est
  universel). Acceptable vs impossibilité technique de WhatsApp.
- Le serveur Bot API local tourne sur le même VPS que l'orchestrateur (~0,5 j).
