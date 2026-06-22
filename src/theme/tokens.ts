// Domaine "identite" — source UNIQUE de l'identite visuelle IMCP / DentalSynthesis.
// Le coeur du projet. Ce fichier n'importe RIEN d'autre du projet (regle de dependance).
// Palette / typo a reutiliser partout au lieu de recoder des couleurs en dur.

export const COLORS = {
  // Cyan medical (couleur signature)
  cyan: "#49B6C9",
  cyanLight: "#A7E8F2",
  cyanDeep: "#1F8FA8",

  // Fonds navy sombre
  bg: "#060D18",
  bgPanel: "#0D1B30",
  bgDeep: "#0A1524",

  // Texte
  text: "#FFFFFF",
  textMuted: "#9DB1C9",

  // Accent premium
  gold: "#E6C887",
} as const;

export const FONTS = {
  heading: "Inter, system-ui, sans-serif",
  body: "Inter, system-ui, sans-serif",
} as const;

export type ColorToken = keyof typeof COLORS;
