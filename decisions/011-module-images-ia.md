# 011 — Module de génération d'images IA pour les posts

**Date :** 2026-07-18 · **Statut :** Estimé (build après paliers vidéo)

## Contexte
Le praticien pourrait demander une image IA (au même titre qu'une vidéo) : créée,
puis modifiée/embellie sur demande, avec ajout possible d'un commentaire texte ou
d'une photo de cas clinique réelle. Alignée ligne éditoriale + infos praticien.

## Flux (miroir du flux vidéo)
```
Demande Telegram (« une image pour le post sur les greffes »)
  → prompt construit : ligne éditoriale + mots clés + préférences praticien
  → génération → envoi Telegram → [Valider] [Modifier] [Rejeter]
  → « Modifier » en langage naturel → édition img2img → re-proposition
  → composition finale (code, pas IA) : incrustation photo clinique réelle,
    texte, logo IMCP, charte → publication après validation
```

## Coûts API (ordres de grandeur 2026)
| Modèle | Par image | Note |
|--------|-----------|------|
| **Nano Banana Pro (Gemini 3 Pro Image)** | ~0,12-0,22 € | **candidat principal** : meilleur rendu de texte dans l'image, édition itérative native (« modifie/embellis » est SA force), cohérence entre versions, jusqu'à 4K |
| Flux 1.1 Pro / Kontext (fal.ai/Replicate) | ~0,04-0,06 € | photoréalisme fort, bon rapport ; Kontext pour l'édition |
| gpt-image (qualité haute) | ~0,15-0,19 € | excellent suivi d'instructions |
| Nano Banana (Flash, non-Pro) | ~0,04 € | itérations intermédiaires pas chères |

**Higgsfield** : plateforme créateur (abonnement + crédits), forte en stylisé/
cinématique et en VIDÉO générative. Pas le bon outil pour un pipeline automatisé
serveur (économie de crédits imprévisible, orientation interactive). À garder en
tête pour un futur module vidéo générative, pas pour les posts images.

**MCP** : protocole de branchement, pas un générateur. Dans le pipeline VPS
automatisé, l'orchestrateur appelle les API directement — un wrapper MCP
n'ajouterait qu'une couche. MCP est utile en session interactive, pas ici.

**Stratégie retenue** : itérations en Nano Banana Flash (0,04 €), rendu final en
Pro. Test comparatif Nano Banana Pro vs Flux sur 3 prompts identiques au moment
du build du module.

## Orientation Guillaume (2026-07-18) — répartition des rôles
- **Higgsfield → habillage des VIDÉOS** : visuels génératifs pour enrichir les
  montages (fonds, inserts stylisés, B-roll génératif, intros animées).
- **Nano Banana Pro → PUBLICATIONS** : posts complets texte + contexte + visuel.
- **Pas nécessaire maintenant.** Aucun build image avant les paliers vidéo.
  Périmètre gardé en mémoire pour activation ultérieure sur demande.

Avec itérations (2-4 allers-retours « embellis ») : **~0,15-0,50 € par image
finale**. À 10-15 posts/mois : **2-8 €/mois** d'API. Négligeable dans le forfait.

## Coût de build : 4-6 jours
- Constructeur de prompt (ligne édito + mots clés + charte) : 1 j
- Flux Telegram génération/itération img2img : 1,5-2 j
- Composition code (photo clinique incrustée, texte, logo — via sharp ou
  Remotion Still, PAS par l'IA : le texte et le logo doivent être nets) : 1-1,5 j
- Stockage R2 + intégration orchestrateur : 0,5-1 j

## ⚠️ GARDE-FOU DÉONTOLOGIQUE — non négociable
- **JAMAIS d'image IA présentée comme un résultat clinique réel.** Un
  « avant/après » généré = tromperie du patient, exposition de l'Ordre pour le
  praticien, responsabilité pour MedStream. Interdit structurellement.
- Usage autorisé : illustration, pédagogie, décor, schémas, ambiance cabinet.
- Les photos de cas réels restent des photos réelles, incrustées par code.
- Mention « illustration générée par IA » quand le contexte peut prêter à
  confusion (les plateformes l'exigent de plus en plus).
- Les filtres de sécurité des modèles bloquent souvent le contenu chirurgical
  sanglant → viser le style illustratif/schématique pour l'anatomie, de toute
  façon plus propre pour les réseaux.

## Ordre
Build APRÈS les paliers vidéo — même moteur d'orchestration, réutilisé.
