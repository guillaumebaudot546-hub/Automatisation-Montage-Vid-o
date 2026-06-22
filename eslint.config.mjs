import { config } from "@remotion/eslint-config-flat";

export default [
  ...config,
  {
    // Regle de dependance : le coeur (identite/theme) ne depend pas des details (UI).
    // Le theme ne doit JAMAIS importer depuis scenes / components / hero.
    files: ["src/theme/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "**/scenes/**",
                "**/components/**",
                "**/hero/**",
                "../scenes/*",
                "../components/*",
                "../hero/*",
              ],
              message:
                "Le theme (identite) ne doit pas dependre des scenes/composants. Sens autorise : l'UI utilise le theme, jamais l'inverse.",
            },
          ],
        },
      ],
    },
  },
];
