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
import { pathToFileURL } from "node:url";

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

// pathToFileURL et non `file://${argv[1]}` : sous Windows argv[1] vaut
// « C:\...\guard-portail.mjs » quand import.meta.url vaut
// « file:///C:/.../guard-portail.mjs ». La comparaison naive etait donc
// TOUJOURS fausse sur Windows — le garde se chargeait sans jamais s'executer,
// et laissait passer tous les rendus en silence. Sur Linux les deux formes
// coincidaient, d'ou un verrou actif sur le VPS et inerte sur le poste de
// travail (constate le 05/08/2026 : 37 tests rouges, aucun symptome visible).
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const commande = commandeAVerifier();
  if (!commande || !EST_UN_RENDU.test(commande)) process.exit(0);

  // PERIMETRE — corrige le 01/08/2026 apres avoir bloque un rendu legitime.
  //
  // Le portail valide un PLAN DE MONTAGE derive d'un rush : coupes aux
  // frontieres de phrases, format, couverture des sous-titres. Une composition
  // ecrite a la main (les 13 livrees, une presentation typographique) n'a pas
  // de plan a valider — exiger un recu la bloquerait sans rien proteger.
  //
  // Regle : s'il existe un plan.json, il DOIT etre valide. Sinon, on laisse
  // passer. La RÈGLE 5 d'AGENTS.md impose d'ecrire le plan pour tout montage
  // issu d'un rush ; ce garde-fou verrouille l'etape d'apres.
  const plan = trouvePlan();
  if (!plan) process.exit(0);

  const cheminRecu = join(dirname(plan) || ".", RECU);
  if (!existsSync(cheminRecu)) {
    refuse(
      `Le portail n'a jamais valide ${plan}.\n\n` +
        `  ${commandePortail(plan)}\n\n` +
        "Sortie 0 = passe, 3 = rejet (refaire le plan, plafond 3 essais).",
    );
  }

  const recu = JSON.parse(readFileSync(cheminRecu, "utf8"));
  const actuelle = empreinte(plan);

  if (recu.empreinte !== actuelle) {
    refuse(
      `${plan} a change depuis sa validation.\n` +
        "Le recu couvre une version anterieure du plan — le revalider :\n\n" +
        `  ${commandePortail(plan)}`,
    );
  }

  const age = Date.now() - Date.parse(recu.valideLe);
  if (!Number.isFinite(age) || age > VALIDITE_MS) {
    refuse(
      `Validation trop ancienne (${Math.round(age / 60000)} min).\n` +
        `  ${commandePortail(plan)}`,
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

/**
 * Le contrat du rendu courant. Deux classes de video, deux contrats, un seul
 * verrou (decision 017) :
 *   plan.json     — montage issu d'un rush   → portail-doctrine.mjs
 *   capsule.json  — capsule depuis un prompt → portail-capsule.mjs
 * Aucun des deux : composition ecrite a la main, rien a valider, on passe.
 */
function trouvePlan() {
  for (const nom of ["plan.json", "capsule.json"]) {
    if (existsSync(nom)) return nom;
  }
  const cite = process.argv.slice(2).join(" ").match(/\S+(plan|capsule)\.json/)?.[0];
  return cite && existsSync(cite) ? cite : null;
}

/** Chaque contrat a son portail : le message doit citer le bon. */
function commandePortail(plan) {
  return plan.endsWith("capsule.json")
    ? "npm run portail:capsule -- <dossier-projet>"
    : `npm run portail -- ${plan} cues.json`;
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
