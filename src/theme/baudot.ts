/**
 * DA vidéo Dr Baudot — codes couleurs IMCP (logo cyan / navy profond).
 * Source de vérité pour tout habillage vidéo : accent unique cyan IMCP,
 * typo Cormorant/Manrope. Le cœur (theme/) n'importe jamais depuis
 * scenes/, components/, hero/.
 */

export const BAUDOT = {
  color: {
    navy950: "#060D18", // fond principal (navy IMCP)
    navy900: "#0A1524", // sections en relief
    navy800: "#11213A", // cartes, bordures hautes
    ivory: "#EEF3FA",   // titres, texte fort
    cream: "#DCE4EF",   // corps de texte
    slate: "#9DB1C9",   // texte secondaire
    champagne: "#49B6C9", // accent unique — CYAN IMCP (filets, eyebrows, focus)
  },
  font: {
    display: "'Cormorant', Georgia, serif",
    body: "'Manrope', system-ui, sans-serif",
  },
  /** Fond dégradé standard des cartons */
  cardBackground:
    "linear-gradient(180deg, #0A1524 0%, #060D18 55%, #070E1B 100%)",
  /** Filet cyan (hairline) */
  hairline: (opacity = 0.85) =>
    `linear-gradient(90deg, transparent, rgba(73,182,201,${opacity}), transparent)`,
} as const;
