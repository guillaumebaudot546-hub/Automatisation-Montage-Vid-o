// Portail ① de la boucle auto-critique (decision 006), en ligne de commande.
//
// L'agent propose un plan de montage -> ce portail le juge SANS appel API ->
// s'il rejette, l'agent refait, dans la limite de K=3 essais. Ce qui passe va
// au portail ② (juge, sous-agent) puis au Dr Baudot, seul oracle du gout.
//
// Usage :
//   node scripts/portail-doctrine.mjs <plan.json> [cues.json] [--praticien client-01]
//
// Appelable depuis n'importe quel dossier : la fiche praticien se resout depuis
// l'emplacement de ce script, pas depuis le dossier courant.
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
//
// SOURCE UNIQUE (04/08/2026). Ce fichier etait double : src/lib/portail-doctrine.ts
// portait les memes regles et recevait TOUS les tests, pendant que cette
// version-ci — la seule deployee sur le VPS — n'en recevait aucun. Les deux
// avaient deja diverge : l'ecriture du recu et la sortie 3 n'existaient que
// dans le fichier non teste. Les regles vivent desormais ici, exportees et
// testees ; le CLI n'est plus qu'une enveloppe autour d'elles.
import { readFileSync, existsSync } from "node:fs";
import { argv, exit } from "node:process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ecrireRecu } from "./guard-portail.mjs";

/** Tolerance d'alignement d'une coupe sur une frontiere de phrase, en secondes. */
export const TOLERANCE = 0.25;

/** Reseaux -> format attendu (RÈGLE 3). */
export const FORMAT_ATTENDU = {
  reels: "9:16", instagram: "9:16", tiktok: "9:16", shorts: "9:16",
  youtube: "16:9", site: "16:9", linkedin: "16:9", feed: "1:1",
};

/** Calques dont la duree est bornee : on les lit, on ne les contemple pas. */
const INFOGRAPHIES = new Set(["stat", "chart", "site", "list", "punch"]);

const proche = (a, b) => Math.abs(a - b) <= TOLERANCE;

const nombreDans = (texte, motif) => {
  const m = texte?.match(motif);
  return m ? Number(m[1].replace(",", ".")) : undefined;
};

/**
 * Seuils applicables : defauts de la doctrine, ecrases par les preferences
 * chiffrees du praticien. Les preferences sont en prose — on n'en extrait que
 * ce qui est chiffre et sans ambiguite.
 */
export const seuilsDe = (praticien) => ({
  dureeInfographieMaxSec:
    nombreDans(
      praticien.preferences.dureeInfographies,
      /≤\s*\d+(?:[.,]\d+)?\s*-\s*(\d+(?:[.,]\d+)?)\s*s/,
    ) ?? 6,
  coupuresVoixMax: 1,
  crossfadeMinSec: 0.15,
  volumeMusique: nombreDans(praticien.preferences.musique, /volume\s*~?\s*(\d+[.,]\d+)/) ?? 0.08,
});

/**
 * RÈGLE 0 — la voix n'est jamais hachee.
 * Deux fautes distinctes : couper au milieu d'une phrase, et raccorder deux
 * passages eloignes par un cut sec.
 */
export const verifieVoix = (plan, cues, seuils) => {
  const v = [];
  const rejet = (message) => v.push({ regle: "0", gravite: "rejet", message });
  const spans = plan.spans ?? [];

  if (spans.length === 0) rejet("Aucun passage de voix retenu.");

  if (cues.length > 0) {
    const debuts = cues.map((c) => c.s);
    const fins = cues.map((c) => c.e);
    const surFrontiere = (t) => debuts.some((d) => proche(d, t)) || fins.some((f) => proche(f, t));
    spans.forEach((s, i) => {
      if (!surFrontiere(s.fromSec))
        rejet(`Span ${i + 1} : debut a ${s.fromSec}s hors frontiere de phrase — la voix serait coupee en cours de mot.`);
      if (!surFrontiere(s.toSec))
        rejet(`Span ${i + 1} : fin a ${s.toSec}s hors frontiere de phrase.`);
    });
  }

  const coupures = Math.max(0, spans.length - 1);
  if (coupures > seuils.coupuresVoixMax)
    rejet(`${spans.length} passages assembles (${coupures} coupures, max ${seuils.coupuresVoixMax}) — sonne decousu meme en phrases entieres.`);

  for (let i = 0; i < coupures; i++) {
    const f = plan.crossfades?.[i] ?? 0;
    if (f < seuils.crossfadeMinSec)
      rejet(`Jonction ${i + 1}→${i + 2} : fondu de ${f}s (min ${seuils.crossfadeMinSec}s) — un cut sec entre deux prises est audible.`);
  }
  return v;
};

/** RÈGLE 3 — le format est un parametre, choisi selon le reseau cible. */
export const verifieFormat = (plan) => {
  if (!plan.reseau) return [];
  const cle = Object.keys(FORMAT_ATTENDU).find((k) => plan.reseau.toLowerCase().includes(k));
  if (!cle || plan.format === FORMAT_ATTENDU[cle]) return [];
  return [
    {
      regle: "3",
      gravite: "rejet",
      message: `Format ${plan.format} pour « ${plan.reseau} » : ${FORMAT_ATTENDU[cle]} attendu.`,
    },
  ];
};

