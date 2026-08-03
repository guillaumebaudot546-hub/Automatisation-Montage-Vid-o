# Journal de sessions — notes de clôture

> Une entrée par session, ajoutée AVANT de fermer (cycles-sessions.md).
> L'état courant du code vit dans SESSION-PRD.md ; les décisions dans decisions/.

## 2026-08-03 (fin) — Audit des 5 $ : ce n'était pas le HTML

Capsule livrée en 15 min pour ~5 $. Audit complet en
`docs/AUDIT-2026-08-03-capsule-5usd.md`.

**Mon hypothèse était fausse.** Je cherchais du HTML écrit à la main. Les trois
écritures de la session font 280, 287 et 279 caractères — du `capsule.json`. Le
contrat a tenu, la RÈGLE A a été respectée. Tous les retours d'outils cumulés
font 54 Ko : l'argent n'est pas passé là.

**Les vraies causes**, déduites du log (Hermes ne journalise aucun jeton — c'est
une attribution raisonnée, pas une mesure comme le 30/07) :

1. **La session n'a jamais été refermée.** Ouverte le 30/07, **246 messages** à
   l'arrivée de la demande, **349** à la fin, renvoyés à chacun des **120 appels
   au modèle** pour 6 tours de conversation.
2. **17 `vision_analyze`.** L'agent regardait son propre rendu, alors que
   `portail:capsule`, `hyperframes check` et `ffprobe` donnent la même
   information objectivement et gratuitement.
3. **Réglages permissifs** : `idle_compact_after_seconds: 0` (un fil dormant
   depuis 4 jours jamais compacté), curateur de skills toutes les 15 tours qui
   relit tout l'historique, plafonds de boucle à 50.

**Correctifs** : config VPS (5 réglages, sauvegarde horodatée, YAML revalidé) +
RÈGLE E dans `capsule-prompt` + section coût dans `AGENTS.md`.

### Régression que j'ai introduite et corrigée

Ma substitution `BAUDOT` → `CHARTE` du renommage visait l'export TypeScript.
Elle a aussi frappé le **nom du praticien en majuscules** dans trois fichiers,
dont `AGENTS.md` déjà déployé sur le VPS : « Dr Fabrice CHARTE ». Corrigé en
restant sur l'anonymisation demandée (`praticien client-01`, `Client 01`), pas
en restaurant le nom. `npm run check` vert après correction.

C'est exactement le mode de défaillance du `sed` du 30/07 : une substitution
large sans vérification de ses effets de bord.

## 2026-08-03 (suite) — Le premier test Telegram échoue : la skill était invisible

Guillaume teste depuis Telegram. Hermes répond « sans voix off, il faut quand
même une source visuelle réelle » et part chercher du B-roll en `*.mp4`.
**Il raisonne en `montage-imcp`.** L'aiguillage n'a pas déclenché.

### La cause, trouvée dans agent.log

Une ligne du 31/07 :

> `Description is 192 chars — new skills must fit the 60-char system-prompt`
> `budget (one sentence, trigger first, ends with a period). The skill index`
> `truncates longer descriptions`

**Hermes plafonne les descriptions de skill à 60 caractères.** La mienne en
faisait **298**. L'index que voit le routeur la tronquait : le déclencheur
« depuis un prompt, sans rush » n'y figurait pas. La skill était installée et
inatteignable.

`ffmpeg-image-slideshow`, créée par le curateur le 31/07, fait exactement
60 caractères — après deux rejets pour la même raison. Le garde-fou existait,
je ne l'avais pas lu.

Corrigé : `Vidéo depuis un texte ou un prompt, sans rush ni caméra.` (56 car.).
La doctrine détaillée remonte dans le corps du fichier, où elle ne coûte rien.

### Seconde cause, à ne pas confondre

Le test tournait dans `session=20260730_203305_a54410a5` — une session ouverte
le **30/07**, 196+ messages, dont tout le cadrage « montage du laser Er-YAG pour
le Dr Baudot ». Même avec une description correcte, un fil aussi chargé ramène
l'agent vers ce qu'il faisait déjà. La règle est écrite dans CLAUDE.md :
**une session, un objectif.**

### Reste ouvert

- `montage-imcp` a une description de 350 caractères, également tronquée. Elle
  fonctionne parce que sa troncature commence par « Doctrine de montage vidéo »,
  ce qui capte toutes les demandes vidéo — y compris celles qui ne sont pas des
  montages. À raccourcir, mais c'est une skill utilisateur : décision de
  Guillaume, pas correction unilatérale.
- Le test bout-en-bout reste à refaire dans une session neuve.

## 2026-08-03 — Déploiement sur le VPS

Hermes sait désormais générer une capsule depuis un prompt. Déployé sur
`HermesMedStreamDCA` (78.47.14.178), sauvegarde préalable dans
`~/sauvegardes/2026-08-03-1147`.

### Trois blocages trouvés à l'inspection, avant de toucher à quoi que ce soit

1. **`~/imcp` n'est pas un dépôt git** — copie manuelle, déploiement par `scp`.
2. **`src/theme/` n'existait pas du tout sur le VPS.** `capsule-build` et
   `portail-capsule` le lisent : ils auraient échoué au premier appel. Créé
   avec `client-01.ts`.
3. **Le VPS avait encore `praticiens/baudot.json`.** Les scripts renommés
   cherchent `client-01.json` : déployer sans renommer cassait le montage
   existant. Renommé dans le même geste.

