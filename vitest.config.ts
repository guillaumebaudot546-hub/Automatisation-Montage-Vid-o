import { defineConfig } from "vitest/config";

// La landing page IMCP/ est un projet Next.js séparé (alias @/ propres à elle).
// On l'exclut du filet du projet vidéo, comme dans tsconfig.json.
export default defineConfig({
  test: {
    exclude: ["**/node_modules/**", "IMCP/**", "_sources-bruts/**"],
  },
});
