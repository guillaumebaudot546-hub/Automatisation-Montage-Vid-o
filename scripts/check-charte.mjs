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
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const RACINE_HF = "imcp-hyperframes";
const THEME = "src/theme/baudot.ts";
const strict = process.argv.includes("--strict");
const fix = process.argv.includes("--fix");

/** "#49b6c9" -> "73, 182, 201" pour retrouver les usages en rgb()/rgba(). */
const enRgb = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

/** Motif tolerant aux espaces : rgba(216, 199, 168, 0.5) comme rgba(216,199,168,.5) */
const motifRgb = ([r, g, b]) =>
  new RegExp(`\\b${r}\\s*,\\s*${g}\\s*,\\s*${b}\\b`, "g");

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

if (fix) {
  // Une couleur fautive n'est pas seulement dans :root — elle est reprise en
  // rgba() dans les ombres, les fonds et les glows. Remplacer uniquement le
  // bloc :root laisserait la moitie du fichier a l'ancienne palette.
  let total = 0;
  for (const [fichier, liste] of parFichier) {
    let html = readFileSync(fichier, "utf8");
    let n = 0;
    for (const { trouve, attendu } of liste) {
      if (!trouve.startsWith("#")) continue;
      const avantHex = new RegExp(trouve.replace("#", "#"), "gi");
      n += (html.match(avantHex) ?? []).length;
      html = html.replace(avantHex, attendu);

      const rgbAvant = motifRgb(enRgb(trouve));
      const rgbApres = enRgb(attendu).join(", ");
      n += (html.match(rgbAvant) ?? []).length;
      html = html.replace(rgbAvant, rgbApres);
    }
    writeFileSync(fichier, html);
    console.log(`  reharmonise ${fichier} — ${n} remplacement(s)`);
    total += n;
  }
  console.log(
    `\n✅ ${total} remplacement(s) sur ${parFichier.size} composition(s).\n` +
      "   Les .mp4 deja livres ne changent pas ; seuls les prochains rendus.\n" +
      "   Relancer sans --fix pour verifier, puis passer le hook en --strict.\n" +
      "   Annulable : git checkout -- imcp-hyperframes/",
  );
  process.exit(0);
}

if (strict) {
  console.log("❌ Mode strict : ecart de charte bloquant.");
  process.exit(2);
}
console.log(
  "⚠️  Rapport seul. Ces compositions ont deja ete livrees : reharmoniser la\n" +
    "   palette change leur rendu. Lancer avec --fix pour reharmoniser\n" +
    "   (voir decisions/014), puis passer ce script en --strict dans le hook.",
);
process.exit(0);