Constat en passant : l'`AGENTS.md` du VPS datait du **31/07** et ne contenait
aucune trace du verrou. Tout le travail du 01/08 n'avait jamais été déployé.

### Déployé

5 scripts (`capsule-build`, `portail-capsule`, `guard-portail`,
`portail-doctrine`, `guard-render`), `src/theme/client-01.ts`,
`_socle/capsule.template.html` + les 4 polices, la skill `capsule-prompt`
dans `~/.hermes/skills/video/`, et `AGENTS.md` aux deux emplacements
(empreintes identiques vérifiées).

**RÈGLE 2 réécrite en aiguillage** : rush → `montage-imcp` + `plan.json` ;
prompt → `capsule-prompt` + `capsule.json`. Sans ça, la skill était installée
mais Hermes n'avait aucune raison de la charger.

### Vérifié SUR LE VPS, pas en local

- Portail capsule : 0 violation, reçu écrit.
- Builder : `index.html` de 11 451 octets, charte lue depuis `src/theme/`.
- Verrou : plan modifié après validation → **rendu bloqué (2)** ; revalidation
  → **0** ; rendu autorisé → **0**.
- `guard-render` : sonde multiplateforme confirmée. **Le garde-fou « jamais
  deux rendus en parallèle » protège enfin quelque chose là où la production
  tourne** — il ne sondait que via `powershell.exe`.
- Montage rush intact après renommage.

### Reste ouvert

- Aucun test bout-en-bout depuis Telegram : la chaîne est vérifiée en ligne de
  commande sur le VPS, pas via une vraie conversation avec le praticien.
- Le dépôt GitHub est **public** et les noms restent dans les contenus
  (~97 occurrences) et dans tout l'historique. Le renommage ne couvre que les
  identifiants techniques.

## 2026-08-02 (fin) — La génération depuis un prompt devient une doctrine

Demande de Guillaume : que ce type de vidéo soit implémenté dans les skills
d'Hermes — générer depuis un prompt, via HyperFrames, avec la fiabilité que la
doctrine garantit pour les montages. Écrit en `decisions/017`.

**Le constat de départ, inconfortable :** la vidéo FBE est partie sans le
moindre garde-fou. `portail-doctrine.mjs` juge des spans et une couverture de
sous-titres issus d'une transcription — sans rush, rien à juger. Et
`guard-portail.mjs`, corrigé la veille, laisse passer tout rendu sans
`plan.json`. Réutiliser le portail existant était impossible : il fallait un
second portail.

**Livré :** contrat `capsule.json`, socle `_socle/capsule.template.html`,
builder `capsule-build.mjs` (8 blocs, balisage restreint `**mot**`, charte lue
dans `src/theme/`), portail `portail-capsule.mjs`, skill `capsule-prompt`,
`guard-portail` étendu aux deux contrats, `capsule:check` dans `npm run check`.

**Ce que le portail a immédiatement trouvé, sur sa première utilisation :**
la piste `Clinical_Grace.mp3` est rejetée faute de licence, et les durées de la
v2 livrée (123 s) mettent les scènes 1, 3 et 9 entre 3,6 et 4,2 mots/s —
**la v2 était trop dense à lire.** Corrigé en coupant du texte plutôt qu'en
allongeant : 126 s, une seule scène encore signalée.

**Bug corrigé :** `capsule-build` et `portail-capsule` résolvaient `src/theme/`
et le socle relativement au dossier de travail. Hermes lance ses commandes
depuis le dossier de la vidéo — les deux échouaient. Racine déduite de
l'emplacement du script.

**Vérifications :** chaîne complète testée depuis le dossier de la vidéo
(portail 3 → rendu bloqué 2 ; avec licence, portail 0 → reçu écrit) ;
`hyperframes check` sur la composition générée à 0 erreur et 50/50 contrastes ;
les 6 garde-fous du dépôt verts.

## 2026-08-02 (suite) — Lit musical ajouté, et un trou dans la politique audio

Guillaume fournit `Clinical_Grace.mp3` et demande de l'ajouter à la vidéo FBE.

### Le fichier

145,2 s · 192 kbps · 3,5 Mo · SHA256 `14c701a5…7302da`.
**Aucune métadonnée** — ni artiste, ni titre, ni source. Nom d'origine conservé
dans le projet : renommer masque la provenance, et c'est exactement ce qui a
laissé passer le Saint-Preux (decision 014).

**Licence non fournie à ce jour.** La règle du dépôt est explicite : « toute
piste autre que le défaut exige une preuve de licence ». Le fichier est intégré
au rendu local mais **reste hors dépôt**.

### La faille trouvée

La politique fail-closed du `.gitignore` ne couvrait que `musique/`,
`public/music/*` et `public/**/*.mp3`. La section médias de
`imcp-hyperframes/` ignore `.mp4`, `.mov` et `.wav` — **mais pas `.mp3`**.
Vérifié : `git check-ignore` laissait passer
`imcp-hyperframes/videos/fbe-presentation/Clinical_Grace.mp3`.

C'est la même classe de faille que le renommage Saint-Preux : un filtre qui a
un trou ne protège de rien. Corrigé — tout audio est désormais ignoré où qu'il
soit (`*.mp3 *.m4a *.aac *.flac *.ogg *.opus *.wav *.aiff`), la whitelist des
5 productions libres de droits vérifiée intacte, et aucun fichier déjà suivi
n'a été éjecté.

