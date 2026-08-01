// Genere index.html en injectant le bloc de polices auto-hebergees (142 Ko de
// base64) dans le gabarit. Le gabarit reste lisible ; le HTML final est
// autonome et rend a l'identique sans reseau ni police systeme.
//
//   node build.mjs
//
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ici = dirname(fileURLToPath(import.meta.url));
const gabarit = readFileSync(join(ici, "_source", "template.html"), "utf8");
const polices = readFileSync(join(ici, "_source", "_fonts.css"), "utf8");

if (!gabarit.includes("/* @POLICES@ */")) {
  console.error("Marqueur /* @POLICES@ */ absent du gabarit.");
  process.exit(1);
}

const html = gabarit.replace("/* @POLICES@ */", polices);
writeFileSync(join(ici, "index.html"), html, "utf8");
console.log(`index.html genere — ${Math.round(html.length / 1024)} Ko`);
