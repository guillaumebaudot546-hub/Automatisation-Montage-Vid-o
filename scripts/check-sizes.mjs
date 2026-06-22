// Garde-fou "un fichier = une job" : alerte quand un fichier de code grossit trop.
// Cible 150-200 lignes. Avertissement a 200. Echec (rouge) a 300.
// Lancer : npm run check:sizes
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const ROOT = "src";
const WARN = 200;
const HARD = 300;
const EXT = new Set([".ts", ".tsx"]);

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (EXT.has(extname(name))) out.push(p);
  }
  return out;
}

let failed = 0;
let warned = 0;
for (const file of walk(ROOT)) {
  const lines = readFileSync(file, "utf8").split("\n").length;
  if (lines > HARD) {
    console.log(`ROUGE  ${file} — ${lines} lignes (limite dure ${HARD}, a decouper)`);
    failed++;
  } else if (lines > WARN) {
    console.log(`orange ${file} — ${lines} lignes (cible ${WARN}, surveiller)`);
    warned++;
  }
}

if (failed > 0) {
  console.log(`\n❌ ${failed} fichier(s) au-dessus de ${HARD} lignes. A decouper.`);
  process.exit(1);
} else if (warned > 0) {
  console.log(`\n⚠️  ${warned} fichier(s) a surveiller, mais rien de bloquant. Vert.`);
  process.exit(0);
} else {
  console.log("✅ Tous les fichiers tiennent sous la limite. Vert.");
  process.exit(0);
}
