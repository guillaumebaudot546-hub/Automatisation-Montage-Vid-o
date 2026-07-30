import type { TrailerProps } from "./TeaserTrailer";

/**
 * Teaser 3 (trailer) — balaye les points majeurs, praticien à l'écran, fondus
 * enchaînés. Audio = 6 soundbites NORMALISÉS FORT (voix cours enregistrée bas :
 * +13 dB + limiteur, coupés aux SILENCES réels — zéro mid-mot), enchaînés par
 * fondus + musique très basse. Source ré-encodée avec keyframes denses
 * (teaser-src-kf.mp4) → seek fluide, image non hachée. Crop décalé vers lui.
 * Beats calés sur les temps exacts de la piste audio assemblée.
 */
export const TEASER3_PROPS: TrailerProps = {
  src: "teaser-src-kf.mp4",
  audioSrc: "teaser-audio.wav",
  title: "Le LASER Er-YAG, en 6 réglages",
  totalSec: 29.99,
  beats: [
    // 0 — LUI face caméra : « C'est très simple »
    { fromSec: 0, durSec: 3.15, kind: "video", srcStartSec: 10.3, reframe: "crop", kicker: "Dr Fabrice Baudot", caption: "Le laser Er-YAG ? **C'est très simple**" },
    // 1 — fondu vers le SEM sculpteur
    { fromSec: 2.8, durSec: 3.9, kind: "video", srcStartSec: 313, reframe: "fit", kicker: "Microchirurgie au laser", caption: "Des **sculpteurs de tissus vivants**" },
    // 2 — 6 paramètres → palette infinie (typographie)
    {
      fromSec: 6.35, durSec: 7.6, kind: "slideAnim",
      slideHeader: "6 paramètres de réglage", slideSub: "3 sur la machine, 3 dans vos mains",
      slideGroups: [
        { label: "Sur la machine", items: ["Énergie par impact", "Fréquence des impacts", "Débit d'eau"] },
        { label: "Dans vos mains", items: ["Temps d'exposition", "Distance de travail", "Angulation"] },
      ],
      slideFooter: "Une palette infinie de possibilités",
    },
    // 3 — sans anesthésie
    { fromSec: 13.6, durSec: 5.37, kind: "video", srcStartSec: 531, reframe: "fit", kicker: "Programme Gentle", caption: "Un programme **sans anesthésie**" },
    // 4 — dimension histologique
    { fromSec: 18.62, durSec: 5.1, kind: "video", srcStartSec: 726, reframe: "fit", kicker: "Ultra précision", caption: "Opérer dans la **dimension histologique**" },
    // 5 — LUI face caméra : la clôture
    { fromSec: 23.37, durSec: 3.32, kind: "video", srcStartSec: 744, reframe: "crop", kicker: "La suite vous attend", caption: "**Rendez-vous** pour aller plus loin" },
    // 6 — CTA
    { fromSec: 26.69, durSec: 3.3, kind: "cta", ctaLine1: "Maîtrisez le LASER Er-YAG", ctaUrl: "www.imcpformations.fr" },
  ],
};
