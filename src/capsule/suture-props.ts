import type { CapsuleV2Props } from "./CapsuleV2";

/**
 * Capsule « Fils de suture & aiguilles » — rush IMG_3181.mov (talking-head 9:16 natif).
 * UN SEUL span continu 0 → 71,15 s : le rush est déjà un discours complet et cohérent
 * (hook → principes → monofilament vs tressé → aiguilles → CTA parlé → « à très vite »).
 * Aucune coupe de voix, aucun fragment épars.
 * Source : imcp3181-loud.mp4 (1080×1920, audio normalisé -14,9 dB, keyframes -g 15).
 * Temps des calques en CONTENU (= temps source, le span démarre à 0).
 * Sous-titres : **mot** = mot-clé en cyan fluo.
 */
export const SUTURE_PROPS: CapsuleV2Props = {
  src: "imcp3181-loud.mp4",
  eyebrow: "IMCP · Microchirurgie",
  title: "Fils de suture & aiguilles : les bons critères",
  spans: [{ fromSec: 0, toSec: 71.15 }],
  overlays: [
    // « respecter les tissus, l'intégrité de la vascularisation, éviter les tensions »
    {
      atSec: 7.4, durationSec: 6.3, kind: "list",
      kicker: "En microchirurgie",
      items: ["Respecter les tissus", "Préserver la vascularisation", "Éviter les tensions"],
      staggerSec: 1.1,
    },
    // « premièrement le fil monofilament… on bannit les fils tressés »
    {
      atSec: 25.2, durationSec: 12.6, kind: "slideAnim",
      slideHeader: "Choisir son fil",
      slideSub: "Le premier critère : la structure du fil",
      slideGroups: [
        // Labels ≤ 22 car. et items ≤ 27 car. : au-delà ça passe à la ligne et
        // désaligne les deux colonnes (maxWidth 430 dans SlideAnimated).
        { label: "Oui — monofilament", items: ["Surface lisse", "Aucune rétention", "Passage atraumatique"] },
        { label: "Non — tressé", items: ["Retient les bactéries", "Inflammation post-op", "Effet scie"] },
      ],
      slideFooter: "Monofilament, toujours",
    },
    // « des aiguilles très précises avec des angles aigus, les taper cut »
    {
      atSec: 43.2, durationSec: 7.1, kind: "list",
      kicker: "Les aiguilles",
      items: ["Angles aigus", "Taper cut", "Geste précis et rapide"],
      staggerSec: 1.3,
    },
  ],
  // Bandeau CTA posé sur le CTA parlé du praticien (le visage reste visible)
  cta: { atSec: 58.5, durationSec: 12.0, line1: "Formations microchirurgie", line2: "www.imcpformations.fr" },
  captions: [
    { text: "Aujourd'hui, je voudrais vous parler des **fils de suture** et des **aiguilles**.", fromSec: 0.15, toSec: 3.3 },
    { text: "Sur quels **critères** choisissez-vous vos fils de suture et vos aiguilles ?", fromSec: 3.4, toSec: 7.1 },
    { text: "En microchirurgie, l'idée c'est de **respecter les tissus**, l'intégrité de la **vascularisation**, éviter les **tensions**.", fromSec: 7.25, toSec: 13.95 },
    { text: "Il faut être **efficace**, aller vite pour réduire les **suites opératoires**.", fromSec: 14.05, toSec: 20.8 },
    { text: "Il y a donc des **critères de choix** des fils de suture.", fromSec: 20.95, toSec: 24.0 },
    { text: "Premièrement, le fil : on parle de fil **monofilament**.", fromSec: 24.15, toSec: 28.35 },
    { text: "On **bannit les fils tressés**, qui retiennent les bactéries et provoquent une inflammation post-opératoire,", fromSec: 28.5, toSec: 35.9 },
    { text: "de véritables **scies** quand ils sont imprégnés de sang séché : ça **abîme les tissus**.", fromSec: 36.05, toSec: 41.8 },
    { text: "Concernant les aiguilles, on préfère des aiguilles très précises, avec des **angles aigus** :", fromSec: 41.95, toSec: 47.4 },
    { text: "les **taper cut**, qui permettent un geste **précis et rapide**.", fromSec: 47.5, toSec: 51.6 },
    { text: "Si vous voulez en savoir plus, je développe tous ces concepts dans mon **enseignement**", fromSec: 51.75, toSec: 56.5 },
    { text: "que je propose **online**, sur des vidéos beaucoup plus longues où l'on pourra discuter de tout cela.", fromSec: 56.6, toSec: 64.0 },
    { text: "Je vous engage à suivre tout ça sur **mon site**.", fromSec: 64.3, toSec: 70.4 },
    { text: "**À très vite.**", fromSec: 70.5, toSec: 71.1 },
  ],
  music: { src: "music/whiteporcelain-capsule.wav", volume: 0.03 },
};
