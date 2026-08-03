---
name: capsule-prompt
description: Vidéo depuis un texte ou un prompt, sans rush ni caméra.
metadata:
  tags: capsule, prompt, hyperframes, motion-design, sans-rush, IMCP
---

# Capsule depuis un prompt

> **Quand cette skill s'applique.** Le praticien envoie un **sujet, un script
> ou des notes** — aucune vidéo, aucun rush, aucune caméra. Le rendu est du
> motion design typographique : il n'a besoin d'AUCUNE source visuelle.
> Si tu reçois un rush, ce n'est pas cette skill : charge `montage-imcp`.

> Deux classes de vidéo, deux doctrines. **Ne pas les mélanger.**
>
> | Entrée | Doctrine | Contrat | Portail |
> |---|---|---|---|
> | Un rush du praticien | `montage-imcp` | `plan.json` | `npm run portail` |
> | **Un prompt / un texte** | **cette skill** | **`capsule.json`** | **`npm run portail:capsule`** |

## RÈGLE A — tu n'écris JAMAIS de HTML

Tu produis **un `capsule.json`**, et rien d'autre. Le HTML est généré par
`npm run capsule:build`.

Ce n'est pas une préférence de style. Le 30/07/2026, écrire le HTML à la main a
coûté **4,35 millions de jetons pour une vidéo de 39 s** — 12 Ko de HTML
réinjectés dans le contexte à chaque appel du modèle (decisions 016 et 017).
Un `capsule.json` fait 2 Ko.

C'est la decision 005 : **l'IA décide QUOI, le code décide COMMENT.**

Éditer un `index.html` généré est détecté par `npm run capsule:check` et bloque
`npm run check`. Le prochain build écraserait la modification en silence.

## RÈGLE B — le rythme se calcule, il ne s'estime pas

Une capsule est **muette**. Le spectateur doit lire. La faute n°1 est un texte
qu'on n'a pas le temps de lire.

Le portail mesure : `mots ÷ (durée − animation d'entrée)`.
**Confort ≤ 3,2 mots/s. Rejet au-delà de 4,5.**

Quand une scène est trop dense, **coupe du texte avant d'allonger la scène**.
Une capsule qui s'étire pour rester lisible perd l'attention aussi sûrement
qu'une capsule illisible.

## RÈGLE C — un praticien, une charte

`"charte": "<nom>"` pointe vers `src/theme/<nom>.ts`, **source unique de la
palette** (RÈGLE 4bis de `montage-imcp`). Le portail rejette une charte
inexistante.

⚠️ Ne réutilise **jamais** la charte d'un praticien pour un autre. Le cyan
`#49B6C9` est l'accent du client-01. Un nouveau praticien =
un nouveau thème, pas un emprunt.

## RÈGLE D — aucune piste sans licence

`musique.licence` est **obligatoire** dès qu'une piste est fournie. Le portail
rejette sans elle. Un nom de fichier ne prouve rien : `concerto.mp3` était du
Saint-Preux à l'octet près (decision 014).

Conserve le **nom d'origine** du fichier — renommer masque la provenance.

## Le contrat `capsule.json`

```json
{
  "type": "capsule-prompt",
  "titre": "…",
  "charte": "client-01",
  "format": "16:9",
  "reseau": "youtube",
  "pied": "… · Dr …",
  "musique": { "fichier": "x.mp3", "licence": "…", "volume": 0.68 },
  "scenes": [
    {
      "kicker": "Sur-titre court, ≤ 44 car.",
      "lede": ["Une ligne", "Une seconde ligne"],
      "dureeSec": 12,
      "bloc": { "type": "rule" },
      "sub": "Corps de scène. Mots-clés en **cyan**, emphase en *italique*."
    }
  ]
}
```

- `lede` : une entrée = une ligne, révélée par masque. **≤ 62 caractères** par
  ligne, sinon elle passe à la ligne et casse l'animation.
- `sub` : balisage **restreint** — `**mot**` → cyan (RÈGLE 2), `*mot*` →
  italique. Aucun autre HTML n'est accepté ; tout le reste est échappé.
- `signature` (optionnel, scène finale) : signe de fin en monospace cyan.

### Vocabulaire des blocs — n'invente rien

| `bloc.type` | Pour quoi | `data` |
|---|---|---|
| `rule` | Filet cyan sous le titre. Le défaut. | — |
| `duo-profils` | Deux profils opposés (rouge / cyan) | `{gauche:{tag,texte}, droite:{tag,texte}}` |
| `marqueurs` | Liste de puces courtes en cascade | `["IL-6","MMP-8"]` |
| `jauge` | Barre à zones + curseur | `{zones:[{label,pct,ton:ok\|warn\|bad}], curseurPct}` |
| `etapes-score` | Pipeline 3-4 étapes + compteur animé | `{etapes:[{titre,texte}], score:{valeur,libelle}}` |
| `comparatif` | Avant / après chiffré | `{gauche:{titre,valeur,note}, droite:{…}}` |
| `manifeste` | Lignes-affirmations en cascade | `{lignes:[…]}` |
| `aucun` | Titre seul | — |

Un type hors de cette liste est rejeté par le portail. Si un contenu n'entre
dans aucun bloc, **remonte-le à Guillaume** — un nouveau bloc s'ajoute dans
`_socle/capsule.template.html` et `capsule-build.mjs`, jamais dans une vidéo.

## La procédure, dans cet ordre

```
prompt → capsule.json → npm run portail:capsule -- <projet>
                              ↑                    |
                              └──── si code 3 ─────┘   (3 essais max)
                                    ↓ si code 0
                        npm run capsule:build <projet>
                                    ↓
                        npm run check   (dans le dossier)
                                    ↓
                        npx hyperframes render
```

**Le rendu est verrouillé** : `guard-portail.mjs` refuse de le lancer tant que
`capsule.json` n'a pas de reçu de portail valide couvrant CETTE version. Modifier
le contrat après validation invalide le reçu.

Un rejet du portail coûte 0 jeton et 1 seconde. Un rendu fautif coûte plusieurs
minutes machine et toute la boucle de correction.

## Ce que tu ne mets pas dans ton contexte

- Ne relis **jamais** un `index.html` généré. Il fait 20 Ko ; le contrat en fait 2.
- Sorties de `ffmpeg`, `ffprobe`, `hyperframes render` → vers un fichier. Tu ne
  lis que le code de sortie, et les 5 dernières lignes en cas d'échec.

## Hors périmètre

Voix off, images IA, 3D, publication automatique : paliers 2-3
(decisions 007-011). Si on te le demande, dis-le — ne bricole pas un substitut.
