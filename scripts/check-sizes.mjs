// Garde-fou "un fichier = une job" : alerte quand un fichier grossit trop.
//
// Deux regimes, parce que les deux moteurs n'ont pas la meme unite de decoupe :
//
//  - src/**.ts|tsx (Remotion) : un module = une responsabilite.
//    Cible 150-200 lignes, avertissement a 200, rouge a 300. Remede : decouper
//    en modules.
//
//  - imcp-hyperframes/**/index.html : une composition HyperFrames est un HTML
//    mono-fichier PAR CONCEPTION (CSS et JS inlines). Lui appliquer le plafond
//    des modules TS n'aurait aucun sens. Seuils plus hauts, et le remede n'est
//    pas "couper le fichier" mais extraire des blocs et composants reutilisables
//    (voir hyperframes.json -> paths.blocks / paths.components).
//
// Lancer : npm run check:sizes
// Sortie 2 sur rouge : Claude Code traite 2 comme bloquant et montre le message.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const REGIMES = [
  {
    nom: "modules Remotion",
    racine: "src",
    garde: (nom) => new Set([".ts", ".tsx"]).has(extname(nom)),
    warn: 200,
    hard: 300,
    remede: "a decouper en modules",
  },
  {
    nom: "compositions HyperFrames",
    racine: "imcp-hyperframes",
    garde: (nom) => nom === "index.html",
    warn: 400,
    hard: 700,
    remede: "a factoriser en blocs HyperFrames (hyperframes add / paths.blocks)",
  },
];

const IGNORES = new Set(["node_modules", "renders", "snapshots", ".hyperframes"]);

function walk(dir, garde) {
  const out = [];
  let entrees;
  try {
    entrees = readdirSync(dir);
  } catch {
    return out;
  }
  for (const nom of entrees) {
    if (IGNORES.has(nom)) continue;
    const p = join(dir, nom);
    if (statSync(p).isDirectory()) out.push(...walk(p, garde));
    else if (garde(nom)) out.push(p);
  }
  return out;
}

let failed = 0;
let warned = 0;

for (const regime of REGIMES) {
  for (const file of walk(regime.racine, regime.garde)) {
    const lines = readFileSync(file, "utf8").split("\n").length;
    if (lines > regime.hard) {
      console.log(
        `ROUGE  ${file} — ${lines} lignes (limite dure ${regime.hard}, ${regime.remede})`,
      );
      failed++;
    } else if (lines > regime.warn) {
      console.log(
        `orange ${file} — ${lines} lignes (cible ${regime.warn}, surveiller)`,
      );
      warned++;
    }
  }
}

if (failed > 0) {
  console.log(`\n❌ ${failed} fichier(s) au-dessus de la limite dure.`);
  process.exit(2);
} else if (warned > 0) {
  console.log(`\n⚠️  ${warned} fichier(s) a surveiller, mais rien de bloquant. Vert.`);
  process.exit(0);
} else {
  console.log("✅ Tous les fichiers tiennent sous la limite. Vert.");
  process.exit(0);
}