### Le montage audio

`<audio>` séparé, `data-volume 0.68`, fondu d'ouverture 2,5 s et sortie 5 s
animés sur la timeline (`volume`), pas via `data-volume` — le runtime sonde ces
keyframes et les applique à l'identique en preview et au rendu.

**Vérifié sur le MP4 final**, pas sur le code : flux AAC 48 kHz stéréo, 123 s.
Profil mesuré à `volumedetect` — 0-1 s : −29,4 dB · 4-6 s : −22,4 dB ·
61-63 s : −19,6 dB · 116-117 s : −15,3 dB · **122-123 s : −52,3 dB**. Les deux
fondus sont dans le fichier.

### À trancher par Guillaume

1. **Licence de `Clinical_Grace.mp3`** — sans preuve, la piste ne peut pas
   partir chez un praticien ni être poussée sur GitHub.
2. **La charte utilisée est celle du Dr Baudot** (cyan `#49B6C9` « imposé par le
   client ») sur une vidéo destinée au **Dr Robert Fromental**. `check-charte`
   est vert, mais c'est un problème de fond, pas de code.

## 2026-08-02 — Vidéo FBE générée en session (HyperFrames, sans rush)

Demande de Guillaume : générer la vidéo de présentation du FBE dans la session,
100 % IA, via HyperFrames. Périmètre du palier 1 explicitement outrepassé par
lui après que la contrainte a été signalée — c'est sa décision.

**Livré :** `imcp-hyperframes/videos/fbe-presentation/` — 10 scènes, 3 min 02,
1920×1080, 30 fps, 5 460 frames, 6,3 Mo, rendu en 2 min 26. Composition de
287 lignes (plafond 700).

