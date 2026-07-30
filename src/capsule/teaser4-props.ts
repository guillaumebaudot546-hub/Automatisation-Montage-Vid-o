import type { CapsuleV2Props } from "./CapsuleV2";

/**
 * Capsule ~1 min du cours laser — PASSAGE CONTINU cohérent AVEC son intro
 * (source 8,5→61 s : « comment utiliser le laser, c'est simple » → les 6
 * paramètres → palette infinie → c'est simple → voir/ressentir/s'exprimer).
 * Voix jamais coupée. Source audio NORMALISÉE FORTE (teaser-loud.mp4, -14 dB).
 * Rendu en 16:9 (natif du cours, visage+slides sans recadrage) ET 9:16.
 * Temps des calques en CONTENU (0 = source 8,5).
 */
export const TEASER4_PROPS: CapsuleV2Props = {
  src: "teaser-loud.mp4",
  eyebrow: "IMCP · Formation Laser Er-YAG",
  title: "Le LASER Er-YAG, en 6 réglages",
  spans: [{ fromSec: 8.5, toSec: 61.0 }], // intro + explication continue
  overlays: [
    // content 0-9 : son INTRO face caméra (vidéo brute, sous-titre) — pas de calque
    // « Il y a 6 paramètres : 3 sur la machine, 3 dans vos mains. »
    {
      atSec: 10.6, durationSec: 14.4, kind: "slideAnim",
      slideHeader: "6 paramètres de réglage", slideSub: "3 sur la machine, 3 dans vos mains",
      slideGroups: [
        { label: "Sur la machine", items: ["Énergie par impact", "Fréquence des impacts", "Débit d'eau"] },
        { label: "Dans vos mains", items: ["Temps d'exposition", "Distance de travail", "Angulation"] },
      ],
      slideFooter: "Une palette infinie de possibilités",
    },
    // « …une palette infinie de possibilités pour opérer vos patients. »
    { atSec: 25.3, durationSec: 7.2, kind: "stat", statValue: "∞", label: "Une palette infinie de possibilités" },
    // « Les principes tiennent sur cette diapositive. C'est très simple. »
    { atSec: 32.9, durationSec: 6.5, kind: "punch", punchPairs: [{ big: "1", small: "diapositive suffit" }] },
    // « …vous voyez, vous ressentez, vous vous exprimez sans difficulté. »
    {
      atSec: 39.7, durationSec: 12.6, kind: "slideAnim",
      slideHeader: "Voir, ressentir, s'exprimer",
      slideSub: "Le geste devient intuitif",
      slideGroups: [
        { label: "Vous voyez", items: ["Ce que vous faites", "En temps réel"] },
        { label: "Vous ressentez", items: ["Le bon réglage", "Sans difficulté"] },
      ],
      slideFooter: "Le laser au service de votre geste",
    },
  ],
  cta: { atSec: 48.6, durationSec: 3.4, line1: "Maîtrisez le LASER Er-YAG", line2: "www.imcpformations.fr" },
  captions: [
    // Son intro face caméra (content 0-9)
    { text: "Comment utiliser le **laser Er-YAG** ?", fromSec: 1.2, toSec: 5.0 },
    { text: "**C'est très simple.**", fromSec: 5.2, toSec: 8.8 },
  ],
  music: { src: "music/teaser-bed2.wav", volume: 0.05 },
};
