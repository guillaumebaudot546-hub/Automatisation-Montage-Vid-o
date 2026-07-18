# Vérification — la boucle qui remplace « parfait »

> Index : ce fichier définit quand une tâche est réellement terminée, et comment Claude Code doit se corriger seul avant de te la rendre. À lire avant de déclarer une tâche finie, ou avant de lancer un travail long/autonome.

## Pourquoi pas « en boucle jusqu'à la perfection »
« Parfait » n'est pas un état vérifiable par un modèle : il n'existe pas d'oracle absolu à interroger. Une boucle sans condition mesurable échoue de deux façons : soit elle tourne en consommant des tokens sans converger, soit l'agent finit par se convaincre — et te convaincre — que c'est bon sans preuve. La solution : remplacer « parfait » par une condition mesurable. (Ce principe est déjà appliqué au montage vidéo : voir `decisions/006-boucle-auto-critique.md` — boucle bornée K=3, portails doctrine + juge, le goût restant au praticien.)

## La Definition of Done (commandes réelles du projet)
Une tâche n'est déclarée terminée que si :
- [ ] Les tests concernés passent — `npm run test`
- [ ] Lint / sens des dépendances sans erreur — `npm run lint`
- [ ] Aucun fichier au-dessus de 300 lignes — `npm run check:sizes`
- [ ] Aucun TODO / FIXME / stub laissé là où une implémentation réelle était demandée
- [ ] Le diff ne touche que les fichiers nécessaires à la tâche
- [ ] La preuve est montrée (sortie de commande) — jamais seulement affirmée
- [ ] Pour un rendu vidéo : still de contrôle avant rendu complet (`npx remotion still <Comp> out.png --frame=N`)

## Les 4 niveaux de boucle, du plus léger au plus strict

**Niveau 1 — dans un seul message.** « Implémente X, lance les tests, corrige jusqu'à ce qu'ils passent. » Fonctionne partout, sans rien configurer.

**Niveau 2 — `/goal`, le mode autonome natif.** Claude Code continue de travailler, tour après tour, jusqu'à ce qu'un modèle évaluateur séparé juge la condition remplie.
- Ne fonctionne que si la condition est prouvable dans la conversation : l'évaluateur ne lance rien lui-même, il ne lit que ce que Claude Code a déjà affiché.
- Gabarit : `/goal [état mesurable] et [preuve attendue — ex. npm run test sort en code 0] et [garde-fou — ex. aucun fichier hors du domaine concerné n'est modifié] ; arrête-toi après 15 tours si la condition n'est pas atteinte`
- Une condition floue (« que le code soit production-ready ») échoue presque toujours. Toujours : état mesurable + commande qui le prouve + limite de tours.

**Niveau 3 — le hook Stop, verrou déterministe.** Pour un travail long : un hook Stop relance la commande de vérification et empêche de rendre la main tant qu'elle échoue. Contrairement à `/goal` (jugé par un modèle), un hook exécute un vrai script. Garde-fou intégré : au bout de 8 blocages consécutifs, la main est rendue quand même.
- Mise en place : demander à Claude Code d'écrire le hook et de vérifier la syntaxe actuelle via `/hooks`.

**Niveau 4 — le second regard, obligatoire avant toute tâche à enjeu.** Des tests qui passent prouvent que le code fait ce qu'il fait — pas qu'il fait ce qui était demandé.
- Léger : `/code-review` (revue dans un sous-agent à contexte neuf).
- Ciblé : le sous-agent `relecteur-adversarial` (voir `sous-agents.md`) — compare le résultat à la demande d'origine, ne signale que ce qui casse la correction ou sort du périmètre.
- Renforcé (enjeu élevé) : deux sessions séparées, l'une qui code, l'autre qui relit sans connaître le raisonnement de la première.

## Pièges connus
- **Session fourre-tout** : un sujet, puis un autre sans rapport → `/clear` entre deux sujets non liés.
- **Corriger en boucle sur le même point** : au-delà de 2 corrections ratées, le contexte est pollué → `/clear` et reformule avec ce que tu as appris.
- **CLAUDE.md trop long** : passé un certain volume, les règles se noient. Si une règle est ignorée de façon répétée, la cause probable est qu'elle est perdue dans trop de texte.
- **Faire confiance sans vérifier** : un résultat plausible n'est pas un résultat vérifié.
- **Exploration sans limite** : « regarde tout le projet » fait exploser le contexte — cadre la recherche, ou délègue-la à un sous-agent.