**Nature réelle du livrable — à ne pas surestimer.** Ce n'est pas la vidéo du
storyboard : c'est du **motion design typographique muet**. Il manque la voix
off (workspace Higgsfield à court de crédits, et Guillaume a dit qu'elle
n'était pas obligatoire) et toutes les 3D des scènes 2, 3, 6, 7 et 9
(module images IA, decision 011, palier 2-3, non construit). Le texte du
storyboard a été condensé pour être lisible à l'écran, pas récité.

**Doctrine appliquée :** RÈGLE 2 (typographie plutôt qu'images brutes — c'est
le point fort ici), RÈGLE 3 (16:9, cible YouTube/site), RÈGLE 4bis (charte
depuis `src/theme/client-01.ts`). La RÈGLE 0 est satisfaite par construction :
sans rush, il n'y a pas de voix à hacher.

**Vérifications :** `hyperframes check` → 0 erreur, 48/48 contrôles de contraste
WCAG AA (un `#foot` à 3,38:1 corrigé en couleur `slate` pleine). `check-sizes`,
`check-charte`, `fonts:check`, `socle:check` → verts. Frames extraites du MP4
final et inspectées, pas seulement les snapshots.

**Preuve pour la decision 016 :** le rendu affiche « Fonts: 4 loaded » et les
frames du MP4 montrent Cormorant, Manrope et JetBrains Mono correctement
appliquées. C'est la vérification visuelle que l'extraction des polices exigeait.

### Bug corrigé : le verrou du portail bloquait tout

`guard-portail.mjs`, écrit la veille, refusait TOUT rendu sans `plan.json` — il
aurait bloqué les 13 compositions livrées, écrites à la main. Périmètre corrigé :
**s'il existe un `plan.json`, il doit être validé ; sinon le rendu passe.** Le
portail valide un plan de montage dérivé d'un rush ; une composition sans rush
n'a rien à valider. Retesté : composition sans plan → 0, montage avec plan non
validé → 2.

### Reste ouvert

- Avertissement `timeline_track_too_dense` (10 éléments sur la piste 2) laissé
  tel quel. HyperFrames recommande des sous-compositions ; c'est aussi le remède
  de `check-sizes`. À faire si la composition grossit.
- Le workspace Higgsfield est à court de crédits — aucune voix off générable.

## 2026-08-01 — Coût par vidéo : sortir la plomberie, garder le raisonnement

Question de Guillaume : réduire largement le coût par vidéo **sans atténuer la
qualité de la réflexion ni celle du montage**. Décision écrite en
`decisions/016-cout-par-video.md`, feuille de route en `docs/COUT-PAR-VIDEO.md`.

### Le diagnostic

Décomposition du relevé du 30/07 (6,91 $) : écriture cache 3,72 $ (54 %),
relecture 1,85 $ (27 %), sortie 1,34 $ (19 %). Soit 7 à 10 M de jetons,
~120 000 jetons de contexte par appel. **Le coût n'est pas ce que le modèle
écrit, c'est ce qui s'accumule et se refait relire.**

Le plus gros contributeur mesuré : **144 580 des 168 232 octets de chaque
composition étaient de la police en base64** (86 %). Une lecture du fichier
injectait ~42 000 jetons, relus à chaque appel suivant — ~0,88 $ par passage.

Corollaire inconfortable : `proactive_prune_tokens: 120000` et la compression à
0,4, posés le 31/07, **supprimaient du raisonnement pour faire de la place à du
base64**. La plomberie ne coûtait pas que de l'argent, elle mangeait la réflexion.

### Ce qui a été fait

- **Polices sorties du HTML** (`scripts/fonts-extract.mjs`, idempotent).
  14 fichiers, **2 020 438 octets retirés**, −81 % à −93 % par fichier.
- **`socle-assets.mjs` gère les dossiers d'assets** et sème ceux que le HTML
  référence, au lieu d'attendre qu'ils existent.
- **Portail transformé en verrou** (`scripts/guard-portail.mjs`, hook
  `PreToolUse`). Reçu empreinté SHA-256 ; aucun rendu sans reçu couvrant cette
  version du plan.
- **`guard-render.mjs` réparé.** Il ne sondait que via `powershell.exe` : sur le
  VPS Linux, le `catch` renvoyait `[]` et le garde-fou « jamais deux rendus en
  parallèle » **ne protégeait rien là où la production tourne**. Sonde `ps` hors
  Windows.

### Sur le renversement du choix du 31/07

Le base64 avait été choisi la veille, délibérément, pour deux raisons écrites :
« un HTML mono-fichier » et « aucun chemin relatif à casser entre local et VPS ».
Ce choix a été renversé **en gardant l'auto-hébergement**, qui était le fond de
la décision : aucun accès réseau, aucune police système. Seul le transport change.

La contrepartie a été payée. Le base64 achetait l'immunité au défaut invisible
du 31/07 — police absente, fallback sans-serif, aucune erreur. En reprenant ces
142 Ko, `npm run fonts:check` **bloque désormais** si une référence `./fonts/`
ne résout pas. Le défaut est devenu bruyant. Vérifié en cassant volontairement
une référence : exit 0 → 2 → 0 après `socle:sync`.

Argument qui a levé le doute sur les chemins relatifs : `source.mp4`,
`logo-mark.png`, `intro-imcp.mp4` sont **déjà** référencés en relatif par les
compositions qui rendent sur le VPS. Le renderer les résout ; le seul risque
réel était d'oublier la copie, et c'est précisément ce que `socle:sync` gère.

### Vérifications

- Round-trip **bit-pour-bit contre `HEAD`** : 4/4 polices identiques. Les octets
  que Chromium reçoit n'ont pas changé, seul leur transport.
- Signatures `wOF2` sur les 4 fichiers ; 0 référence cassée sur 13 compositions.
- `teasers:check` → **0 dérive** : le socle regénère toujours l'octet exact.
- `check-sizes`, `check-charte`, `socle:check`, `fonts:check` → verts.
- Chaîne du verrou testée : plan valide → portail 0 → rendu autorisé ;
  plan fautif → portail 3 (RÈGLE 0) → rendu bloqué 2.

**Non vérifié, et ça reste à faire par Guillaume :** un `npx hyperframes render`
suivi d'un **contrôle visuel du `.mp4`**. La doctrine l'exige et aucune de mes
vérifications ne le remplace.

### À trancher

`Proposition_Studio_Contenu_IA_Medstream.pdf` §7 affirme que « quatre cinquièmes
de la facture tiennent au transcript ». `imcp3181.srt` fait 1 573 octets — c'est
faux, et la promesse commerciale qui en découle (« un rush deux fois plus long
coûte deux fois plus cher ») ne tient pas. À corriger avant envoi au praticien.

Prochaine étape : redéployer `AGENTS-vps.md` sur le VPS, puis l'étape 2
(builder `plan.json → index.html`) — qui demande une décision de design sur le
livrable, à prendre avec Guillaume sur un rendu de référence.

## 2026-07-31 (suite) — Les polices n'ont JAMAIS été chargées par HyperFrames

Question de Guillaume : pourquoi le design, les polices, la charte ne se
retrouvent-ils pas dans les montages du VPS, alors que ses montages faits en
local via Claude étaient conformes ?

**Ce n'était pas un problème de transfert vers le VPS. Le défaut était dans le
projet local depuis le début.**

### Le diagnostic, fichier par fichier

1. `src/theme/client-01.ts` est bien la source de vérité : cyan `#49B6C9`, fond
   navy `#060D18`, display **Cormorant**, corps **Manrope**.
2. **Remotion (`src/`) charge vraiment ces polices** — `src/index.css` contient
   un `@import` Google Fonts. D'où des montages locaux conformes : le PC a
   internet, la police se télécharge.
3. **HyperFrames n'a JAMAIS chargé aucune police.** Aucun `@font-face`, aucun
   `<link>`, aucun fichier `.woff`/`.ttf` dans tout `imcp-hyperframes/`. Les
   compositions écrivaient `font-family` et espéraient que le système fournisse.
4. Pire : elles ne demandaient même pas les bonnes polices — **`EB Garamond`**
   au lieu de Cormorant, **`Roboto`** au lieu de Manrope, sur **13 projets**.
5. Sur le VPS, `fc-list` ne remonte que DejaVu / FreeSans / Noto CJK : **aucune**
   police de la doctrine. Le rendu retombait donc sur une police de secours
   générique, **silencieusement, sans la moindre erreur**.

C'est la définition d'un défaut invisible : rien n'échoue, le rendu sort, et
seul l'œil du praticien voit que ce n'est pas sa charte.

### Correctif : auto-hébergement en base64

Choix de Guillaume : auto-héberger plutôt qu'installer les polices sur le VPS.
Meilleure décision — elle rend le rendu **indépendant du réseau et de la machine**.

- Cormorant (normal + italique), Manrope, JetBrains Mono récupérées en `.woff2`
  (sous-ensemble latin + latin-ext, polices variables : 4 fichiers couvrent
  toutes les graisses), licence OFL — auto-hébergement légitime.
- Embarquées en **base64 dans le `<style>`** de chaque composition : cohérent
  avec le principe « un HTML mono-fichier » du projet, et aucun chemin relatif
  à casser entre local et VPS. Coût : ~142 Ko par fichier.
- `EB Garamond` → `Cormorant`, `Roboto` → `Manrope` sur les 14 fichiers
  (13 projets + le socle). JetBrains Mono conservée : le nom était déjà correct,
  seul le `@font-face` manquait.

### Vérifications

- **14/14 fichiers modifiés**, plus aucune trace de `EB Garamond` / `Roboto`.
- **14/14 rendus refaits** (12 en local, `capsule-3204` en local,
  `teaser-05-formation` sur le VPS) — **zéro erreur**.
- `capsule-3204` : durée **66,3 s inchangée** — l'exclusion de l'hallucination
  Whisper documentée dans son BRIEF tient toujours.
- `npm run check:charte` → **vert**, 13 compositions conformes.
- `npm run check:sizes` → vert (10 fichiers en orange, rien de bloquant).
- Comparaison visuelle à 20 s sur `teaser-05-formation` : le titre passe d'une
  grasse générique à **Cormorant**, les sous-titres de Roboto à **Manrope**.

### Erreur commise en cours de route

En voulant appliquer le correctif au seul `teaser-05-formation` sur le VPS, un
`sed` mal échappé n'a pas restreint la liste de cibles : le script a réinjecté
les `@font-face` dans des fichiers déjà corrigés (doublons) **et** raté sa vraie
cible. Détecté par la vérification qui suivait, corrigé en réécrasant depuis les
versions locales propres, puis refait avec un script `apply_single.js` qui
**refuse d'agir si le fichier est déjà corrigé**. Le garde-fou aurait dû exister
dès le premier script.

## 2026-07-31 — Premier montage réel : post-mortem et correctifs

Première vidéo montée par Hermes depuis Telegram (`teaser-05-formation`).
Résultat jugé mauvais par Guillaume, et **facture de 15 €** là où le spec
annonçait ~1,62 $. Post-mortem sur les données réelles, pas sur des impressions.

### Chronologie établie

| Heure | Événement |
|---|---|
| 22:08 | Rush reçu (41 Mo, 1072×1904, 49 s) — échec `InvalidToken` (chemin de montage, corrigé) |
| 22:19 | Projet créé par Hermes |
| 22:23 | `plan.json` écrit — span unique 12,37→47,37 s, 8 sous-titres, 3 calques |
| 22:28 | Rendu n°1 (76,7 Mo) |
| 22:46 | Rendu n°2 (72,4 Mo) |
| 22:57 | `_FINAL.mp4` |

### Le chiffre

**4 351 765 tokens** pour cette seule session (144 messages, 97 appels d'outils),
contre ~300 000 budgétés. **Facteur 14.**

### Les 5 causes, par impact

1. **Le portail n'a JAMAIS été appelé.** `0` occurrence dans les logs. Trois
   rendus enchaînés sans une seule validation. Cause directe du mauvais résultat
   *et* d'une grande part du coût : un rejet du portail coûte 0 jeton et
   1 seconde, un rendu raté coûte 6 minutes machine plus toute la boucle de
   correction qui suit.
2. **`cache_ttl: 5m` contre des rendus de 6 minutes.** Le cache expirait
   systématiquement *pendant* chaque rendu → tout le contexte refacturé plein
   tarif après chaque rendu. Le levier n°1 annoncé dans le spec était neutralisé
   par ce réglage.
3. **Opus (`claude-opus-4-8`) pour tout**, y compris lire un fichier ou lancer
   une commande.
4. **Contexte cumulatif** : 144 messages, 24 lectures de fichiers injectées
   définitivement.
5. **L'estimation du spec était fausse — à assumer.** Elle chiffrait l'étape de
   *sélection* (~50 images + doctrine + transcription), pas une session agentique
   complète qui écrit 12 Ko de HTML, débogue et rend trois fois.

**Le VPS n'y est pour rien.** Le coût API, ce sont les jetons envoyés à
Anthropic ; le VPS ne joue que sur la vitesse de rendu. Un VPS plus puissant ne
réduirait pas la facture d'un centime.

### Correctifs appliqués

| Correctif | Détail |
|---|---|
| `cache_ttl` 5m → **1h** | Le cache survit désormais aux rendus |
| Modèle principal opus-4-8 → **claude-sonnet-5** | Vérifié actif |
| Auxiliaires (compression, titres, approbation) → **Haiku 4.5** | Tâches triviales |
| Compression déclenchée à **0,4** au lieu de 0,5 | Élagage plus tôt |
| `proactive_prune_tokens` 0 → **120 000** | Les dumps de rendu ne squattent plus le contexte |
| **Rendre sans portail = interdit** | Écrit dans AGENTS.md avec le schéma de boucle et le rappel de l'incident |
| **RÈGLE 5bis format** | Jamais d'étirement ; tableau réseau→cadre (9:16, 16:9, 1:1) ; contrôle `ffprobe` |
| **Roue dentée ⚙️ + liste noire** | Une seule ligne d'avancement modifiée au fil des 6 étapes ; commandes, chemins et traces bannis de la conversation |
| **Recollage de rush multi-parties** | `ffmpeg -f concat -c copy`, sans réencodage ; transcrire le fichier recollé, jamais les morceaux |

Sauvegardes horodatées du `config.yaml` avant chaque modification.

### Sur l'écrasement du format

Vérifié sur le rendu réel : **1080×1920 (9:16), `object-fit: cover`, aucun
étirement**. Le zoom perçu est un effet volontaire léger (`scale 1.02 → 1.07`
sur 35 s) ; la variation de cadrage vient du praticien qui bouge en filmant.
La règle est néanmoins désormais écrite et outillée. À revoir si Guillaume
identifie un instant précis.

### Gros rushes (> 2 Go)

Limite Telegram côté **envoi** : 2 Go (4 Go avec Premium) — pas une limite du
serveur local. Choix de Guillaume : découper avant envoi.
Livré : `Déploiement Hermes IA/decouper-rush.ps1` (découpage sans réencodage,
marge à 1,8 Go) + procédure de recollage côté agent dans `AGENTS.md`.

## 2026-07-30 (suite) — Audit doctrine : deux manques trouvés et comblés

Question de Guillaume : « tous les skills et doctrine déjà implémentés ? »
Vérifié plutôt qu'affirmé — **non**, deux manques réels.

### 1. Les skills HyperFrames n'étaient pas installées dans Hermes

La RÈGLE 7 impose de router par `/hyperframes` et interdit d'écrire une
composition à la main sans passer par lui. L'agent du VPS ne pouvait pas suivre
cette règle. Installées depuis le paquet npm officiel **déjà présent sur le VPS**
(`hyperframes@0.7.77`), pas d'une copie externe : `hyperframes` et
`hyperframes-cli`. Trois skills désormais actives avec `montage-imcp`.

### 2. Les 4 `exemplesValides` pointaient vers des dossiers inexistants

C'est la couche 3 de la doctrine (decision 003) : sans eux l'agent ne connaît que
les échecs à éviter, jamais un modèle de réussite. Le journal du 29/07 notait
« exemplesValides rempli » — mais rempli **dans le JSON**, pas déployé.

Transférés en version légère : `index.html`, `hyperframes.json`, `cues.json`,
`transcript.json`, `BRIEF.md` — **180 Ko au lieu de 646 Mo**. La leçon de montage
est dans la structure, pas dans les rushes sources. Vérifié lisible par
l'utilisateur `guillaume` (le piège de permissions rencontré à l'étape 4).

### Vérification : l'agent s'en sert-il vraiment ?

Question posée sans lui souffler la réponse. Il a cité `index.html` lignes
194-197 avec les attributs exacts (`data-duration="66.3"`), `BRIEF.md` ligne 27,
et `cues.json` (28 phrases, 0,59 → 65,97 s). Contenu impossible à inventer.

### Effet de bord utile : un défaut de mon propre outil

En lisant le BRIEF de capsule-3204, l'agent a exhumé un incident documenté :
Whisper avait halluciné **« Sous-titrage Société Radio-Canada » à 65,97 s**, sur
le silence de fin ; il avait fallu couper à 66,3 s pour l'exclure.

`scripts/transcrire.py` ne filtrait pas ce cas — **il aurait reproduit l'erreur**.
Un cue fantôme est doublement nuisible : il ment sur le contenu, et il offre au
portail une « frontière de phrase » qui n'a jamais été prononcée.

Filtre ajouté (`HALLUCINATIONS`), couvrant les formes connues en français :
mentions de sous-titrage, Amara.org, « merci d'avoir regardé », « abonnez-vous »,
« merci » seul. Les cues écartés sont **affichés**, pas supprimés en silence.

Testé 10 cas : 10/10. Le cas « Merci de votre attention, passons aux sutures »
est conservé — pas de faux positif qui mangerait de la vraie parole.

## 2026-07-30 (suite) — Étape 5, 1er maillon : la transcription

La doctrine impose de transcrire AVANT de monter (RÈGLE 1) et de ne couper
qu'aux frontières de phrases (RÈGLE 0). **Aucun moteur de transcription n'était
installé** : ni `faster_whisper`, ni `openai-whisper`, ni clé OpenAI.

### Choix : transcription locale, non négociable ici

Ce sont des données de santé. Le spec fait localiser le VPS en Allemagne pour le
RGPD ; envoyer l'audio du praticien à une API tierce annulerait ce choix.
`faster-whisper` installé dans le venv Hermes — l'audio ne quitte jamais le VPS.

### Ce que les mesures ont montré (et pourquoi « plus gros modèle » est la
mauvaise réponse)

