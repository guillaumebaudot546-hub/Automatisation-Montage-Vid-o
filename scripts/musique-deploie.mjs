// Deploie sur le VPS les lits musicaux dont les droits sont etablis.
//
//   npm run musique:deploie            envoie les pistes « libre »
//   npm run musique:deploie -- --liste  montre le catalogue, n'envoie rien
//
// POURQUOI CE SCRIPT PLUTOT QU'UN scp DU DOSSIER (09/08/2026).
//
// Le dossier public/music contenait `concerto.mp3`. Ce fichier est, octet pour
// octet, l'enregistrement Saint-Preux depose a la SACEM — renomme. Copier le
// dossier entier l'aurait pose sur le serveur, dans le catalogue que l'agent
// propose au praticien, et de la dans une video publiee par un cabinet.
//
// Le probleme n'est pas qu'on ait failli le faire : c'est qu'un `scp -r` ne
// peut pas le savoir. Ce script, lui, lit le catalogue et refuse tout ce dont
// la provenance n'est pas ecrite. Une piste sans licence etablie n'est pas
// « probablement bonne » : elle ne part pas.
import { readFileSync, existsSync } from "node:fs";
import { join, dirname, resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CATALOGUE = join(ROOT, "musique", "CATALOGUE.json");
const VPS = process.env.IMCP_VPS || "guillaume@78.47.14.178";
const DISTANT = process.env.IMCP_VPS_MUSIQUE || "/home/guillaume/imcp/public/music";

const liste = process.argv.includes("--liste");

if (!existsSync(CATALOGUE)) {
  console.error(`❌ Catalogue introuvable : ${CATALOGUE}`);
  process.exit(1);
}
const cat = JSON.parse(readFileSync(CATALOGUE, "utf8").replace(/^﻿/, ""));

const empreinte = (p) =>
  createHash("md5").update(readFileSync(p)).digest("hex").slice(0, 16);

const libres = [];
const bloquees = [];
let alerte = 0;

for (const p of cat.pistes) {
  const chemin = join(ROOT, p.fichier);
  const existe = existsSync(chemin);

  if (p.statut === "interdit") {
    bloquees.push(p);
    // Une piste interdite qui trainerait encore dans les assets est un risque
    // vivant : elle peut etre choisie a la main par quelqu'un qui ignore
    // l'histoire. On le dit fort, a chaque passage.
    if (existe) {
      console.error(`⛔ ${p.fichier} — INTERDIT, et toujours present dans le depot.`);
      console.error(`   ${p.licence}`);
      alerte++;
    }
    continue;
  }

  if (p.statut !== "libre") {
    bloquees.push(p);
    continue;
  }

  if (!existe) {
    console.error(`❌ ${p.id} : declaree « libre » mais le fichier manque — ${p.fichier}`);
    process.exit(1);
  }

  // Verrou anti-renommage : si une piste libre porte l'empreinte d'une piste
  // interdite, c'est le meme enregistrement sous un autre nom.
  const e = empreinte(chemin);
  const usurpe = cat.pistes.find((q) => q.statut === "interdit" && q.empreinte === e);
  if (usurpe) {
    console.error(`⛔ ${p.fichier} porte l'empreinte de « ${usurpe.id} » (${e}).`);
    console.error("   C'est le meme enregistrement sous un autre nom. Deploiement interrompu.");
    process.exit(1);
  }
  libres.push({ ...p, chemin, e });
}

console.log(`Catalogue musical — ${cat.pistes.length} piste(s)\n`);
console.log("Proposables au praticien :");
for (const p of libres) {
  console.log(`  ♪ ${p.etiquette}`);
  console.log(`     ${basename(p.fichier)} · ${p.dureeSec ?? "?"}s · ${p.intensite ?? "-"}`);
  console.log(`     ${p.pourQuoi ?? ""}`);
}
if (bloquees.length) {
  console.log("\nEcartees :");
  for (const p of bloquees) {
    const t = p.statut === "interdit" ? "INTERDIT" : "a verifier";
    console.log(`  ✗ ${basename(p.fichier)} — ${t}`);
  }
}

if (liste) {
  console.log(`\n(--liste : rien n'a ete envoye)`);
  process.exit(alerte ? 1 : 0);
}

if (!libres.length) {
  console.error("\n❌ Aucune piste libre : rien a deployer.");
  process.exit(1);
}

console.log(`\nEnvoi de ${libres.length} piste(s) vers ${VPS}:${DISTANT}`);
spawnSync("ssh", ["-o", "ConnectTimeout=10", VPS, `mkdir -p ${DISTANT}`], { encoding: "utf8" });
for (const p of libres) {
  const r = spawnSync("scp", ["-q", "-o", "ConnectTimeout=10", p.chemin,
    `${VPS}:${DISTANT}/${basename(p.fichier)}`], { encoding: "utf8" });
  if (r.status !== 0) {
    console.error(`❌ envoi echoue : ${p.fichier}\n${r.stderr}`);
    process.exit(1);
  }
  console.log(`  ✓ ${basename(p.fichier)}`);
}

// Le catalogue part aussi : c'est lui que l'agent lit pour proposer, et le
// portail pour verifier. Sans lui, les fichiers sur le serveur n'ont pas de
// provenance — on serait revenu au point de depart.
const rc = spawnSync("scp", ["-q", "-o", "ConnectTimeout=10", CATALOGUE,
  `${VPS}:${resolve(DISTANT, "..", "..").replace(/\\/g, "/")}/musique/CATALOGUE.json`],
  { encoding: "utf8" });
if (rc.status !== 0) {
  spawnSync("ssh", ["-o", "ConnectTimeout=10", VPS, "mkdir -p /home/guillaume/imcp/musique"], { encoding: "utf8" });
  spawnSync("scp", ["-q", "-o", "ConnectTimeout=10", CATALOGUE,
    `${VPS}:/home/guillaume/imcp/musique/CATALOGUE.json`], { encoding: "utf8" });
}
console.log("  ✓ CATALOGUE.json");

console.log("\n✅ Deploiement termine.");
if (alerte) {
  console.log(`\n⚠️  ${alerte} piste(s) interdite(s) sont encore dans le depot local.`);
  console.log("   Elles ne sont pas parties sur le serveur, mais elles restent a portee de main.");
}
process.exit(0);