/** Calques : bornes dans le temps de la video, et jamais contemplatifs. */
export const verifieCalques = (plan, dureeTotaleSec, seuils) => {
  const v = [];
  for (const o of plan.overlays ?? []) {
    if (o.atSec + o.durationSec > dureeTotaleSec + 0.01)
      v.push({
        regle: "calques",
        gravite: "rejet",
        message: `Calque ${o.kind} a ${o.atSec}s+${o.durationSec}s depasse la fin (${dureeTotaleSec}s) : invisible, sans erreur.`,
      });
    if (INFOGRAPHIES.has(o.kind) && o.durationSec > seuils.dureeInfographieMaxSec)
      v.push({
        regle: "dureeInfographies",
        gravite: "avertissement",
        message: `Calque ${o.kind} tient ${o.durationSec}s (max ${seuils.dureeInfographieMaxSec}s).`,
      });
  }
  return v;
};

/** Preference sousTitres — transcription integrale, pas un resume. */
export const verifieSousTitres = (plan) => {
  const voixSec = (plan.spans ?? []).reduce((a, s) => a + (s.toSec - s.fromSec), 0);
  if (voixSec <= 0) return [];
  const couv = (plan.captions ?? []).reduce((a, c) => a + (c.toSec - c.fromSec), 0) / voixSec;
  if (couv >= 0.8) return [];
  return [
    {
      regle: "sousTitres",
      gravite: "rejet",
      message: `Sous-titres sur ${Math.round(couv * 100)}% de la voix — la preference exige la transcription integrale.`,
    },
  ];
};

/** Le portail complet. Passe si aucune violation de gravite « rejet ». */
export const portailDoctrine = (plan, cues, seuils, dureeTotaleSec) => {
  const violations = [
    ...verifieVoix(plan, cues, seuils),
    ...verifieFormat(plan),
    ...verifieCalques(plan, dureeTotaleSec, seuils),
    ...verifieSousTitres(plan),
  ];
  return { passe: violations.every((x) => x.gravite !== "rejet"), violations };
};

/** Duree de reference du plan : declaree, sinon somme des passages de voix. */
export const dureeTotaleDe = (plan) =>
  plan.dureeTotaleSec ?? (plan.spans ?? []).reduce((a, s) => a + (s.toSec - s.fromSec), 0);

// --- A partir d'ici : le CLI ------------------------------------------------
//
// La garde compare des chemins resolus plutot que des chaines : un chemin
// contenant un espace ne produit pas la meme URL que `file://${argv[1]}`, et
// le CLI se desactiverait alors en silence.
const appelDirect =
  argv[1] && resolve(argv[1]) === resolve(fileURLToPath(import.meta.url));

if (appelDirect) {
  // On retire l'option ET sa valeur. Le filtre precedent ne coupait que ce qui
  // commence par « -- » : « --praticien baudot » laissait « baudot » dans les
  // positionnels, ou il etait lu comme cues.json. L'option documentee dans la
  // ligne d'usage ci-dessus n'a donc jamais pu servir — elle plantait sur un
  // ENOENT nommant un fichier que personne n'avait demande.
  const brut = argv.slice(2);
  const iPraticien = brut.indexOf("--praticien");
  const praticienNom = iPraticien > -1 ? brut[iPraticien + 1] : "client-01";
  // iPraticien vaut -1 quand l'option est absente : sans ce garde, « -1 + 1 »
  // vaut 0 et le PREMIER argument — le plan — disparaissait.
  const iValeur = iPraticien > -1 ? iPraticien + 1 : -1;
  const args = brut.filter((a, i) => !a.startsWith("--") && i !== iValeur);

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

  // Le fichier praticien se resout depuis l'EMPLACEMENT DU SCRIPT, pas depuis
  // le dossier courant. L'agent travaille dans le dossier de la video
  // (imcp-hyperframes/videos/xxx/) : un chemin relatif au cwd y pointait dans
  // le vide et le portail mourait sur un ENOENT brut, sans dire lequel des deux
  // fichiers manquait. Constate le 09/08/2026 sur le VPS — le wrapper
  // /usr/local/bin/portail-doctrine masquait le defaut en faisant un cd, si
  // bien que la voie documentee marchait et l'appel direct non.
  const cheminPraticien = resolve(
    fileURLToPath(import.meta.url), "..", "..", "praticiens", `${praticienNom}.json`,
  );
  if (!existsSync(cheminPraticien)) {
    console.error(
      `Fiche praticien introuvable : ${cheminPraticien}\n` +
        `Verifier le nom passe a --praticien (recu : « ${praticienNom} »).`,
    );
    exit(1);
  }
  const praticien = lire(cheminPraticien);
  const seuils = seuilsDe(praticien);

  const { violations } = portailDoctrine(plan, cues, seuils, dureeTotaleDe(plan));
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
}