Test sur un échantillon français contenant le vocabulaire du praticien :

| Modèle | Vitesse | « Baudot » | « Er-Yag » | Segmentation |
|---|---|---|---|---|
| `base` | ×6,9 | Bodo ❌ | RR Biomyag ❌ | correcte |
| `small` | ×2,8 | Bodeau ❌ | herbium yag ~ | correcte |
| `medium` | ×1,1 | Baudot ✅ | HerbiomyaG ❌ | **coupe en plein milieu d'une phrase** ⚠️ |

`medium` est 6× plus lent, rate quand même « Er-Yag », **et dégrade la
segmentation** — donc dégrade précisément ce dont la RÈGLE 0 dépend.

**La vraie solution est l'amorce de vocabulaire** (`initial_prompt`) :
avec elle, `base` ET `small` sortent « Dr Baudot » et « laser erbium YAG »
corrects. Retenu : **`small` + amorce**, ×3 temps réel (cours de 13 min → ~4 min),
et `small` garde le découpage en phrases que `base` fusionne.

### Livré

- `scripts/transcrire.py` — amorce du vocabulaire IMCP, sortie `cues.json` au
  format `{s, e, t}` attendu par le portail, option `--srt`. L'amorce est
  l'endroit où ajouter tout terme mal transcrit signalé par le praticien.
