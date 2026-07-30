import type { CapsuleV2Props } from "./CapsuleV2";

/**
 * Capsule 1 — « Comment piloter le faisceau du LASER Er-Yag ? » (v4)
 * Timeline calée sur la transcription (out/capsule1/audio.srt). UNE coupe de
 * voix (53,4→59,2 s : phrase méta). Temps en CONTENU (0 = première frame voix).
 * Sous-titres : **mot** = mot-clé affiché en cyan fluo.
 * Contenu de SlideAnimated = extrait de la slide fournie par le praticien.
 */
export const CAPSULE1_PROPS: CapsuleV2Props = {
  src: "capsule/laser-er-yag-hd.mp4",
  eyebrow: "IMCP · Microchirurgie",
  title: "Comment piloter le faisceau du LASER Er-Yag ?",
  spans: [
    { fromSec: 0, toSec: 53.4 },
    { fromSec: 59.2, toSec: 115.4 },
  ],
  overlays: [
    // « il y a six paramètres » → chiffre-choc
    { atSec: 20.4, durationSec: 3.4, kind: "stat", statValue: "6", label: "Paramètres à maîtriser" },
    // …contenu de SA slide, ré-animé en cascade (plus d'image statique)
    {
      atSec: 23.8, durationSec: 5.1, kind: "slideAnim",
      slideHeader: "6 paramètres de réglage",
      slideSub: "Le faisceau LASER est absorbé par les tissus",
      slideGroups: [
        { label: "Sur la machine", items: ["Énergie par impact", "Fréquence des impacts", "Débit d'eau"] },
        { label: "Dans vos mains", items: ["Temps d'exposition", "Distance de travail", "Angulation du faisceau"] },
      ],
      slideFooter: "Dans les mains du chirurgien, la maîtrise opère",
    },
    // « trois sur la machine, trois dans vos mains » → carte punch noir/fluo
    {
      atSec: 29.0, durationSec: 6.2, kind: "punch",
      punchPairs: [
        { big: "3", small: "Sur la machine" },
        { big: "3", small: "Dans vos mains" },
      ],
    },
    // Il énumère les 3 réglages machine → liste animée
    {
      atSec: 35.2, durationSec: 9.2, kind: "list", kicker: "Sur la machine", staggerSec: 2.8,
      items: ["Énergie délivrée à chaque impact", "Fréquence des impacts", "Débit d'eau"],
    },
    // Puissance du laser → B-roll : SON laser en action
    { atSec: 44.4, durationSec: 8.8, kind: "broll", brollSrc: "clinical/vestibulaire.mp4", brollStartSec: 16, label: "Laser Er-YAG en action" },
    // Les 3 paramètres mains → liste animée
    {
      atSec: 53.4, durationSec: 10.4, kind: "list", kicker: "Dans vos mains", staggerSec: 3.0,
      items: ["Distance de travail", "Temps d'exposition", "Angulation du faisceau"],
    },
    // Ressenti au microscope → B-roll : microchirurgie au microscope
    { atSec: 63.8, durationSec: 7.8, kind: "broll", brollSrc: "clinical/vestibulaire.mp4", brollStartSec: 95, label: "Au microscope opératoire" },
    // « mon site IMCP » → carte site
    {
      atSec: 86.0, durationSec: 10.5, kind: "site", siteUrl: "www.imcpformations.fr",
      siteTitle: "Institut Microchirurgie Parodontale", siteSubtitle: "TP Laser Er-YAG · inscriptions sur imcpformations.fr",
    },
    // « petit à petit améliorer votre pratique » → graphe court…
    { atSec: 97.0, durationSec: 5.2, kind: "chart", chartTitle: "Votre pratique du laser", chartCaption: "Progressez pas à pas" },
    // …puis LUI au laser : la promesse incarnée en vidéo de contexte
    { atSec: 102.2, durationSec: 5.4, kind: "broll", brollSrc: "clinical/serdat.mov", brollStartSec: 115, label: "Guidé pas à pas" },
  ],
  cta: { atSec: 79.2, durationSec: 6.5, line1: "TP Laser Er-YAG", line2: "Organisés régulièrement" },
  music: { src: "music/whiteporcelain-capsule.wav", volume: 0.03 },
  captions: [
    { text: "**Bonjour les amis** ! Pour bien comprendre l'utilisation de votre **laser Erbium-YAG**…", fromSec: 0.4, toSec: 6.6 },
    { text: "…on me demande souvent **comment régler le laser**.", fromSec: 6.6, toSec: 10.2 },
    { text: "Je commence une **série de vidéos** pour bien utiliser votre laser…", fromSec: 10.2, toSec: 17.6 },
    { text: "…en commençant par **les réglages**.", fromSec: 17.6, toSec: 20.4 },
    { text: "**Six paramètres** permettent d'utiliser votre laser dans les **meilleures conditions**.", fromSec: 20.4, toSec: 28.9 },
    { text: "**Trois** se règlent **sur la machine**, et **trois** sont **dans vos mains**.", fromSec: 29.0, toSec: 35.2 },
    { text: "Sur la machine : l'**énergie par impact**, la **fréquence des impacts**, le **débit d'eau**.", fromSec: 35.2, toSec: 44.4 },
    { text: "Ces trois paramètres déterminent la **puissance du laser**…", fromSec: 44.4, toSec: 49.0 },
    { text: "…atténuée par le **débit d'eau** que vous aurez réglé.", fromSec: 49.0, toSec: 53.4 },
    { text: "Dans vos mains : la **distance de travail**, le **temps d'exposition**, l'**angulation du faisceau**.", fromSec: 53.4, toSec: 63.8 },
    { text: "Ces paramètres **se sentent**, par l'observation au **microscope opératoire**…", fromSec: 63.8, toSec: 71.8 },
    { text: "…ou avec des **aides optiques** — je recommande des **loupes ×3,5**.", fromSec: 71.8, toSec: 79.2 },
    { text: "Je vous les propose dans des **TP organisés régulièrement**.", fromSec: 79.2, toSec: 86.0 },
    { text: "Renseignez-vous sur mon **site IMCP** et venez **acquérir ces notions** à mes côtés.", fromSec: 86.0, toSec: 97.0 },
    { text: "**D'autres vidéos suivront**, pour améliorer **pas à pas** votre pratique du laser.", fromSec: 97.0, toSec: 107.6 },
    { text: "**À très bientôt !**", fromSec: 107.6, toSec: 109.4 },
  ],
};
