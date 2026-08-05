// Tests du verrou « un seul rendu a la fois ».
//
// Ce garde-fou a eu un defaut silencieux jusqu'au 01/08/2026 : il ne sondait
// les processus que via powershell.exe. Sur le VPS Linux la sonde echouait, le
// catch renvoyait [] et TOUS les rendus paralleles passaient — il ne protegeait
// rien la ou la production tourne. Le test « detecte un rendu concurrent »
// ci-dessous echouerait sur cette version.
//
// Sortie 0 = le rendu passe · 2 = bloquant.
import { describe, expect, it, afterEach } from "vitest";
import { spawn, spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), "guard-render.mjs");

const garde = (commande, { stdin } = {}) =>
  spawnSync(
    process.execPath,
    stdin !== undefined ? [SCRIPT] : [SCRIPT, commande],
    { encoding: "utf8", input: stdin ?? "" },
  );

let faux = null;
afterEach(() => {
  if (faux) {
    faux.kill("SIGKILL");
    faux = null;
  }
});

const EST_UN_RENDU = /\b(remotion|hyperframes)\b[^|;&]*\brender\b/i;

/**
 * Attend que plus aucun processus ne ressemble a un rendu.
 *
 * Les fichiers de test tournent en parallele : un autre test peut avoir, une
 * fraction de seconde, un processus dont l'argv contient « hyperframes render ».
 * Le garde-fou aurait alors raison de bloquer — mais l'assertion « rien ne
 * tourne » ne testerait plus rien. On attend le silence avant de l'affirmer.
 */
async function attendsSilence() {
  for (let i = 0; i < 60; i++) {
    const ps = spawnSync("ps", ["-eo", "args="], { encoding: "utf8" });
    const bruit = (ps.stdout || "")
      .split("\n")
      .filter((l) => EST_UN_RENDU.test(l) && !l.includes("guard-render"));
    if (bruit.length === 0) return;
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error("un processus ressemblant a un rendu reste visible dans ps");
}

/** Un processus dont la ligne de commande ressemble a un rendu en cours. */
async function lanceFauxRendu() {
  faux = spawn(
    process.execPath,
    ["-e", "setTimeout(function(){}, 15000)", "hyperframes", "render"],
    { stdio: "ignore" },
  );
  // `ps` ne voit le processus qu'une fois exec() termine.
  for (let i = 0; i < 40; i++) {
    const ps = spawnSync("ps", ["-eo", "args="], { encoding: "utf8" });
    if (/hyperframes render/.test(ps.stdout || "")) return;
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error("le faux rendu n'apparait pas dans ps");
}

describe("perimetre", () => {
  it("laisse passer une commande qui n'est pas un rendu", () => {
    expect(garde("npm run test").status).toBe(0);
  });

  it("ne confond pas « hyperframes check » avec un rendu", () => {
    expect(garde("npx hyperframes check").status).toBe(0);
  });

  it("laisse passer un rendu quand rien d'autre ne tourne", async () => {
    await attendsSilence();
    expect(garde("npx hyperframes render 16x9").status).toBe(0);
  });

  it("ne bloque rien sur un payload vide", () => {
    expect(garde(null, { stdin: "" }).status).toBe(0);
  });
});

describe("verrou", () => {
  it("detecte un rendu concurrent et refuse le second", async () => {
    await lanceFauxRendu();
    const r = garde("npx hyperframes render 9x16");
    expect(r.status).toBe(2);
    expect(r.stderr).toContain("un rendu tourne deja");
    expect(r.stderr).toContain("se disputent le cache");
  });

  it("lit la commande sur stdin quand aucun argument n'est passe", async () => {
    await lanceFauxRendu();
    const r = garde(null, {
      stdin: JSON.stringify({
        tool_name: "Bash",
        tool_input: { command: "npx remotion render Capsule" },
      }),
    });
    expect(r.status).toBe(2);
  });

  it("ne se compte pas lui-meme comme un rendu en cours", async () => {
    // La commande passee en argv contient « hyperframes render » : si le script
    // se voyait dans ps, il se bloquerait lui-meme a chaque appel.
    await attendsSilence();
    expect(garde("npx hyperframes render 16x9").status).toBe(0);
  });
});