- `/usr/local/bin/transcrire` — wrapper appelable de n'importe où.
- `config.yaml` : `stt.language` **en → fr** (le praticien parle français, la
  config d'origine était en anglais), `stt.local.model` base → small.
- `AGENTS.md` mis à jour : l'agent sait que les frontières viennent de
  `transcrire`, pas de son estimation.

### Chaîne prouvée

Transcription → portail, testé sur les vraies frontières produites :
coupe à 5 s (milieu de phrase) → **rejet code 3** ;
coupe à 9 s (fin de phrase réelle du transcript) → **accepté code 0**.

## 2026-07-30 (suite) — Étape 4 : les gros fichiers (serveur Bot API local)

Limite de fichier passée de **20 Mo à 2 Go**. Sans ça les rushes de 217 Mo
n'entrent pas, et la compression est la cause n°1 de rejet du praticien.

### Procédure suivie

La doc officielle d'Hermes couvre exactement ce cas
(`website/docs/user-guide/messaging/telegram.md`, section « Large Files »). Suivie
à la lettre plutôt qu'improvisée.

| # | Action | Vérification |
|---|---|---|
| 1 | `api_id`/`api_hash` créés par Guillaume sur my.telegram.org, écrits par lui dans `.env` | format validé sans lire les valeurs : ID numérique, hash hex 32 car. |
| 2 | Docker installé (absent jusque-là) | `docker --version` → 29.1.3 |
| 3 | Identifiants isolés dans `tg-bot-api/.env` (2 lignes seulement, 600) | `cut -d= -f1` → les 2 noms attendus |
| 4 | Conteneur `aiogram/telegram-bot-api` en `--local`, bind **127.0.0.1:8081** | `docker ps` → Up |
| 5 | `logOut` de l'API publique (un bot ne vit que sur un serveur à la fois) | `{"ok":true,"result":true}` |
| 6 | `getMe` contre le serveur local | bot `@hermes0montage0ia_bot` confirmé |
| 7 | `platforms.telegram.extra` ajouté au `config.yaml` (sauvegarde datée avant) | `base_url`, `base_file_url`, `local_mode: true` |
| 8 | Gateway redémarré | log : `Using custom Telegram base_url` + `Using Telegram local_mode` + `Connected to Telegram` |

### Deux erreurs commises et corrigées

1. **`user: "1000:1000"` dans le compose** — le conteneur crashait en boucle
   (`chown: Operation not permitted`). Lecture de l'entrypoint : il doit démarrer
   root pour son `chown` initial, puis descend seul en privilège via
   `--username=telegram-bot-api`. Contrainte retirée.
2. **uid 101 du conteneur = compte `messagebus`, groupe `lxd` sur l'hôte.** Le
   dossier de données sortait en `750` → Hermes (`guillaume`) ne pouvait pas
   lire les fichiers reçus. C'est le piège que la doc signale.
   **Refusé d'ajouter `guillaume` au groupe `lxd`** : sur Ubuntu ce groupe donne
   un accès équivalent root via l'API LXD — ce serait ouvrir une faille pour
   régler un souci de permissions. **ACL ciblée** posée à la place
   (`setfacl -m u:guillaume:rX` + ACL par défaut pour l'héritage).
   Lecture réelle du contenu testée, pas seulement `ls` : OK.

### Plafond vérifié à la source

`plugins/platforms/telegram/adapter.py:822` :
`_max_doc_bytes = 2 Go si extra.base_url défini, sinon 20 Mo`. Notre `base_url`
est défini → plafond 2 Go actif. Vérifié dans le code, pas supposé.

### Test réel effectué

Guillaume a écrit au bot depuis son téléphone : message reçu et réponse envoyée
(361 car.) en passant par le serveur local. La chaîne Telegram → serveur local →
Hermes → doctrine → réponse fonctionne bout-en-bout.

**Reste à prouver** : un vrai fichier de 200+ Mo qui transite (la DoD demande ça
explicitement). Non testé faute de rush sous la main.

## 2026-07-30 (suite) — Étape 3 : la doctrine devient une skill Hermes

### Ce qui a été modifié sur le VPS, action par action

| # | Action | Détail | Vérifié par |
|---|---|---|---|
| 1 | `apt install unzip` | Manquait ; bloquait le téléchargement de chrome-headless-shell par HyperFrames | `unzip -v` → UnZip 6.00 |
| 2 | Node déplacé `/root/.hermes/node/` → `/opt/node/` | `/root` est en `700` : aucun compte non-root ne pouvait exécuter `node`. Symlinks `/usr/local/bin/{node,npm,npx}` repointés | `su - guillaume -c 'node -v'` → v22.23.2 |
| 3 | Swap 4 Go créé | `/swapfile`, ajouté à `/etc/fstab` (persiste au reboot) | `free -h` → Swap 4.0Gi |
| 4 | Projet doctrine transféré | `/home/guillaume/imcp/` : `praticiens/client-01.json`, `scripts/portail-doctrine.mjs`, `imcp-hyperframes/_socle/` | `find` → 5 fichiers |
| 5 | Skill installée | `/home/guillaume/.hermes/skills/video/montage-imcp/SKILL.md` | `hermes skills list` → `montage-imcp \| video \| local \| enabled` |
| 6 | `AGENTS.md` déployé | En `/home/guillaume/.hermes/` (cwd du gateway, lu à chaque conversation) ET `/home/guillaume/imcp/`. Source versionnée : `Déploiement Hermes IA/AGENTS-vps.md` | fichiers présents, 3364 o |
| 7 | Wrapper `portail-doctrine` | `/usr/local/bin/portail-doctrine` — le portail lit `praticiens/<client>.json` en RELATIF, donc cassé hors racine projet. Le wrapper fixe le `cd`. Source : `Déploiement Hermes IA/portail-doctrine-wrapper.sh` | testé depuis `/tmp` |

### Preuve que le portail fonctionne sur le VPS

Plan **fautif** (3 spans épars = la faute historique du teaser v1) → **code 3**,
8 rejets nommés : frontières de phrase non respectées (×3), 2 coupures pour un
maximum de 1, cuts secs sans fondu (×2), format 16:9 pour Instagram Reels,
sous-titres couvrant 17 % de la voix.

Plan **conforme** (une prise continue, 9:16, sous-titres complets) → **code 0**,
aucune violation. Le portail discrimine ; il ne rejette pas tout.

### Choix de conception retenus

- **Pas de duplication de `baudot.json`.** La règle projet « jamais en double »
  s'applique : un seul exemplaire en `/home/guillaume/imcp/praticiens/`, là où le
  portail le lit. `AGENTS.md` pointe dessus au lieu d'en recopier le contenu.
- **`AGENTS.md` est un pointeur + les règles non négociables**, pas une copie de
  la doctrine — celle-ci vit dans la skill, chargée à la demande. Recopier
  aurait garanti la divergence (c'est exactement ce qui était arrivé à
  l'ancien `AGENTS.md` du projet, cf. son propre contenu).
- **Le portail n'a aucune dépendance externe** (`node:fs`, `node:process`
  seulement) : inutile d'installer Remotion et ses 9 dépendances sur le VPS.

### Dette de sécurité assumée, datée

`PermitRootLogin` reste actif — décision de Guillaume du 30/07 : finir
l'installation d'abord, resécuriser à la fin du palier 1. **À couper avant toute
donnée patient.** Accès de secours vérifié : `guillaume@` fonctionne par clé et
appartient au groupe `sudo` (mais `sudo` exige un mot de passe, donc l'admin
automatisée passera par root tant que ce point n'est pas tranché).

## 2026-07-30 — SPEC-PALIER-1, étape 2 : moteur de rendu sur le VPS

Fait :
- Node v22.23.2 déjà présent sur le VPS (78.47.14.178) — pas eu à l'installer.
- `unzip` manquant, bloquait le téléchargement de chrome-headless-shell par
  HyperFrames → installé (`apt install unzip`).
- Projet test `tuto-hermes-16x9` transféré, rendu en ligne de commande
  (`npx hyperframes@0.7.77 render`), comparé pixel par pixel à un rendu local
  frais (même source `index.html`) : identique (les seuls écarts sont du
  lissage de police sous-pixel, invisible à l'œil). Durée, absence d'audio :
  identiques.
- **Fini quand** de l'étape 2 validé : un `.mp4` produit sur le VPS est
  visuellement identique à un rendu local.

Constaté, à trancher par Guillaume avant l'étape 5 (l'agent devra appeler le
rendu lui-même) :
1. **VPS sous-dimensionné** : 2 vCPU / 3.7 Go RAM / 75 Go disque livrés, alors
   que le spec demandait un CPX32 (4 vCPU / 8 Go / 160 Go). Le rendu a quand
   même abouti (5m51 pour 65s de vidéo, 1 seul worker faute de RAM) mais c'est
   loin de la marge prévue pour des rushes réels plus longs.
2. **Root SSH encore ouvert** : la clé configurée sur ce poste se connecte en
   `root@`, alors que le runbook (DoD phase 2) exige `PermitRootLogin no`.
   Écart de sécurité à corriger — projet traitant des données de patients.
3. **Permission trap** : Node est installé sous `/root/.hermes/node/`, et
   `/root` est en `700`. Résultat : ni `hermes` ni `guillaume` (le compte qui
   fait réellement tourner `hermes-gateway.service`) ne peuvent exécuter
   `node`/`npx` — seul `root` le peut. Bloquant pour l'étape 5 : l'agent
   Hermes (process `guillaume`) devra pouvoir invoquer `hyperframes render`
   lui-même. Nécessite soit un déplacement de l'install Node vers un chemin
   accessible (ex. `/usr/local/node/`), soit un ajustement de permissions
   ciblé — pas un simple `chmod o+x /root`.
4. Déploiement réel diverge du runbook sur un point : pas de Docker
   (`docker compose` absent), Hermes tourne nativement via un venv Python +
   service systemd sous l'utilisateur `guillaume` (pas `hermes`).

Prochaine étape : trancher les 4 points ci-dessus, puis étape 3 (doctrine en
skill Hermes).

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
