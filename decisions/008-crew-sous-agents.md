# 008 — Crew de sous-agents pour le montage

**Date :** 2026-07-17 · **Statut :** Carte (build échelonné après spike)

## Contexte
Le montage professionnel se découpe en métiers distincts. Chaque métier = un
sous-agent scopé qui explore beaucoup mais ne renvoie qu'un résumé (pattern
Anthropic : séparation des préoccupations, contexte isolé).

## La carte
| Sous-agent | Rôle | Renvoie | Statut |
|------------|------|---------|--------|
| `segment-spike` | Choix des timestamps (vision + audio) | taux + timestamps | **Existe** |
| `montage-juge` | Portail ② : « histoire du geste claire ? » | note + verdict | Après spike |
| `audio` | Voix off, musique (couche pré-validée), ducking | pistes + niveaux | Après spike |
| `motion` | Mapping override NL → palette d'effets codés | effets + params | Après spike |
| `captions-i18n` | Sous-titres + traduction multi-langue | fenêtres + textes | Après spike |
| `orchestrateur` | État par vidéo, file, reprise, appelle le crew | statut vidéo | Après spike |

## Règle de gouvernance
Chaque sous-agent NE renvoie qu'un résumé au fil principal. Jamais les images, les
logs ffmpeg, les transcriptions brutes. Le bruit reste isolé dans le sous-agent.

## Ordre de build — DISCIPLINE
Ne construire QUE `segment-spike` (+ sa boucle 006) tant que le spike n'a pas
validé le séquençage. Tout le reste décore une fondation non prouvée. Build
échelonné ensuite, un sous-agent à la fois, chacun testé isolément.

## Note transcription
Demande initiale disait « dix sous-agents » — probablement transcription vocale de
« des sous-agents ». Carte ci-dessus = 6. À confirmer avec Guillaume.
