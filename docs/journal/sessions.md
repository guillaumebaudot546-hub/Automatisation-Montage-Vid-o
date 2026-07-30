# Journal de sessions — notes de clôture

> Une entrée par session, ajoutée AVANT de fermer (cycles-sessions.md).
> L'état courant du code vit dans SESSION-PRD.md ; les décisions dans decisions/.

## 2026-07-29 — Audit et remise à niveau : la gouvernance rattrape la production

**Trou de journal : 19 → 28/07.** Aucune entrée pendant les 11 jours où
13 projets HyperFrames et 30 rendus ont été produits. C'est ce trou qui a permis
à tout le reste de dériver sans être vu.

Constaté (chaque point vérifié par une commande) :
- `src/capsule/` — 14 fichiers, le moteur des 3 capsules livrées — **jamais
  ajouté à git**. Ni suivi, ni ignoré : perdu au premier incident disque.
- `.claude/skills/remotion-best-practices` = **jonction morte** vers
  `Desktop\my-video-IMCP`, dossier supprimé. La doctrine n'était chargée par
  aucun mécanisme depuis le déménagement du projet.
- `npm run lint` **rouge** (6 erreurs), alors que CLAUDE.md interdit d'avancer
  sur rouge.
- `public/music/concerto.mp3` = l'enregistrement Saint-Preux à l'octet près
  (SHA256 identique), suivi par git et poussé sur le remote, utilisé comme
  musique par défaut — alors que la doctrine l'interdit nommément.
- `TeaserLaserErYag` déclarait 1590 frames pour 1860 réelles (9 s d'écart).
- Les 13 compositions HyperFrames portent l'ANCIEN accent beige `#d8c7a8`,
  remplacé par le cyan `#49B6C9` : 46 écarts de charte, jamais signalés.
- HyperFrames absent de toute la gouvernance : 0 occurrence.

Fait :
- `src/capsule/` versionné (commit `50d2456`).
- Saint-Preux retiré du suivi, `.gitignore` passé en fail-closed avec whitelist
  explicite, musique par défaut sur `ambient-bed.wav` synthétisé (`2d1c385`).
- Lint 6 → 0 erreur. Filet sur CapsuleV2 : 14 → 32 tests. Durées dérivées des
  props, plus aucun littéral (`f7c38d0`).
- `check-sizes` étendu à HyperFrames avec son propre régime de seuils et rendu
  bloquant ; `check-charte` et `guard-render` créés ; `npm run check` (`9fd5850`).
- `decisions/014` : HyperFrames acté comme moteur, Remotion en maintenance.
- Doctrine déplacée dans `.claude/skills/`, RÈGLE 4 réécrite, RÈGLE 4bis
  (charte) et RÈGLE 7 (procédure) ajoutées, exception 3ter bornée.
- `baudot.json` : correction du 29/07 ajoutée, `exemplesValides` rempli (4).
- `CLAUDE.md` et `SESSION-PRD.md` remis en accord avec la réalité.

À trancher par Guillaume :
1. Le dépôt GitHub est-il public ? Si oui, purge d'historique à décider.
2. Réharmoniser la palette des 13 compositions (change des rendus livrés) ?
3. Factoriser les 7 teasers (126/144 lignes identiques) et unifier la CLI.

Prochaine étape : réécrire `SPEC-PALIER-1.md` sur HyperFrames, puis implémenter
le plus petit incrément — un aller-retour Telegram avec un montage figé.

## 2026-07-17/18 — Cadrage complet du service cloud + spike + gouvernance
Fait :
- 12 décisions écrites (decisions/001-012) : Telegram, tout-cloud, skill 3 couches,
  boucle auto-critique, overrides NL, crew, pipeline unifié, descriptions, images IA.
- Spike segments exécuté : vestibulaire 6/6 (2 essais), serdat 4/5 — GO confirmé.
  Découverte : piste audio serdat.mov silencieuse (PRD corrigé).
- Gouvernance installée : CLAUDE.md-index, docs/gouvernance/ (5 modules),
  sous-agents segment-spike + relecteur-adversarial, registre decisions/.
- Poussé sur GitHub : commits a4b3fda (gouvernance+spike), f17d7a1 (socle,
  tag socle-gouvernance-v1).
- SPEC-PALIER-1.md rédigé.
Reporté :
- Implémentation palier 1 → session neuve dédiée (voir SPEC-PALIER-1.md).
- Guide WhatsApp périmé à réécrire version Telegram (au fil du palier 1).
- Vérif licence Remotion avant vente (decision 002).
Prochaine étape :
1. Guillaume : créer le bot via @BotFather + mettre les 2 clés dans .env (10 min).
2. Ouvrir une session neuve : « Lis SPEC-PALIER-1.md et implémente l'étape 1 ».
