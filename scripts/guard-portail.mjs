// Garde-fou "aucun rendu sans portail".
//
// La REGLE 5 d'AGENTS.md est ecrite en majuscules depuis le 31/07/2026 :
// « RENDRE SANS AVOIR APPELE LE PORTAIL EST INTERDIT ». Le 30/07, sur le
// premier montage reel, le portail a ete appele ZERO fois — pour trois rendus
// enchaines. Resultat : un montage juge mauvais par le praticien, et 4,35
// millions de jetons la ou le budget en prevoyait 300 000.
//
// Une consigne qui a deja echoue une fois ne devient pas fiable en la
// repetant plus fort. Ce script la transforme en verrou : le rendu refuse de
// partir si le plan n'a pas ete valide.
//
// Usage en hook PreToolUse (voir .claude/settings.json) : lit la commande sur
// stdin, refuse si aucun recu de portail valide ne couvre le plan courant.
// Usage manuel : node scripts/guard-portail.mjs "npx hyperframes render"
//
// Sortie 2 = bloquant.
//
// ECONOMIE. Un rejet du portail coute 0 jeton et 1 seconde. Un rendu fautif
// coute 6 minutes machine, puis toute la boucle de correction qui suit —
// mesure du 31/07 : 1 a 2 $ par rendu rate.
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, dirname } from "node:path";

const EST_UN_RENDU = /\b(remotion|hyperframes)\b[^|;&]*\brender\b/i;
const RECU = ".portail-ok.json";

/** Duree de validite d'un recu. Au-dela, le plan a pu changer sous nos pieds. */
const VALIDITE_MS = 60 * 60 * 1000; // 1 h

export const empreinte = (chemin) =>
  createHash("sha256").update(readFileSync(chemin)).digest("hex");

/** Ecrit le recu a cote du plan. Appele par portail-doctrine.mjs sur exit 0. */
export function ecrireRecu(cheminPlan) {
  const recu = {
    plan: cheminPlan,
    empreinte: empreinte(cheminPlan),
    valideLe: new Date().toISOString(),
  };
  writeFileSync(join(dirname(cheminPlan) || ".", RECU), JSON.stringify(recu, null, 2));
  return recu;
}

// --- A partir d'ici : le garde-fou proprement dit ---------------------------

if (import.meta.url === `file://${process.argv[1]}`) {
  const commande = commandeAVerifier();
  if (!commande || !EST_UN_RENDU.test(commande)) process.exit(0);

  const plan = trouvePlan();
  if (!plan) {
    refuse(
      "Aucun plan.json trouve a cote du rendu.\n" +
        "Le montage passe par un plan valide, pas par un HTML ecrit a la main.",
    );
  }

  const cheminRecu = join(dirname(plan) || ".", RECU);
  if (!existsSync(cheminRecu)) {
    refuse(
      `Le portail n'a jamais valide ${plan}.\n\n` +
        `  npm run portail -- ${plan} cues.json\n\n` +
        "Sortie 0 = passe, 3 = rejet (refaire le plan, plafond 3 essais).",
    );
  }

  const recu = JSON.parse(readFileSync(cheminRecu, "utf8"));
  const actuelle = empreinte(plan);

  if (recu.empreinte !== actuelle) {
    refuse(
      `${plan} a change depuis sa validation.\n` +
        "Le recu couvre une version anterieure du plan — le revalider :\n\n" +
        `  npm run portail -- ${plan} cues.json`,
    );
  }

  const age = Date.now() - Date.parse(recu.valideLe);
  if (!Number.isFinite(age) || age > VALIDITE_MS) {
    refuse(
      `Validation trop ancienne (${Math.round(age / 60000)} min).\n` +
        `  npm run portail -- ${plan} cues.json`,
    );
  }

  process.exit(0);
}

/** Commande a verifier : argv, sinon payload de hook sur stdin. */
function commandeAVerifier() {
  const direct = process.argv.slice(2).join(" ").trim();
  if (direct) return direct;
  let brut = "";
  try {
    brut = readFileSync(0, "utf8");
  } catch {
    return "";
  }
  if (!brut.trim()) return "";
  try {
    return JSON.parse(brut)?.tool_input?.command ?? "";
  } catch {
    return brut;
  }
}

/** Le plan du montage courant : dossier de travail, puis chemin cite. */
function trouvePlan() {
  if (existsSync("plan.json")) return "plan.json";
  const cite = process.argv.slice(2).join(" ").match(/\S+plan\.json/)?.[0];
  return cite && existsSync(cite) ? cite : null;
}

function refuse(message) {
  console.error(
    "Rendu refuse : le portail doctrine n'a pas valide ce plan.\n\n" +
      message +
      "\n\nPourquoi ce verrou existe : le 30/07/2026, trois rendus ont ete\n" +
      "enchaines sans un seul appel au portail. Un rejet coute 0 jeton et\n" +
      "1 seconde ; un rendu fautif coute 6 minutes et toute la boucle de\n" +
      "correction (doctrine montage-imcp, REGLE 5).",
  );
  process.exit(2);
}
