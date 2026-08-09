// Lecture de la palette d'un praticien depuis src/theme/<nom>.ts.
//
// POURQUOI CE FICHIER EXISTE.
// Deux scripts ont besoin des couleurs : le generateur de composition
// (capsule-build.mjs) et le preparateur de medias (capsule-media.mjs, qui
// remplit le cadre avec le navy de la charte). Recopier la palette dans l'un
// des deux, c'est creer une seconde source de verite — exactement ce que la
// REGLE 4bis interdit. Ils lisent donc tous les deux le meme fichier de theme,
// par ici.
//
// La charte reste verrouillee dans src/theme/ : ce module ne fait que la lire.
import { readFileSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Palette officielle d'un praticien.
 * @param {string} nom  nom du theme, ex. "client-01"
 * @returns {Record<string,string>} couleurs en #rrggbb minuscules
 */
export function charte(nom) {
  const chemin = join(ROOT, "src", "theme", `${nom}.ts`);
  if (!existsSync(chemin)) {
    console.error(`❌ Charte introuvable : ${chemin}`);
    console.error("   Un praticien = un theme. Creer le fichier avant de generer.");
    process.exit(1);
  }
  const src = readFileSync(chemin, "utf8").replace(/^﻿/, "");
  const debut = src.indexOf("color: {");
  const bloc = src.slice(debut, src.indexOf("}", debut));
  const p = {};
  for (const m of bloc.matchAll(/(\w+):\s*"(#[0-9a-fA-F]{6})"/g)) p[m[1]] = m[2].toLowerCase();
  return p;
}
