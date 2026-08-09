# 022 — Toute étape qui compte est une commande, ou elle n'existe pas

**Date** : 09/08/2026
**Statut** : Actif
**Remplace** : rien. **Complète** : 014 (HyperFrames moteur), 017 (capsule depuis
prompt), 020 (le fichier testé est celui qui tourne).

## Le constat

Le 09/08, la vidéo « liseret bleu » a été livrée et jugée bonne. Le socle sur le
VPS était **identique au bit près** au dépôt local : aucune dérive de fichier.

Et pourtant Hermes était incapable de refaire cette vidéo.

Parce que trois étapes indispensables n'existaient dans aucun script :

| Étape | Comment elle a été faite | Reproductible par l'agent |
|---|---|---|
| Mise au format des plans animés (paysage → 1080x1920, fond de charte) | commande `ffmpeg` tapée à la main | non |
| Cadrage `panneau` sur un plan vidéo | découvert par essais successifs | non |
| Voix off | inexistante dans le socle | non |

La synchronisation des fichiers ne dit rien de la reproductibilité du travail.
Un socle à jour dont les étapes clés vivent dans l'historique d'un terminal est
un socle qui ne sert qu'à la personne qui a tapé les commandes.

## La règle

**Une étape qui compte est une commande versionnée, testée, et nommée dans la
doctrine — ou elle n'existe pas.**

Corollaire : quand une intervention manuelle sauve un montage, le travail n'est
pas fini à la livraison. Il est fini quand l'intervention est devenue une
commande.

## Ce qui a été fait

- `scripts/capsule-media.mjs` (+ `npm run capsule:media`) — met les plans vidéo
  au format de sortie, mesure la voix, réécrit le contrat. Idempotent.
- `scripts/charte.mjs` — lecture de palette partagée par le générateur et le
  préparateur de médias. La charte reste à source unique dans `src/theme/`.
- Piste voix dans le socle, avec atténuation automatique de la musique
  (0,68 → 0,10) — la préférence « lit discret sous la voix » de la fiche
  praticien devient un comportement, plus une intention.
- Contrôle de largeur des titres **en pixels** et non en caractères :
  « Microchirurgie » fait 14 caractères, passait le plafond de 62, et débordait
  quand même. Le contrôle mesurait la mauvaise grandeur.
- Contrôle de cohérence **langue de la voix ↔ langue de l'écran**.
- Sur un plan photo, le sur-titre flottant est supprimé quand la carte porte
  déjà le tag : il disait deux fois le même mot, et le disait à 1,2:1 de
  contraste sur l'image. Mesuré par `hyperframes check`, pas estimé.

## Mesure

Sur la même vidéo, avant / après :

| | avant | après |
|---|---|---|
| Problèmes de mise en page | 14 | 0 |
| Contraste WCAG AA | 4 échecs (1,15:1) | 24/24 |
| Erreurs de lint | 1 (pistes en conflit) | 0 |
| Étapes manuelles non scriptées | 3 | 0 |

## Ce que ça change pour la suite

Le critère « c'est déployé » devient : *un agent parti d'un dossier vide et de la
doctrine refait la vidéo sans intervention humaine*. La parité des empreintes ne
suffit pas à le prouver — seul le fait de dérouler la chaîne le prouve.
