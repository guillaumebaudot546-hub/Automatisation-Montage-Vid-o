// Socle : une seule version de CLI, un seul logo de reference.
//
//   npm run socle:sync     aligne les projets sur le socle
//   npm run socle:check    signale toute divergence (exit 2)
//
// Pourquoi copier le logo plutot que le referencer en ../../_socle/ :
// chaque composition HyperFrames est rendue depuis SON dossier, et un chemin
// remontant hors du projet n'est pas garanti d'etre resolu par le renderer.
// Casser le rendu de 13 videos livrees pour economiser 2,5 Mo que git
// deduplique deja serait un mauvais echange. Le socle reste la source unique :
// on edite _socle/assets/, on synchronise, et le check attrape les derives.
import { readFileSync, writeFileSync, copyFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";

const RACINE = "imcp-hyperframes";
const ASSETS = join(RACINE, "_socle", "assets");
const VERSION_CIBLE = "0.7.77"; // la plus recente deja eprouvee sur ce contenu
const verifie = process.argv.includes("--check");

const md5 = (p) => createHash("md5").update(readFileSync(p)).digest("hex");

/** Tout dossier de projet HyperFrames : il a un package.json ET un index.html. */
function projets(dir, out = []) {
  for (const nom of readdirSync(dir)) {
    if (["node_modules", "renders", "snapshots", ".hyperframes", "_socle"].includes(nom)) continue;
    const p = join(dir, nom);
    if (!statSync(p).isDirectory()) continue;
    if (existsSync(join(p, "package.json")) && existsSync(join(p, "index.html"))) out.push(p);
    else projets(p, out);
  }
  return out;
}

const liste = projets(RACINE);
const ecarts = [];
let corriges = 0;

for (const projet of liste) {
  // --- Version de CLI ---
  const pkgPath = join(projet, "package.json");
  const pkgBrut = readFileSync(pkgPath, "utf8");
  const versions = [...pkgBrut.matchAll(/hyperframes@([\d.]+)/g)].map((m) => m[1]);
  const divergentes = [...new Set(versions)].filter((v) => v !== VERSION_CIBLE);

  if (divergentes.length > 0) {
    if (verifie) {
      ecarts.push(`${projet} — CLI ${divergentes.join(", ")} au lieu de ${VERSION_CIBLE}`);
    } else {
      writeFileSync(pkgPath, pkgBrut.replace(/hyperframes@[\d.]+/g, `hyperframes@${VERSION_CIBLE}`));
      console.log(`→ ${projet} — CLI ${divergentes.join(", ")} → ${VERSION_CIBLE}`);
      corriges++;
    }
  }

  // --- Assets de reference ---
  if (!existsSync(ASSETS)) continue;
  for (const asset of readdirSync(ASSETS)) {
    const source = join(ASSETS, asset);
    const cible = join(projet, asset);
    if (!existsSync(cible)) continue; // le projet n'utilise pas cet asset
    if (md5(source) === md5(cible)) continue;
    if (verifie) {
      ecarts.push(`${projet} — ${asset} differe du socle`);
    } else {
      copyFileSync(source, cible);
      console.log(`→ ${projet} — ${asset} resynchronise`);
      corriges++;
    }
  }
}

console.log(`\n${liste.length} projet(s) HyperFrames inspecte(s).`);

if (verifie) {
  if (ecarts.length === 0) {
    console.log("✅ Version de CLI et assets alignes sur le socle. Vert.");
    process.exit(0);
  }
  for (const e of ecarts) console.log(`  ${e}`);
  console.log(`\n❌ ${ecarts.length} divergence(s). Lancer npm run socle:sync.`);
  process.exit(2);
}

console.log(
  corriges === 0
    ? "✅ Rien a corriger, tout etait deja aligne."
    : `✅ ${corriges} correction(s) appliquee(s).`,
);
