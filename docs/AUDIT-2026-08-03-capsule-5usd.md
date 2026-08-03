# Audit — capsule livrée en 15 min pour ~5 $

**Date :** 2026-08-03 · **Source :** `~/.hermes/logs/agent.log` sur le VPS
**Objet :** première capsule générée depuis un prompt via la chaîne `capsule-prompt`

> ⚠️ **Ce n'est pas une mesure, c'est une attribution.** Hermes ne journalise
> aucun décompte de jetons — contrairement au relevé du 30/07 (6,91 $), où la
> décomposition venait de l'API. Les causes ci-dessous sont déduites de
> grandeurs observables (nombre d'appels, taille d'historique, nature des
> outils). Les proportions sont raisonnées, pas mesurées.

## Ce qui a bien fonctionné

Le contrat a tenu. Les trois `write_file` de la session font **280, 287 et
279 caractères**, les `patch` 749 à 1 102. C'est du `capsule.json`, **pas du
HTML**. La RÈGLE A a été respectée, et le poste qui avait coûté 4,35 M de jetons
le 30/07 n'est pas réapparu.

Le volume total renvoyé par TOUS les outils de la session : **~54 Ko**.
Ce n'est pas là qu'est passé l'argent.

## Les trois causes réelles, par impact

### 1. La session n'a jamais été refermée — cause dominante

| | |
|---|---|
| Session | `20260730_203305_a54410a5`, ouverte le **30 juillet** |
| Historique à l'arrivée de la demande | **246 messages** |
| Historique en fin de session | **349 messages** |
| Appels au modèle sur la journée | **120** |
| Tours de conversation | 6 |

Chacun des 120 appels renvoie l'historique complet. Le cache de préfixe amortit
les relectures, mais un historique qui **grossit** force une réécriture de cache
à chaque ajout — et l'écriture coûte 2× l'entrée au TTL d'1 h configuré.

C'est le même mécanisme que le 30/07, à ceci près qu'il ne vient plus du fichier
mais de la conversation.

### 2. Dix-sept analyses d'images

`vision_analyze` a été appelé **17 fois**. Les retours cumulent 68 caractères :
côté sortie, c'est négligeable. Côté **entrée**, chaque appel envoie une image au
modèle, et cette image reste dans l'historique pour tous les appels suivants.

L'agent regardait son propre rendu. Or ses contrôles sont objectifs et gratuits :
`portail:capsule` juge la lisibilité et le débordement, `hyperframes check` juge
le contraste (WCAG AA), le layout et le mouvement, `ffprobe` juge le format.
Aucune image n'apporte d'information que ces trois-là ne donnent déjà.

### 3. Réglages qui autorisaient la dérive

| Réglage | Valeur trouvée | Effet |
|---|---|---|
| `compression.idle_compact_after_seconds` | **0** | Un fil dormant depuis le 30/07 n'était jamais compacté |
| `skills.creation_nudge_interval` | **15** | Le curateur relit tout l'historique pour « mettre à jour la bibliothèque de skills » — 1 passage ce jour-là, 3 les jours précédents. Zéro vidéo produite. |
| `memory.nudge_interval` | 10 | Même logique, plus fréquent encore |
| `delegation.max_iterations` | 50 | Plafond de boucle très haut |
| `code_execution.max_tool_calls` | 50 | Idem |

## Correctifs appliqués le 03/08

### Configuration VPS (`~/.hermes/config.yaml`, sauvegarde `config.yaml.bak.2026-08-03-2026`)

| Réglage | Avant | Après | Pourquoi |
|---|---|---|---|
| `idle_compact_after_seconds` | 0 | **1800** | Un fil inactif 30 min est compacté avant la reprise |
| `creation_nudge_interval` | 15 | **999** | Le curateur ne relit plus l'historique de sa propre initiative |
| `memory.nudge_interval` | 10 | **40** | Idem, moins souvent |
| `delegation.max_iterations` | 50 | **12** | Une capsule tient en ~15 appels ; 50 autorise une boucle |
| `code_execution.max_tool_calls` | 50 | **25** | Idem |

YAML revalidé après édition.

### Doctrine (`capsule-prompt` RÈGLE E + `AGENTS.md`)

- **Une vidéo = une session neuve.** Au-delà de ~40 messages ou d'un changement
  de sujet, l'agent demande l'ouverture d'un nouveau fil avant de commencer.
- **Interdiction d'analyser son propre rendu à l'image.** Une seule exception :
  le praticien signale un défaut visuel que les contrôles ne voient pas — et
  alors une image, pas dix-sept.
- **Plafond d'appels.** Au-delà de 25, l'agent s'arrête et remonte.

## Ce qui reste hors de portée d'un correctif de skill

Aucune règle écrite dans une skill ne peut refermer une session de 349 messages.
C'est de la **discipline d'exploitation**, et elle est désormais écrite dans
`AGENTS.md` — mais c'est Guillaume qui ouvre les fils.

**À faire avant le prochain test :** `/clear` (ou l'équivalent Telegram) et une
demande unique dans un fil vide.

## Ce qu'il faudrait pour mesurer au lieu de déduire

Hermes ne journalise pas les jetons. Tant que ce sera le cas, tout audit restera
une attribution raisonnée. Deux options :

1. Activer un journal d'usage côté Hermes s'il existe une option.
2. Lire la consommation par jour sur la console Anthropic et la corréler aux
   sessions — grossier, mais chiffré.

Sans l'un des deux, on ne saura pas si ces correctifs ont divisé le coût par 2
ou par 10.
