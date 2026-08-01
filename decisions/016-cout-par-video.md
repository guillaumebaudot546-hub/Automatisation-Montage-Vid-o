# 016 — Le coût par vidéo est un problème de plomberie, pas d'intelligence

**Date :** 2026-08-01 · **Statut :** Actif · **Suite de :** 014 (moteur), 006 (boucle K=3)

## Contexte

Premier montage réel (30/07) : **6,91 $** pour une vidéo de 39 s, 59 appels au
modèle, là où `SPEC-PALIER-1.md` budgétait 1,62 $. Le post-mortem du 31/07 a
corrigé les réglages (cache 5m → 1h, opus → sonnet, auxiliaires → haiku,
compression 0,4, prune 120 000). Ces correctifs étaient bons, mais ils
traitaient les symptômes.

Décomposition du relevé :

| Poste | Montant | Part |
|---|---|---|
| Écriture du cache | 3,72 $ | 54 % |
| Relecture du cache | 1,85 $ | 27 % |
| Texte généré | 1,34 $ | 19 % |

Reconstitution des volumes aux tarifs Sonnet 5 : **7 à 10 millions de jetons**,
~120 000 jetons de contexte moyen par appel. Le poste dominant n'est pas ce que
le modèle écrit — c'est ce qui **s'accumule dans la conversation et se refait
relire à chaque appel**.

## Décision

**On sépare deux natures de jetons, et on ne coupe que la seconde.**

| | Exemples | Traitement |
|---|---|---|
| **Raisonnement** | doctrine, `baudot.json`, exemples validés, transcription, choix des segments | Intouchable. À augmenter. |
| **Plomberie** | polices base64, dumps `ffmpeg`, HTML réécrit à la main, chemins absolus, traces | À supprimer. |

Corollaire non négociable : **l'économie réalisée se réinvestit dans la
sélection des segments**, qui repasse sur le modèle le plus capable. Réduire la
facture en dégradant le montage serait une fausse économie — le premier motif de
rejet du praticien reste la qualité, pas le prix.

## Pourquoi

Les deux natures se disputaient **la même fenêtre de contexte**. Les correctifs
du 31/07 le montrent en creux : `proactive_prune_tokens: 120000` et la
compression à 0,4 **supprimaient du raisonnement pour faire de la place à du
base64**. La plomberie ne coûtait pas seulement de l'argent, elle mangeait la
réflexion.

Mesure à l'appui : chaque composition HyperFrames portait **144 580 octets de
police en base64 sur 168 232**, soit 86 % du fichier. Une lecture de ce fichier
injectait ~42 000 jetons, relus à chaque appel suivant — environ **0,88 $ par
passage**, dont 0,76 $ de fonte pure.

## Conséquences

Appliqué le 01/08/2026 :

- **Polices sorties du HTML** (`scripts/fonts-extract.mjs`). 2 020 438 octets
  retirés sur 14 fichiers, −81 % à −93 % chacun. Les 4 `.woff2` vivent dans
  `_socle/assets/fonts/` et sont copiés dans chaque projet par `socle:sync` —
  même raisonnement que `logo-mark.png` : une composition est rendue depuis SON
  dossier. Round-trip vérifié bit-pour-bit contre `HEAD`.
- **`socle-assets.mjs` gère les dossiers d'assets**, et *sème* un dossier
  référencé par le HTML au lieu d'attendre qu'il existe — une police manquante
  ne provoque aucune erreur, elle tombe en fallback sans-serif.
- **Portail en verrou** (`scripts/guard-portail.mjs`). Le portail écrit un reçu
  empreinté ; aucun rendu ne part sans reçu couvrant CETTE version du plan.
  La RÈGLE 5 cesse d'être une consigne.
- **`guard-render.mjs` corrigé.** Il ne sondait que via `powershell.exe` : sur
  le VPS Linux le `catch` renvoyait `[]` et le garde-fou « jamais deux rendus en
  parallèle » **ne protégeait rien là où la production tourne**.

Reste à faire, dans l'ordre (voir `docs/COUT-PAR-VIDEO.md`) : sortir les
sorties d'outils du contexte, builder `plan.json → index.html`, routage modèle
fin, puis rouvrir les seuils de compaction et de cache.

## Ce que la mesure a démenti

`Proposition_Studio_Contenu_IA_Medstream.pdf` §7 affirme que « quatre cinquièmes
de la facture tiennent au transcript ». `imcp3181.srt` fait **1 573 octets** :
le transcript ne peut pas représenter 80 % de 7 à 10 millions de jetons. La
promesse commerciale qui en découle — « un rush deux fois plus long coûte environ
deux fois plus cher » — ne tient pas. Le vrai facteur est le **nombre
d'itérations de montage**. À corriger avant envoi au praticien.
