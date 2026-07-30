import type { TeaserProps } from "./TeaserVertical";

/**
 * Teaser 1 — short vertical du cours « Les réglages du LASER Er-Yag » (13 min).
 * UN SEUL FIL : sculpter le tissu vivant → 3 réglages, palette infinie →
 * l'analogie du champagne → opérer dans la dimension histologique → module 2.
 * Chaque plan = UNE phrase complète, coupée aux frontières exactes de la
 * transcription (out/teaser/audio.srt) — la voix n'est JAMAIS hachée.
 * Recadrage vérifié image par image : slides plein écran sur fond noir = "fit",
 * visage au bureau = "crop".
 */
export const TEASER1_PROPS: TeaserProps = {
  src: "teaser-src.mp4",
  eyebrow: "IMCP · Formation Laser Er-YAG",
  title: "Sculpter le tissu vivant au LASER",
  // « Nous sommes des sculpteurs de tissus vivants avec le laser. » (slide SEM marteau/burin)
  hook: { startSec: 306.6, durationSec: 5.0, reframe: "fit", kicker: "Microchirurgie au laser", caption: "Nous sommes des **sculpteurs de tissus vivants**" },
  value: [
    // « Avec ces 3 paramètres, vous allez avoir une palette infinie de possibilités pour opérer vos patients. »
    { startSec: 31.4, durationSec: 9.9, reframe: "fit", kicker: "La promesse", caption: "3 paramètres, une **palette infinie** de possibilités" },
    // « Voilà deux coupes de champagne… » (slide champagne, l'analogie visuelle forte)
    { startSec: 581.5, durationSec: 7.0, reframe: "fit", kicker: "L'analogie", caption: "Deux coupes de champagne pour **doser chaque effet**" },
    // « On opère littéralement dans la dimension histologique. » (slide histologie)
    { startSec: 725.2, durationSec: 6.0, reframe: "fit", kicker: "La précision", caption: "Opérer dans la **dimension histologique**" },
  ],
  // « Je vous donne rendez-vous dans le deuxième module. » (visage au bureau → crop)
  cta: { startSec: 744.6, durationSec: 5.4, reframe: "crop", caption: "**Rendez-vous** pour aller plus loin" },
  ctaLine1: "Maîtrisez le LASER Er-YAG",
  ctaLine2: "www.imcpformations.fr",
  music: { src: "music/teaser-bed.wav", volume: 0.03 },
};
