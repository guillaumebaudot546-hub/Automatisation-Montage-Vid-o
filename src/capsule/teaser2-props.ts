import type { CapsuleV2Props } from "./CapsuleV2";

/**
 * Teaser 2 — short 9:16 du cours laser, bâti sur le MOTEUR CAPSULE (voix
 * continue + calques). UNE seule prise : l'intro 0→41,4 s du cours, d'un seul
 * tenant — la voix n'est JAMAIS coupée (règle 0 du skill montage-imcp).
 * Les propos sont mis en avant par la TYPOGRAPHIE animée (slide 6 params
 * ré-animée, « palette infinie »), pas par des images brutes.
 * Source paysage : visage en cover (0-13 s, recadré centré) ; le reste est
 * couvert par les calques typographiques.
 */
export const TEASER2_PROPS: CapsuleV2Props = {
  src: "teaser-src.mp4",
  eyebrow: "IMCP · Formation Laser Er-YAG",
  title: "Le LASER Er-YAG en 6 réglages",
  spans: [{ fromSec: 0, toSec: 41.4 }], // intro continue, zéro coupe
  overlays: [
    // « Il y a 6 paramètres : 3 sur la machine, 3 dans la main du chirurgien. »
    {
      atSec: 13.0, durationSec: 20.4, kind: "slideAnim",
      slideHeader: "6 paramètres de réglage",
      slideSub: "3 sur la machine, 3 dans vos mains",
      slideGroups: [
        { label: "Sur la machine", items: ["Énergie par impact", "Fréquence des impacts", "Débit d'eau"] },
        { label: "Dans vos mains", items: ["Temps d'exposition", "Distance de travail", "Angulation"] },
      ],
      slideFooter: "Dans les mains du chirurgien, la maîtrise opère",
    },
    // « …une palette infinie de possibilités pour opérer vos patients. »
    { atSec: 33.4, durationSec: 8.0, kind: "stat", statValue: "∞", label: "Une palette infinie de possibilités" },
  ],
  cta: { atSec: 34.5, durationSec: 6.5, line1: "Formation complète", line2: "www.imcpformations.fr" },
  captions: [
    { text: "Utiliser le laser **Er-YAG** ? C'est **très simple**.", fromSec: 0.4, toSec: 6.5 },
    { text: "**6 paramètres** suffisent à tout piloter.", fromSec: 6.5, toSec: 12.8 },
    // 13-41 : couvert par la slide animée puis le chiffre ∞ (sous-titres masqués)
  ],
  music: { src: "music/teaser-bed.wav", volume: 0.03 },
};
