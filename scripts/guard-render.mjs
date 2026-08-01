// Garde-fou "un seul rendu a la fois".
//
// La doctrine (REGLE 5) classe le rendu parallele comme cause de crash :
// deux rendus concurrents se disputent le meme cache et l'un des deux meurt,
// souvent apres plusieurs minutes de travail. La regle etait ecrite mais rien
// ne l'appliquait.
//
// Usage en hook PreToolUse (voir .claude/settings.json) : lit la commande sur
// stdin, refuse si un rendu tourne deja.
// Usage manuel : node scripts/guard-render.mjs "npx remotion render ..."
//
// Sortie 2 = bloquant. Claude Code montre alors le message au modele.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const EST_UN_RENDU = /\b(remotion|hyperframes)\b[^|;&]*\brender\b/i;

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
    const payload = JSON.parse(brut);
    return payload?.tool_input?.command ?? "";
  } catch {
    return brut;
  }
}

/**
 * Rendus deja en cours, hors processus courant.
 *
 * CORRECTIF 01/08/2026 — ce script ne sondait QUE via powershell.exe. Sur le
 * VPS Linux, l'appel echouait, le catch renvoyait [] et le garde-fou laissait
 * donc passer tous les rendus paralleles : il ne protegeait rien la ou la
 * production tourne. La sonde suit maintenant la plateforme.
 */
function rendusEnCours() {
  let sortie = "";
  const sonde =
    process.platform === "win32"
      ? [
          "powershell.exe",
          [
            "-NoProfile",
            "-NonInteractive",
            "-Command",
            "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | " +
              "Select-Object -ExpandProperty CommandLine",
          ],
        ]
      : ["ps", ["-eo", "args="]];
  try {
    sortie = execFileSync(sonde[0], sonde[1], {
      encoding: "utf8",
      timeout: 10000,
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    return []; // Sonde indisponible : on ne bloque pas sur une incertitude.
  }
  return sortie
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && EST_UN_RENDU.test(l) && !l.includes("guard-render"))
    .filter((l) => !l.includes(String(process.pid)));
}

const commande = commandeAVerifier();
if (!commande || !EST_UN_RENDU.test(commande)) process.exit(0);

const enCours = rendusEnCours();
if (enCours.length === 0) process.exit(0);

console.error(
  "Rendu refuse : un rendu tourne deja.\n\n" +
    enCours.map((c) => `  ${c.slice(0, 160)}`).join("\n") +
    "\n\nDeux rendus concurrents se disputent le cache et l'un des deux meurt\n" +
    "(doctrine montage-imcp, REGLE 5). Attendre la fin du rendu en cours.",
);
process.exit(2);
