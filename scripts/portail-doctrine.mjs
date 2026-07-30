// Portail ① de la boucle auto-critique (decision 006), en ligne de commande.
//
// L'agent propose un plan de montage -> ce portail le juge SANS appel API ->
// s'il rejette, l'agent refait, dans la limite de K=3 essais. Ce qui passe va
// au portail ② (juge, sous-agent) puis au Dr Baudot, seul oracle du gout.
//
// Usage :
//   node scripts/portail-doctrine.mjs <plan.json> [cues.json] [--praticien baudot]
//
// Le plan attendu :
//   { "format": "9:16", "reseau": "instagram reels",
//     "spans": [{"fromSec":0,"toSec":14}],
//     "crossfades": [0.2],
//     "overlays": [{"atSec":2,"durationSec":4,"kind":"stat"}],
//     "captions": [{"fromSec":0,"toSec":2,"text":"..."}] }
//
// Sortie 0 = passe (avertissements possibles). Sortie 3 = rejet.
// Pourquoi 3 et pas 1 : un rejet du portail n'est pas un plantage du script,
// c'est un verdict. Le code distingue les deux.
import { readFileSync } from "node:fs";
import { argv, exit } from "node:process";

const args = argv.slice(2).filter((a) => !a.startsWith("--"));
const iPraticien = argv.indexOf("--praticien");
const praticienNom = iPraticien > -1 ? argv[iPraticien + 1] : "baudot";

if (args.length === 0) {
  console.error("Usage : node scripts/portail-doctrine.mjs <plan.json> [cues.json]");
  exit(1);
}

// PowerShell et plusieurs editeurs Windows ecrivent un BOM en tete : JSON.parse
// le refuse. On le retire avant de parser plutot que d'exiger des fichiers
// parfaits — le pipeline recevra des fichiers produits par d'autres outils.
const lire = (p) => JSON.parse(readFileSync(p, "utf8").replace(/^﻿/, ""));

const plan = lire(args[0]);
const cues = args[1] ? lire(args[1]) : [];
const praticien = lire(`praticiens/${praticienNom}.json`);

// Seuils : defauts de la doctrine, ecrases par les preferences chiffrees.
const nombreDans = (texte, motif) => {
  const m = texte?.match(motif);
  return m ? Number(m[1].replace(",", ".")) : undefined;
};
const seuils = {
  dureeInfographieMaxSec:
    nombreDans(praticien.preferences.dureeInfographies, /≤\s*\d+(?:[.,]\d+)?\s*-\s*(\d+(?:[.,]\d+)?)\s*s/) ?? 6,
  coupuresVoixMax: 1,
  crossfadeMinSec: 0.15,
  volumeMusique: nombreDans(praticien.preferences.musique, /volume\s*~?\s*(\d+[.,]\d+)/) ?? 0.08,
};

const TOLERANCE = 0.25;
const proche = (a, b) => Math.abs(a - b) <= TOLERANCE;
const FORMAT_ATTENDU = {
  reels: "9:16", instagram: "9:16", tiktok: "9:16", shorts: "9:16",
  youtube: "16:9", site: "16:9", linkedin: "16:9", feed: "1:1",
};
const INFOGRAPHIES = new Set(["stat", "chart", "site", "list", "punch"]);

const violations = [];
const rejet = (regle, message) => violations.push({ regle, gravite: "rejet", message });
const avertit = (regle, message) => violations.push({ regle, gravite: "avertissement", message });

const spans = plan.spans ?? [];
const dureeVoix = spans.reduce((a, s) => a + (s.toSec - s.fromSec), 0);
const dureeTotale = plan.dureeTotaleSec ?? dureeVoix;

// RÈGLE 0 — la voix n'est jamais hachee
if (spans.length === 0) rejet("0", "Aucun passage de voix retenu.");
if (cues.length > 0) {
  const debuts = cues.map((c) => c.s);
  const fins = cues.map((c) => c.e);
  const surFrontiere = (t) => debuts.some((d) => proche(d, t)) || fins.some((f) => proche(f, t));
  spans.forEach((s, i) => {
    if (!surFrontiere(s.fromSec))
      rejet("0", `Span ${i + 1} : debut a ${s.fromSec}s hors frontiere de phrase — la voix serait coupee en cours de mot.`);
    if (!surFrontiere(s.toSec))
      rejet("0", `Span ${i + 1} : fin a ${s.toSec}s hors frontiere de phrase.`);
  });
}
const coupures = Math.max(0, spans.length - 1);
if (coupures > seuils.coupuresVoixMax)
  rejet("0", `${spans.length} passages assembles (${coupures} coupures, max ${seuils.coupuresVoixMax}) — sonne decousu meme en phrases entieres.`);
for (let i = 0; i < coupures; i++) {
  const f = plan.crossfades?.[i] ?? 0;
  if (f < seuils.crossfadeMinSec)
    rejet("0", `Jonction ${i + 1}→${i + 2} : fondu de ${f}s (min ${seuils.crossfadeMinSec}s) — un cut sec entre deux prises est audible.`);
}

// RÈGLE 3 — le format suit le reseau
if (plan.reseau) {
  const cle = Object.keys(FORMAT_ATTENDU).find((k) => plan.reseau.toLowerCase().includes(k));
  if (cle && plan.format !== FORMAT_ATTENDU[cle])
    rejet("3", `Format ${plan.format} pour « ${plan.reseau} » : ${FORMAT_ATTENDU[cle]} attendu.`);
}

// Calques
for (const o of plan.overlays ?? []) {
  if (o.atSec + o.durationSec > dureeTotale + 0.01)
    rejet("calques", `Calque ${o.kind} a ${o.atSec}s+${o.durationSec}s depasse la fin (${dureeTotale}s) : invisible, sans erreur.`);
  if (INFOGRAPHIES.has(o.kind) && o.durationSec > seuils.dureeInfographieMaxSec)
    avertit("dureeInfographies", `Calque ${o.kind} tient ${o.durationSec}s (max ${seuils.dureeInfographieMaxSec}s).`);
}

// Sous-titres — transcription integrale
if (dureeVoix > 0) {
  const couv = (plan.captions ?? []).reduce((a, c) => a + (c.toSec - c.fromSec), 0) / dureeVoix;
  if (couv < 0.8)
    rejet("sousTitres", `Sous-titres sur ${Math.round(couv * 100)}% de la voix — la preference exige la transcription integrale.`);
}

const rejets = violations.filter((v) => v.gravite === "rejet");

console.log(`Portail doctrine — ${praticien.praticien}`);
console.log(`  seuils : infographie ≤ ${seuils.dureeInfographieMaxSec}s, coupures ≤ ${seuils.coupuresVoixMax}, fondu ≥ ${seuils.crossfadeMinSec}s\n`);

if (violations.length === 0) {
  console.log("✅ Aucune violation. Passe au portail ② (juge), puis au Dr Baudot.");
  exit(0);
}
for (const v of violations) {
  console.log(`${v.gravite === "rejet" ? "❌ REJET" : "⚠️  note "}  [RÈGLE ${v.regle}] ${v.message}`);
}
if (rejets.length > 0) {
  console.log(`\n${rejets.length} rejet(s). Refaire le plan — plafond 3 essais (decision 006).`);
  exit(3);
}
console.log("\n✅ Passe malgre les avertissements ci-dessus.");
exit(0);
