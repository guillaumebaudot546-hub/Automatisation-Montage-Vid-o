// Garde-fou "identite" : les compositions HyperFrames doivent porter la charte
// IMCP, pas une palette recopiee a la main puis derivee de projet en projet.
//
// La source de verite est src/theme/baudot.ts — lue ici, jamais recopiee.
//
// Lancer : npm run check:charte           (rapport, ne bloque pas)
//          npm run check:charte -- --strict  (bloque : exit 2)
//
// Pourquoi ce script existe : au 29/07/2026, les 13 compositions HyperFrames
// utilisaient --champagne:#d8c7a8, c'est-a-dire l'ANCIEN beige que le client a
// explicitement remplace par le cyan #49B6C9. Personne ne l'a vu parce que rien
// ne le verifiait. Voir decisions/014.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const RACINE_HF = "imcp-hyperframes";
const THEME = "src/theme/baudot.ts";
const strict = process.argv.includes("--strict");

/** Extrait la palette officielle depuis le theme, sans la dupliquer ici. */
function charteOfficielle() {
  const src = readFileSync(THEME, "utf8");
  const bloc = src.slice(src.indexOf("color: {"), src.indexOf("font: {"));
  const palette = {};
  for (const [, nom, hex] of bloc.matchAll(/(\w+):\s*"(#[0-9A-Fa-f]{6})"/g)) {
    palette[nom] = hex.toLowerCase();
  }
  return palette;
}

/** Nom du token CSS HyperFrames -> nom du token de la charte. */
const CORRESPONDANCE = {
  bg: "navy950",
  ivory: "ivory",
  slate: "slate",
  champagne: "champagne",
  cream: "cream",
};

/** Tokens libres : effets propres a la video, hors charte de marque. */
const HORS_CHARTE = new Set(["fluo", "amber"]);

function compositions(dir) {
  const out = [];
  let entrees;
  try {
    entrees = readdirSync(dir);
  } catch {
    return out;
  }
  for (const nom of entrees) {
    if (nom === "node_modules" || nom === "renders" || nom === "snapshots") continue;
    const p = join(dir, nom);
    if (statSync(p).isDirectory()) out.push(...compositions(p));
    else if (nom === "index.html") out.push(p);
  }
  return out;
}

const charte = charteOfficielle();
if (Object.keys(charte).length === 0) {
  console.log(`❌ Palette illisible dans ${THEME}. Le garde-fou ne peut pas tourner.`);
  process.exit(1);
}

const ecarts = [];
const fichiers = compositions(RACINE_HF);

for (const fichier of fichiers) {
  const html = readFileSync(fichier, "utf8");
  const root = html.match(/:root\s*\{([^}]*)\}/);
  if (!root) {
    ecarts.push({ fichier, token: "(aucun)", trouve: "-", attendu: "un bloc :root" });
    continue;
  }
  for (const [, token, hex] of root[1].matchAll(/--([\w-]+)\s*:\s*(#[0-9A-Fa-f]{3,8})/g)) {
    if (HORS_CHARTE.has(token)) continue;
    const cible = CORRESPONDANCE[token];
    if (!cible) continue;
    const attendu = charte[cible];
    if (attendu && hex.toLowerCase() !== attendu) {
      ecarts.push({ fichier, token: `--${token}`, trouve: hex.toLowerCase(), attendu });
    }
  }
}

console.log(`Charte IMCP (source : ${THEME})`);
for (const [nom, hex] of Object.entries(charte)) console.log(`  ${nom.padEnd(10)} ${hex}`);
console.log(`\n${fichiers.length} composition(s) HyperFrames analysee(s).\n`);

if (ecarts.length === 0) {
  console.log("✅ Toutes les compositions portent la charte. Vert.");
  process.exit(0);
}

const parFichier = new Map();
for (const e of ecarts) {
  if (!parFichier.has(e.fichier)) parFichier.set(e.fichier, []);
  parFichier.get(e.fichier).push(e);
}
for (const [fichier, liste] of parFichier) {
  console.log(fichier);
  for (const e of liste) {
    console.log(`   ${e.token.padEnd(13)} ${e.trouve}  →  attendu ${e.attendu}`);
  }
}

console.log(`\n${ecarts.length} ecart(s) de charte sur ${parFichier.size} composition(s).`);

if (strict) {
  console.log("❌ Mode strict : ecart de charte bloquant.");
  process.exit(2);
}
console.log(
  "⚠️  Rapport seul. Ces compositions ont deja ete livrees : reharmoniser la\n" +
    "   palette change leur rendu. Decision a prendre (voir decisions/014), puis\n" +
    "   passer ce script en --strict dans le hook pour figer le resultat.",
);
process.exit(0);
