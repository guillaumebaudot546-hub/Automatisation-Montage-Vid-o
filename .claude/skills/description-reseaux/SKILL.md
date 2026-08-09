---
name: description-reseaux
description: Rédiger la description d'une vidéo, adaptée à chaque réseau social, en deux propositions A/B. À charger quand une vidéo est validée et qu'il faut la publier — pas avant. Applique la decision 010.
metadata:
  tags: description, legende, caption, reseaux, linkedin, instagram, tiktok, publication
---

# La description qui accompagne la vidéo

> Une vidéo livrée sans description n'est pas livrée : le praticien doit encore
> écrire le texte lui-même, au moment où il veut publier. C'est exactement le
> travail qu'on lui a promis d'enlever.

## Quand

Une fois la vidéo **validée** par le praticien. Pas avant : une description
écrite sur un montage qui va changer est du travail jeté.

## D'où vient la description : du SUJET de la vidéo

**Tu n'attends jamais qu'on te donne des mots-clés pour écrire.** Le sujet est
déjà là, sous tes yeux, dans ce que tu viens de monter :

| Où regarder | Ce que tu y prends |
|---|---|
| `capsule.json` — `lede`, `kicker`, `sub` | le cas, en une phrase |
| les `tag` et `texte` des blocs photo | la chronologie clinique, étape par étape |
| les `sousTitres` de la voix off | le propos exact du praticien |
| `pied`, `reseau`, `format` | l'identité et la plateforme visée |

Une vidéo montée contient tout ce qu'il faut pour en parler. Demander « quels
mots-clés voulez-vous ? » avant d'avoir rien proposé, c'est renvoyer au
praticien le travail qu'on lui a promis d'enlever.

**Trois cas, dans cet ordre de priorité :**

**1. Il a dit quelque chose** — un angle, un public, un terme à mettre en avant
(« insiste sur le laser », « c'est pour mes confrères », « mets en avant le
recul à 4 ans »). **Sa demande l'emporte sur tout le reste**, y compris sur le
contenu de la vidéo et sur ses mots-clés enregistrés. Même logique que la
decision 007 : l'humain surcharge, l'IA ne dévie jamais seule.

**2. Il n'a rien dit, mais la vidéo est explicite** — les légendes nomment le
cas, les étapes, le résultat. Tu écris à partir de ça. C'est le cas courant, et
c'est là que tu lui fais gagner du temps.

**3. Il n'a rien dit ET la vidéo ne suffit pas** — légendes vagues, cas non
nommé, chronologie ambiguë, terme clinique dont tu n'es pas sûr. **Tu demandes.
Tu n'inventes pas.**

> Une description est publiée sous le nom d'un praticien, sur un sujet médical.
> Une phrase clinique inventée qui sonne juste est plus dangereuse qu'une
> question posée : lui la relira sans la voir, parce qu'elle ressemble à ce
> qu'il aurait écrit.

Demande court et précis, en montrant ce que tu as compris :

> « J'ai monté le cas du liseret bleu : violation de l'espace biologique,
> laser Er-YAG puis greffe, contrôle à 4 ans. Deux choses que je ne veux pas
> deviner avant d'écrire : la greffe est-elle bien prélevée en tubérosité, et
> le public visé est-il vos confrères ou vos patients ? »

Ne demande jamais « quels mots-clés voulez-vous ? » — c'est lui rendre le
travail. Demande le fait précis qui te manque.

Si `praticiens/<client>.json` porte un champ `motsCles`, sers-t'en comme d'un
appui — jamais comme d'une condition pour commencer.

## La règle des deux propositions (decision 010)

Pour **chaque** réseau visé, tu écris **deux** versions :

- **A — l'angle principal.** Ce que la vidéo dit d'elle-même : le cas, le geste,
  le résultat, dans l'ordre où on les voit. Si le praticien a demandé un angle,
  A est cet angle. Si sa fiche porte des mots-clés, A les emploie.
- **B — un autre angle.** Même sujet, autre porte d'entrée : une question, un
  chiffre, un contre-pied, le geste plutôt que le résultat, le délai plutôt que
  la technique.

Il choisit A, B, ou demande une retouche. **Son choix est un signal de goût :
note-le dans sa fiche** (RÈGLE 6), et complète `motsCles` avec les termes qu'il
emploie spontanément quand il corrige. La liste se construit toute seule, à
l'usage — on ne la lui réclame pas en formulaire.

## Le ton, réseau par réseau

| Réseau | Longueur | Ton | Forme |
|---|---|---|---|
| **LinkedIn** | 700-1200 signes | confraternel, pédagogique | paragraphes courts, 1 idée par ligne, 3-5 hashtags sobres, pas d'emoji décoratif |
| **Instagram** | 300-600 signes | direct, incarné | première ligne forte (seule visible avant « plus »), emojis parcimonieux, 8-15 hashtags en fin |
| **TikTok / Shorts** | 80-150 signes | frontal | une question ou une punchline, 3-5 hashtags, rien d'autre |
| **YouTube** | 200-400 signes + chapitres | informatif | phrase de contexte, puis ce qu'on voit, puis le lien |

**La première ligne fait tout le travail.** Sur Instagram et TikTok, c'est la
seule chose lue avant de faire défiler. Ne l'ouvre jamais par « Dans cette
vidéo… » ni par le nom de l'institut : commence par ce qui accroche.

## Garde-fou déontologique — le point que la spec d'origine n'avait pas

Le Dr Baudot est chirurgien-dentiste. Sa communication publique est encadrée :
il peut **informer**, il ne peut pas **démarcher**. Une description mal tournée
l'expose personnellement, pas nous.

**Interdit dans une description :**
- promettre un résultat (« résultat garanti », « sans douleur », « définitif ») ;
- comparer à d'autres praticiens ou techniques concurrentes (« la meilleure
  méthode », « contrairement à… ») ;
- un témoignage de patient, même anonyme, même élogieux ;
- appeler à prendre rendez-vous, afficher un tarif, créer l'urgence.

**Attendu à la place :** décrire le **cas** et le **geste**. « Voici une
situation, voilà comment elle se traite, voilà ce que ça change. » Le registre
est celui de la formation entre confrères — c'est d'ailleurs le vrai public
d'IMCP, un institut de formation.

⚠️ **Une vidéo avant/après est le cas le plus sensible.** Montrer un résultat
est légitime en contexte pédagogique ; le présenter comme une promesse
commerciale ne l'est pas. Le texte doit dire ce qui a été **fait**, jamais ce
que le lecteur **obtiendrait**.

Dans le doute : tu écris la version prudente et tu signales le doute. Ce n'est
pas à toi de trancher une question déontologique — et la validation du
praticien vaut contrôle déontologique et médical.

## Ce que tu écris, concrètement

Un fichier `description.md` dans le dossier du projet, à côté de la vidéo :

```markdown
# Descriptions — <nom du projet>

## LinkedIn
### A — sur ses mots
<texte>
### B — autre angle
<texte>

## Instagram
### A — sur ses mots
...
```

Puis tu envoies les propositions dans la conversation, réseau par réseau, en
lui demandant de choisir. **Ne publie jamais toi-même** : tu prépares le texte,
il le poste (RÈGLE 7).

## Hashtags

Sobres et exacts. Pas de hashtag générique à fort volume (`#dentist`, `#smile`)
qui noie le post dans du contenu grand public : le public visé est
professionnel. Préférer les termes du métier — `#parodontologie`,
`#microchirurgie`, `#chirurgiedentaire`, `#formationdentaire`.
