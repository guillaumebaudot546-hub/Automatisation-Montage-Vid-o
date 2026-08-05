import { config } from "@remotion/eslint-config-flat";

/**
 * SENS DES DEPENDANCES (docs/gouvernance/architecture.md).
 *
 * La regle « le coeur ne depend pas des details » ne couvrait que src/theme/,
 * soit 2 fichiers sur 70 : juste, mais symbolique. Elle couvre desormais tout
 * src/, en couches. Une couche n'importe JAMAIS d'une couche au-dessus d'elle.
 *
 *   0. theme/       identite : palette, typo. Ne depend de rien.
 *   1. lib/         logique pure et schemas. Peut lire l'identite.
 *   2. components/  briques d'interface. Peuvent lire 0 et 1.
 *   3. scenes/ hero/ clinical/ capsule/   compositions. Peuvent lire 0, 1, 2.
 *   4. Root.tsx, Composition.tsx          l'assemblage. Personne ne l'importe.
 *
 * Les compositions (couche 3) peuvent s'appeler entre elles — capsule/ reutilise
 * deja des blocs de clinical/. C'est du partage entre pairs, pas une inversion.
 */

const COUCHE_3 = ["scenes", "hero", "clinical", "capsule"];
const ASSEMBLAGE = ["Root", "Composition"];

/** Un dossier interdit, sous toutes les formes d'import possibles. */
const dossier = (nom) => [`**/${nom}/**`, `../${nom}/*`, `../../${nom}/*`];
/** Un fichier interdit a la racine de src/. */
const fichier = (nom) => [`**/${nom}`, `../${nom}`, `./${nom}`];

const interdit = (dossiers, fichiers, message) => ({
  "no-restricted-imports": [
    "error",
    {
      patterns: [
        {
          group: [...dossiers.flatMap(dossier), ...fichiers.flatMap(fichier)],
          message,
        },
      ],
    },
  ],
});

export default [
  ...config,
  {
    files: ["src/theme/**/*.{ts,tsx}"],
    rules: interdit(
      ["lib", "components", ...COUCHE_3],
      ASSEMBLAGE,
      "L'identite (src/theme) est la couche 0 : elle ne depend de RIEN. " +
        "Sens autorise : tout le reste utilise le theme, jamais l'inverse.",
    ),
  },
  {
    files: ["src/lib/**/*.{ts,tsx}"],
    rules: interdit(
      ["components", ...COUCHE_3],
      ASSEMBLAGE,
      "src/lib est de la logique pure : elle ne connait aucune interface. " +
        "Elle peut lire src/theme, rien de plus haut.",
    ),
  },
  {
    files: ["src/components/**/*.{ts,tsx}"],
    rules: interdit(
      COUCHE_3,
      ASSEMBLAGE,
      "Une brique d'interface ne connait pas les compositions qui l'utilisent. " +
        "Elle peut lire src/theme et src/lib.",
    ),
  },
  {
    files: COUCHE_3.map((d) => `src/${d}/**/*.{ts,tsx}`),
    rules: interdit(
      [],
      ASSEMBLAGE,
      "Une composition n'importe pas l'assemblage (Root, Composition) : " +
        "c'est l'assemblage qui la reference.",
    ),
  },
];
