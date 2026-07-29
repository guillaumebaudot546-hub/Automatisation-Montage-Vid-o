# 013 — Doctrine par type de contenu : le talking-head a sa grammaire

**Date :** 2026-07-18 · **Statut :** Actif

## Contexte
Le test « Vidéo 1 » (capsule laser Er-Yag) a appliqué la doctrine CLINIQUE
(segments 8-10 s, coupes franches) à un TALKING-HEAD (praticien face caméra).
Verdict Guillaume : rien ne va — voix hachée, format cassé, qualité dégradée,
propos pas mis en avant. Diagnostic : la doctrine 005 n'est PAS universelle.

## Décision — deux grammaires, détectées à l'ingestion
| | Clinique (geste filmé) | Talking-head (discours) |
|---|---|---|
| Colonne vertébrale | l'image (phases opératoires) | **la voix, continue** |
| Coupes | fenêtres 8-10 s sur les phases | **UNIQUEMENT aux fins de phrases** (transcription) |
| Zoom/flash | transitions entre segments | aux jonctions de spans + entrées de calques |
| Illustration | la vidéo EST le contenu | **calques par-dessus, audio jamais coupé** : slide, listes animées, B-roll clinique, CTA |
| Sous-titres | résumé condensé | **transcription intégrale nettoyée** |
La détection du type se fait à la sonde (decision 009) : parole continue
dominante = talking-head ; phases visuelles + parole rare = clinique.

## Règles qualité (nées des défauts v1, valables partout)
1. **Jamais d'asset paysage plaqué en portrait** — sting reconstruit en code
   par format (PortraitSting). Vérifier le ratio de CHAQUE asset inséré.
2. **Une seule passe d'encodage** — rendu final direct en CRF 18 ;
   la re-compression ffmpeg derrière le rendu est interdite.
3. **Pas de zoom/Ken Burns sur source basse résolution** (rush WhatsApp 464×832) :
   chaque scale recadre et dégrade. Zoom réservé aux jonctions (masquage de coupe).
4. **Slide fournie par le praticien = version la plus lisible** (context 2, pas 1).

## Implémentation
`src/capsule/CapsuleV2.tsx` (orchestration voix continue + calques),
`CapsuleOverlays.tsx` (sting portrait, KineticList, BrollCutaway, CtaRibbon),
props timeline dans `capsule1-props.ts`, calage sur `out/capsule1/audio.srt`.

## Écarté
- Doctrine unique pour tous les contenus (démentie par le test).
- Grammaire jump-cut sans zoom/flash proposée par l'IA : Guillaume tranche —
  **garder le langage zoom/flash IMCP partout**, placé sur les respirations.
