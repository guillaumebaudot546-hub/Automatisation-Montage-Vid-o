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
import { ecrireRecu } from "./guard-portail.mjs";

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

  // Rythme et hook — ajoutes le 01/08/2026 apres la capsule 06.
  // Le praticien a recu un montage ou tous les calques tombaient sur les
  // premieres secondes. Le portail ne regardait alors que la duree d'un
  // calque et son debordement : un plan groupe passait sans violation.
  ecartCalquesMinSec:
    nombreDans(praticien.preferences.rythmeCalques, /ecart\s*>=\s*(\d+(?:[.,]\d+)?)\s*s/i) ?? 2.5,
  partPremierTiersMax:
    (nombreDans(praticien.preferences.rythmeCalques, /au plus\s*(\d+)\s*%/i) ?? 50) / 100,
  hookAvantSec:
    nombreDans(praticien.preferences.hookVisuel, /demarre dans les\s*(\d+(?:[.,]\d+)?)\s*s/i) ?? 1.5,
  hookDureeMaxSec:
    nombreDans(praticien.preferences.hookVisuel, /tient\s*<=\s*(\d+(?:[.,]\d+)?)\s*s/i) ?? 3,
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

// Rythme des calques — correction du 01/08/2026.
// Trois defauts distincts, tous invisibles pour les regles precedentes :
// des calques qui se chevauchent, une rafale, et un bloc en ouverture.
{
  const calques = [...(plan.overlays ?? [])].sort((a, b) => a.atSec - b.atSec);

  for (let i = 1; i < calques.length; i++) {
    const precedent = calques[i - 1];
    const courant = calques[i];
    const finPrecedent = precedent.atSec + precedent.durationSec;

    if (courant.atSec < finPrecedent - 0.01) {
      rejet(
        "rythmeCalques",
        `Calques ${precedent.kind} et ${courant.kind} se chevauchent (${courant.atSec}s < ${finPrecedent.toFixed(2)}s) : deux infographies a l'ecran en meme temps, illisible.`,
      );
      continue;
    }

    const ecart = courant.atSec - finPrecedent;
    if (ecart < seuils.ecartCalquesMinSec - 0.01)
      rejet(
        "rythmeCalques",
        `Seulement ${ecart.toFixed(1)}s entre ${precedent.kind} et ${courant.kind} (min ${seuils.ecartCalquesMinSec}s) : effet rafale, l'oeil ne suit pas.`,
      );
  }

  // Un montage dont les calques tombent tous au debut laisse la fin nue.
  //
  // Le hook est exclu du calcul : la regle « hookVisuel » EXIGE qu'il soit dans
  // la premiere seconde et demie. Le compter ici reviendrait a sanctionner ce
  // qu'une autre regle impose — les deux regles se contrediraient sur tout
  // montage conforme.
  const illustratifs = calques.filter((o) => o.atSec > seuils.hookAvantSec + 0.01);
  if (illustratifs.length >= 3 && dureeTotale > 0) {
    const finPremierTiers = dureeTotale / 3;
    const dansLeTiers = illustratifs.filter((o) => o.atSec < finPremierTiers).length;
    const part = dansLeTiers / illustratifs.length;
    if (part > seuils.partPremierTiersMax + 0.01)
      rejet(
        "rythmeCalques",
        `${Math.round(part * 100)}% des calques dans le premier tiers (max ${Math.round(seuils.partPremierTiersMax * 100)}%) : ils arrivent en bloc au debut, le reste de la video retombe a plat.`,
      );
  }
}

// Ancrage des calques sur la parole — correction du 01/08/2026.
//
// Sur la capsule 06, le calque « list » des trois modules etait pose a 2 s
// pour 6 s, alors que le praticien ne les enumere qu'entre 11,3 s et 29,6 s.
// La cascade arrivait donc 18 secondes avant les mots qu'elle illustre, en
// ouverture du monologue : c'est le « bloc au debut » signale par le client.
// La preference « listes en cascade QUAND il les enumere » existait deja ;
// il n'y avait simplement aucune regle pour la verifier.
//
// D'ou le champ « ancre » : le plan declare a quelle seconde de parole le
// calque se rattache, et le portail verifie que le calque est bien a l'ecran
// a ce moment-la. L'IA decide quoi illustrer, le code verifie le quand
// (decision 005).
{
  const ILLUSTRENT_UN_PROPOS = new Set(["list", "chart", "stat"]);
  const parle = (t) =>
    (plan.captions ?? []).some((c) => t >= c.fromSec - TOLERANCE && t <= c.toSec + TOLERANCE);

  for (const o of plan.overlays ?? []) {
    if (!ILLUSTRENT_UN_PROPOS.has(o.kind)) continue;

    if (typeof o.ancre !== "number") {
      rejet(
        "ancrageCalques",
        `Calque ${o.kind} sans « ancre » : indiquer la seconde de parole qu'il illustre. Un ${o.kind} pose au hasard s'affiche avant ou apres les mots concernes.`,
      );
      continue;
    }

    const fin = o.atSec + o.durationSec;
    if (o.ancre < o.atSec - TOLERANCE || o.ancre > fin + TOLERANCE)
      rejet(
        "ancrageCalques",
        `Calque ${o.kind} visible de ${o.atSec}s a ${fin}s mais ancre a ${o.ancre}s : il n'est pas a l'ecran quand le propos est dit.`,
      );

    if (!parle(o.ancre))
      rejet(
        "ancrageCalques",
        `Calque ${o.kind} ancre a ${o.ancre}s, ou personne ne parle : l'ancre designe le moment du propos illustre.`,
      );
  }
}

// Hook visuel — correction du 01/08/2026.
// Les premieres secondes decident si la video est regardee. Un montage sans
// accroche visuelle est un montage qui ne sera pas vu, quelle que soit sa suite.
{
  const calques = plan.overlays ?? [];
  const hook = calques.find((o) => o.atSec <= seuils.hookAvantSec + 0.01);

  if (!hook) {
    rejet(
      "hookVisuel",
      `Aucun calque dans les ${seuils.hookAvantSec} premieres secondes : la video s'ouvre sans accroche.`,
    );
  } else {
    if (hook.durationSec > seuils.hookDureeMaxSec + 0.01)
      rejet(
        "hookVisuel",
        `Le hook ${hook.kind} tient ${hook.durationSec}s (max ${seuils.hookDureeMaxSec}s) : passe ce delai il n'accroche plus, il encombre.`,
      );
    if (hook.kind !== "punch")
      avertit(
        "hookVisuel",
        `Le hook d'ouverture est un calque ${hook.kind} ; « punch » est le format retenu par le praticien pour l'accroche.`,
      );
  }
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

/**
 * Un plan qui passe laisse un recu a cote de lui. guard-portail.mjs le lit
 * avant tout rendu : sans recu couvrant CETTE version du plan, le rendu est
 * refuse. C'est ce qui transforme la REGLE 5 en verrou plutot qu'en consigne.
 */
const valide = () => {
  const recu = ecrireRecu(args[0]);
  console.log(`   recu ecrit — empreinte ${recu.empreinte.slice(0, 12)}…`);
};

if (violations.length === 0) {
  console.log("✅ Aucune violation. Passe au portail ② (juge), puis au Dr Baudot.");
  valide();
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
valide();
exit(0);
