// Cale les sous-titres d'une capsule sur sa voix off.
//
//   npm run capsule:soustitres -- <projet>          cale le texte du contrat
//   npm run capsule:soustitres -- <projet> --verifie  controle sans ecrire
//
// POURQUOI CE SCRIPT EXISTE (09/08/2026).
//
// LE TEXTE VIENT DU CONTRAT. LES REPERES VIENNENT DE L'AUDIO. Jamais l'inverse.
//
// La tentation est d'utiliser la transcription telle quelle : elle a le texte ET
// les reperes, en un seul appel. Sur cette video, la transcription a rendu
// « pre-prostatic surgery » pour « pre-prosthetic surgery », et « the area
// glazer » pour « Er-YAG laser ». Une video medicale qui affiche « prostatic »
// sur une intervention parodontale n'est pas une video imparfaite : c'est une
// faute que le praticien porte a son nom.
//
// Le texte prononce, lui, est connu — c'est celui qu'on a fait dire a la voix.
// Il fait autorite. La transcription ne sert qu'a repondre a une seule question,
// pour laquelle elle est excellente : QUAND cette phrase est-elle dite ?
//
// D'ou l'alignement ci-dessous : on rapproche chaque replique declaree du
// segment transcrit qui lui ressemble le plus, et on ne garde du segment que
// son debut et sa fin.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const verifie = args.includes("--verifie");
const projet = args.find((a) => !a.startsWith("--"));

if (!projet) {
  console.error("Usage : node scripts/capsule-soustitres.mjs <projet> [--verifie]");
  process.exit(1);
}
const contrat = join(projet, "capsule.json");
if (!existsSync(contrat)) {
  console.error(`❌ ${contrat} introuvable.`);
  process.exit(1);
}
const cap = JSON.parse(readFileSync(contrat, "utf8").replace(/^﻿/, ""));

const v = cap.voix;
if (!v?.fichier) {
  console.log("= pas de voix off : rien a caler.");
  process.exit(0);
}
if (!Array.isArray(v.sousTitres) || v.sousTitres.length === 0) {
  console.error(
    "❌ La voix n'a pas de « sousTitres ». Ecris d'abord le texte des repliques\n" +
      "   (celui que la voix prononce) ; ce script leur donne leurs reperes.",
  );
  process.exit(1);
}

/* --- Transcription : uniquement pour les reperes -------------------------- */
const audio = join(projet, v.fichier);
if (!existsSync(audio)) {
  console.error(`❌ Voix off introuvable : ${v.fichier}`);
  process.exit(1);
}

const sortie = join(projet, ".soustitres-reperes.json");
const py = spawnSync(
  "python3",
  [join(ROOT, "scripts", "transcrire.py"), audio, "-o", sortie,
   ...(v.langue ? ["--langue", v.langue] : [])],
  { encoding: "utf8" },
);
if (py.status !== 0 || !existsSync(sortie)) {
  console.error("❌ Transcription impossible — les reperes ne peuvent pas etre calcules.");
  console.error((py.stderr || py.stdout || "").trim().split("\n").slice(-4).join("\n"));
  process.exit(1);
}
const segments = JSON.parse(readFileSync(sortie, "utf8"));

/* --- Alignement ------------------------------------------------------------ */

/** Mots comparables : sans balisage, sans ponctuation, sans casse. */
const mots = (s) =>
  String(s || "")
    .replace(/\*+/g, " ")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

/**
 * Ressemblance entre deux phrases, de 0 a 1 : part des mots communs.
 *
 * Volontairement grossier. On ne cherche pas a juger une traduction — juste a
 * savoir quel segment audio correspond a quelle replique. Meme quand la
 * transcription ecrit « prostatic » pour « prosthetic », les autres mots de la
 * phrase suffisent largement a la reconnaitre.
 */
function ressemblance(a, b) {
  const A = mots(a);
  const B = new Set(mots(b));
  if (!A.length) return 0;
  return A.filter((m) => B.has(m)).length / A.length;
}

const cues = v.sousTitres;
const cales = [];
let curseur = 0;
let faibles = 0;

for (const [i, c] of cues.entries()) {
  // On avance dans l'audio : une replique ne peut pas etre dite avant la
  // precedente. Cette contrainte d'ordre evite qu'une phrase courte se colle
  // au mauvais endroit parce qu'elle ressemble a une autre.
  let meilleur = -1;
  let score = 0;
  for (let j = curseur; j < segments.length; j++) {
    const s = ressemblance(c.t, segments[j].t);
    if (s > score) { score = s; meilleur = j; }
  }
  if (meilleur < 0) {
    console.error(`❌ Replique ${i + 1} : aucun segment audio disponible apres le precedent.`);
    process.exit(1);
  }
  if (score < 0.34) faibles++;

  // Un segment peut porter plusieurs repliques, et l'inverse : on prend le
  // segment retenu, et on etend jusqu'au suivant si la replique deborde.
  cales.push({ s: segments[meilleur].s, e: segments[meilleur].e, t: c.t, _score: score });
  curseur = meilleur + 1;
}

/* Deux repliques ne doivent jamais etre affichees ensemble : elles sont posees
   au meme endroit a l'ecran. On coupe la precedente avant que la suivante
   n'arrive (le fondu du socle prend 0,14 s). */
for (let i = 0; i < cales.length - 1; i++) {
  const marge = 0.16;
  if (cales[i].e > cales[i + 1].s - marge) {
    cales[i].e = Math.max(cales[i].s + 0.3, cales[i + 1].s - marge);
  }
}

const arrondi = cales.map((c) => ({
  s: Math.round(c.s * 100) / 100,
  e: Math.round(c.e * 100) / 100,
  t: c.t,
}));

console.log(`Alignement de ${cues.length} replique(s) sur ${segments.length} segment(s) :`);
for (const [i, c] of arrondi.entries()) {
  const sc = cales[i]._score;
  const marque = sc < 0.34 ? "  ⚠ ressemblance faible" : "";
  console.log(`  ${String(i + 1).padStart(2)}. ${c.s.toFixed(2)}s → ${c.e.toFixed(2)}s  ${c.t.slice(0, 46)}${marque}`);
}

if (faibles) {
  console.log(
    `\n⚠️  ${faibles} replique(s) mal reconnue(s) dans l'audio. Verifie que le texte\n` +
      "   des sous-titres est bien celui que la voix prononce.",
  );
}

if (verifie) {
  const identique = JSON.stringify(v.sousTitres.map(({ s, e, t }) => ({ s, e, t })))
    === JSON.stringify(arrondi);
  console.log(identique ? "\n= reperes a jour." : "\n≠ reperes a recalculer.");
  process.exit(identique ? 0 : 2);
}

v.sousTitres = arrondi;
writeFileSync(contrat, `${JSON.stringify(cap, null, 2)}\n`, "utf8");
console.log(`\n→ reperes ecrits dans ${contrat}`);
console.log(`   Etape suivante : npm run portail:capsule -- ${projet}`);
