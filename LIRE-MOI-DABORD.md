# Livraison du 01/08/2026 — réduction du coût par vidéo

Ce dossier est **un clone de ton repo GitHub au commit `c802e45`**, avec les
modifications appliquées **non commitées**. Tu vois donc exactement ce qui a
changé avec :

```bash
git diff --stat
```

Rien n'a été poussé, rien n'a été commité, ta copie de travail habituelle n'a
pas été touchée.

---

## Ce qui a été fait

| | Statut | Gain |
|---|---|---|
| **Étape 1** — polices hors du HTML | ✅ vérifié | ~1,5 à 2,5 $/vidéo |
| **Étape 4** — portail transformé en verrou | ✅ vérifié | ~1 à 2 $/vidéo |
| **Correctif** — `guard-render` réparé sur Linux | ✅ vérifié | garde-fou qui ne protégeait rien |
| Étape 3 — sorties d'outils hors contexte | 📝 règle écrite, à redéployer | ~0,5 à 1 $ |
| Étape 2 — builder `plan.json → index.html` | ⏸️ à décider ensemble | levier structurel |
| Étapes 5-6 — routage modèle, cache | 📝 documenté | — |

Détail complet : **`docs/COUT-PAR-VIDEO.md`**
Décision : **`decisions/016-cout-par-video.md`**
Journal : **`docs/journal/sessions.md`** (entrée du 01/08)

---

## Le chiffre

`videos/capsule-3204/index.html` : **168 232 → 23 915 octets (−86 %)**.
Sur les 14 fichiers : **2 020 438 octets retirés du HTML**.

Ce sont des octets que l'agent de montage payait à chaque lecture, puis à chaque
appel suivant de la session.

---

## Vérifie d'abord ceci

```bash
npm run fonts:check && npm run teasers:check && npm run socle:check
```

Les trois doivent être verts (ils le sont ici). `npm run check` complet demande
`npm install` d'abord — `lint` et `test` ont besoin de `node_modules`.

**Puis la vérification qui compte vraiment, et que je ne peux pas faire à ta
place :**

```bash
npx hyperframes render
```

**Et regarder le `.mp4`.** Une police manquante ne provoque aucune erreur — elle
tombe en fallback sans-serif. C'est exactement le défaut que tu as diagnostiqué
le 31/07. Le titre doit être en **Cormorant**, les sous-titres en **Manrope**.

---

## Sur le renversement de ton choix du 31/07

Tu avais choisi le base64 la veille, délibérément, pour « aucun chemin relatif à
casser entre local et VPS ». J'ai renversé ce choix. Voici ce que j'ai gardé et
ce que j'ai payé.

**Gardé — l'auto-hébergement, qui était le fond de ta décision.** Aucun accès
réseau, aucune police système requise. Seul le transport change : `data:` URI →
fichier `.woff2` à côté. Round-trip vérifié **bit-pour-bit contre `HEAD`** : les
octets que Chromium reçoit sont identiques.

**Payé — le base64 achetait l'immunité au défaut invisible.** En reprenant ces
142 Ko, je te dois le garde-fou correspondant : `npm run fonts:check` **bloque**
si une référence `./fonts/` ne résout pas. Testé en cassant volontairement une
référence : exit 0 → 2 → 0 après `socle:sync`.

**Ce qui a levé le doute sur les chemins relatifs :** `source.mp4`,
`logo-mark.png` et `intro-imcp.mp4` sont **déjà** référencés en relatif par les
compositions qui rendent sur le VPS (dont `teaser-05-formation`). Le renderer les
résout. Le seul risque réel était d'oublier la copie — c'est ce que
`socle-assets.mjs` gère, et il gère maintenant aussi les dossiers.

Si tu préfères revenir au base64, `git checkout .` suffit.

---

## Ce que j'ai trouvé en passant

**`guard-render.mjs` ne protégeait rien en production.** Il ne sondait les
processus que via `powershell.exe`. Sur le VPS Linux, l'appel échouait, le
`catch` renvoyait `[]`, et tous les rendus parallèles passaient. Corrigé (`ps`
hors Windows).

**La proposition commerciale contient une affirmation fausse.** §7 :
« quatre cinquièmes de la facture tiennent au transcript ». `imcp3181.srt` fait
**1 573 octets** — il ne peut pas représenter 80 % de 7 à 10 millions de jetons.
La promesse qui en découle — « un rush deux fois plus long coûte environ deux
fois plus cher » — ne tient pas devant le Dr Baudot. Le vrai facteur est le
**nombre d'itérations de montage**. À reformuler avant envoi.

---

## Pourquoi je n'ai pas fait l'étape 2

C'est le plus gros levier, et je l'ai laissée ouverte volontairement.

`plan.json` et `teaser.json` sont des schémas différents : le second décrit un
teaser (cartes, module, titre de fin), le premier un montage sur rush (spans,
overlays, captions). Le builder demande une correspondance entre les 5 types
d'overlay du portail (`stat`, `chart`, `site`, `list`, `punch`) et un rendu
visuel.

**C'est une décision de design sur le livrable du Dr Baudot, pas une décision
technique.** Tu m'as demandé de réduire les coûts *sans atténuer la qualité du
montage* — inventer seul l'apparence de ses vidéos aurait été exactement ça.

La méthode qui a marché pour le socle des teasers s'applique : partir de
`videos/capsule-3204/`, montage sur rush déjà livré et validé, en extraire un
template, et vérifier la régénération octet-pour-octet. À faire avec toi, sur un
rendu de référence sous les yeux.

---

## Pour porter ça dans ton vrai repo

```bash
cd /chemin/vers/ton/repo
git checkout -b cout-par-video
# copier les fichiers modifiés depuis ce dossier, ou :
git diff --no-index /chemin/vers/ton/repo <ce-dossier> > cout.patch
```

Le plus simple reste de me donner le chemin de ta copie de travail — j'y
applique les mêmes changements directement.
