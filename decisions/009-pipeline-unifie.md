# 009 — Pipeline unifié : zéro distinction de cas, détection auto

**Date :** 2026-07-18 · **Statut :** Actif (spécifie le palier 1)

## Contexte
Le spike a utilisé un vocabulaire « mode difficile / mode facile » (avec ou sans
audio). C'était le protocole de TEST, pas le produit. Guillaume exige : aucune
distinction de traitement selon l'objet de la vidéo ou son contenu.

## Décision
**Un seul pipeline pour toute vidéo entrante.** Le pipeline SONDE le fichier et
s'adapte tout seul — jamais l'inverse (on ne demande rien au praticien).

## Étape de sonde à l'ingestion (automatique, ffmpeg)
| Sonde | Résultat possible | Conséquence |
|-------|-------------------|-------------|
| `volumedetect` | piste silencieuse (< -50 dB) | sélection = vision seule ; PAS d'alerte bloquante |
| détection parole (whisper) | commentaire praticien présent | transcription = signal principal de sélection |
| pas de parole mais du son | musique / bruits d'instruments | vision seule pour la sélection ; le son source peut être gardé ou remplacé selon la demande |

## Options composables — toutes cumulables ou individuelles
Chaque demande du praticien (langage naturel, message Telegram) peut combiner
librement :
- voix off (lue depuis son texte, voix choisie par préécoute)
- sous-titres (depuis son texte OU depuis la transcription de son commentaire)
- traduction des sous-titres et/ou de la voix off dans toute langue demandée
- face cam en intro/insert
- musique (couche pré-validée, choisie par thème)
- overrides d'effets (decision 007)

**Aucune option n'en présuppose une autre.** « Sous-titres en anglais seulement »,
« voix off + face cam sans sous-titres », « rien du tout » : tous valides. Le
parseur de demande produit un objet d'options indépendantes, chacune on/off.

## Ligne éditoriale hebdomadaire
Chaque semaine (cron sur le VPS), l'IA envoie au praticien via Telegram une
proposition de ligne éditoriale : sujets suggérés selon les vidéos déjà publiées,
les cas récents, la saison. Message proactif natif Telegram (decision 001), coût
nul. Fait partie du build (était déjà au plan — palier 3).

## Lien avec le spike (004)
L'unique échec du spike (comblement vs radio post-op) montre que le commentaire
praticien améliore probablement la sélection. On l'ENCOURAGE (« commentez en
filmant si vous voulez ») mais on ne l'EXIGE jamais : le pipeline traite les deux
cas — c'est prouvé (6/6 et 4/5 en vision seule).
