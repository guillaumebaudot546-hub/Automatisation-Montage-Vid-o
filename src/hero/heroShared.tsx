import { useCurrentFrame, interpolate, Easing } from "remotion";

/**
 * Partagé du hero DentalSynthesis : palette, durée de boucle, fondu commun.
 * Palette navy/cyan (DA IMCP) — swap facile quand la palette officielle
 * du site sera transmise (C1/C4 PRD).
 */

export const C = {
  bg0: "#060D18",
  bg1: "#0A1524",
  bg2: "#0D1B30",
  white: "#EEF3FA",
  muted: "#9DB1C9",
  cyan1: "#A7E8F2",
  cyan2: "#49B6C9",
  cyan3: "#1F8FA8",
  blue: "#5B8DEF",
  sand: "#E6C887",
};

/** Durée totale de la boucle (24 s @ 30 fps). */
export const TOTAL = 720;

/** Fondu entrée/sortie d'une séquence. */
export const useFade = (inEnd: number, outStart: number, dur: number) => {
  const f = useCurrentFrame();
  return Math.min(
    interpolate(f, [0, inEnd], [0, 1], {
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    }),
    interpolate(f, [outStart, dur], [1, 0], {
      extrapolateLeft: "clamp",
      easing: Easing.in(Easing.cubic),
    })
  );
};
