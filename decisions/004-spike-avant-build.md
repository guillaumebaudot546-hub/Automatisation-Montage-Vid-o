# 004 — Spike de validation avant tout build

**Date :** 2026-07-17 · **Statut :** ✅ FAIT — verdict GO (exécuté le 2026-07-18)

## Résultats (2026-07-18)
- **Vestibulaire (vision seule, muet) : 6/6 en 2 essais** (4/6 → 6/6). La boucle
  auto-critique (006) a récupéré les 2 moments manqués par ré-extraction fine.
  Écarts finaux 0-1 s. 55 images lues, ~2,5 min.
- **Serdat : 4/5 dès l'essai 1** — MAIS découverte critique : **la piste audio de
  serdat.mov est numériquement silencieuse** (mean -90 dB). Le commentaire du
  Dr Baudot annoncé par le PRD n'est pas dans le fichier. Le test s'est fait en
  vision seule. L'unique échec (318 s vs 295 s) est une ambiguïté sémantique
  (comblement = geste final vs radio post-op = constat) qu'un commentaire audio
  aurait tranchée.
- **Réserve d'honnêteté** : les briefs contenaient des indices partiels
  (« 16=laser, 282=résultat », « 12=radio, 295=comblement »). Les timestamps
  intermédiaires ont été trouvés en aveugle et ont tapé juste ; les scores sont
  légèrement optimistes mais la convergence est réelle.
- **Hypothèse restante non testée** : l'apport de l'audio n'a pas pu être mesuré
  (piste vide). La recommandation « commenter en filmant » reste plausible mais
  non prouvée.

## Exigence produit née du spike
**Contrôle qualité audio à l'ingestion** : `ffmpeg volumedetect`, alerter si
max < -50 dB. Sinon la promesse « l'audio est le signal principal » échoue en
silence, comme ici. À intégrer au palier 1 du build.

## Ancien contenu (protocole prévu)

## Contexte
Le build complet fait 26-38 jours-homme. Une seule question peut le tuer :
**est-ce que Claude choisit les segments aussi bien que Guillaume ?**

## Décision
Un spike de 2-3 jours (~50 € d'API) AVANT tout développement.

## Protocole
Banc de test déjà disponible :
- **`vestibulaire.mp4`** — muet, 5:01. Mode difficile (vision seule).
  Vérité terrain : 6 segments à 16/55/95/148/196/282 s.
- **`serdat.mov`** — avec audio du Dr Baudot, 5:45. Mode facile (transcription
  + vision). Vérité terrain : 5 segments à 12/65/115/175/295 s.

Pipeline : `ffmpeg scene-detect → ~50 images clés → Claude vision (+transcription
Serdat) → segments proposés`. Comparer aux choix manuels.

## Critère de décision
- **4/6 retrouvés** → prometteur, on build.
- **1/6** → l'approche visuelle ne suffit pas. On ancre la sélection sur le
  commentaire audio → le produit change : le praticien commente en filmant.

## Note gouvernance
Le spike brûle des dizaines de milliers de tokens (images). À exécuter dans un
**sous-agent scopé** qui ne renvoie qu'un résumé (taux + timestamps), pour ne pas
noyer le fil de décision. Voir [decisions/README](README.md).
