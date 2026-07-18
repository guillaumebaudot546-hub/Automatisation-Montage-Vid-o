# 003 — Skill de montage en 3 couches

**Date :** 2026-07-17 · **Statut :** Actif

## Contexte
Le skill doit être reproductible (doctrine solide) ET évolutif (s'adapter aux
demandes du praticien). Les deux exigences semblent s'opposer.

## Décision
Trois couches séparées, toutes versionnées en git.

| Couche | Où | Bouge quand |
|--------|-----|-------------|
| **Doctrine** — `SKILL.md` | git | Changement de format. Rarement. |
| **Préférences praticien** — 1 JSON/client | git | Le praticien demande un ajustement |
| **Exemples few-shot** — segments validés | git | Chaque vidéo validée en ajoute un |

## Pourquoi
- Réécrire le SKILL.md à chaque demande détruirait la reproductibilité cherchée.
- La doctrine (le *comment* : transitions, durées, chrome, CTA) est du code stable.
- Les préférences (le *quoi* : « 6 segments pas 5 », « pas de flash ») évoluent.
- Le versionnement git donne gratuitement l'audit réclamé par le mémo : chaque
  changement de préférence est un commit daté. Mieux qu'un journal propriétaire
  pour un client médical.

## Boucle adaptative
IA propose timestamps → praticien corrige via bouton [Modifier] → **le delta
proposition/correction est le signal** → écrit dans préférences + exemples → la
vidéo suivante en tient compte. Aucun effort supplémentaire demandé au praticien.

## Lien
Voir [005](005-ia-decide-quand-code-decide-comment.md) pour le découpage IA/code.
