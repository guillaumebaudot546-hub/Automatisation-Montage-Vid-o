// Tests du verrou « aucun rendu sans portail ».
//
// Ce garde-fou decide si un rendu part ou non. Il n'avait aucun test, et il a
// casse deux fois cette semaine : le 01/08 il bloquait TOUS les rendus, y
// compris les compositions ecrites a la main qui n'ont pas de plan a valider.
// Le correctif de perimetre est fige ici — c'est le premier cas ci-dessous.
//
// Sortie 0 = le rendu passe · 2 = bloquant.
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), "guard-portail.mjs");
const RENDU = "npx hyperframes render 16x9";

let dossier;
beforeEach(() => {
  dossier = mkdtempSync(join(tmpdir(), "guard-portail-"));
});
afterEach(() => {
  rmSync(dossier, { recursive: true, force: true });
});

/**
 * Lance le garde-fou depuis le dossier de travail, comme le fait le hook.
 *
 * Par defaut la commande passe par STDIN, exactement comme en PreToolUse. Ce
 * n'est pas un detail de confort : passer « hyperframes render » en argv rend
 * ce processus visible dans `ps`, et guard-render.mjs — qui sonde justement
 * les rendus en cours — le prendrait pour un rendu concurrent pendant que ses
 * propres tests tournent en parallele.
 */
const garde = (commande, { viaArgv = false } = {}) =>
  spawnSync(
    process.execPath,
    viaArgv ? [SCRIPT, commande] : [SCRIPT],
    {
      cwd: dossier,
      encoding: "utf8",
      input: viaArgv || commande === null
        ? ""
        : JSON.stringify({ tool_name: "Bash", tool_input: { command: commande } }),
    },
  );

const ecrisPlan = (nom = "plan.json", contenu = { format: "9:16" }) => {
  const p = join(dossier, nom);
  writeFileSync(p, JSON.stringify(contenu));
  return p;
};

const ecrisRecu = (chemin, { empreinte, ageMs = 0 } = {}) => {
  writeFileSync(
    join(dossier, ".portail-ok.json"),
    JSON.stringify({
      plan: chemin,
      empreinte: empreinte ?? createHash("sha256").update(readFileSync(chemin)).digest("hex"),
      valideLe: new Date(Date.now() - ageMs).toISOString(),
    }),
  );
};

describe("perimetre — ce que le garde-fou ne doit PAS bloquer", () => {
  it("laisse passer une commande qui n'est pas un rendu", () => {
    expect(garde("npm run test").status).toBe(0);
  });

  it("laisse passer un rendu quand il n'y a aucun plan a valider", () => {
    // Correctif du 01/08/2026 : les 13 compositions ecrites a la main n'ont
    // pas de plan. Exiger un recu les bloquait sans rien proteger.
    expect(garde(RENDU).status).toBe(0);
  });

  it("ne confond pas « hyperframes check » avec un rendu", () => {
    ecrisPlan();
    expect(garde("npx hyperframes check").status).toBe(0);
  });
});

describe("verrou — ce qu'il doit bloquer", () => {
  it("refuse un rendu quand le plan n'a jamais ete valide", () => {
    ecrisPlan();
    const r = garde(RENDU);
    expect(r.status).toBe(2);
    expect(r.stderr).toContain("Rendu refuse");
    expect(r.stderr).toContain("npm run portail");
  });

  it("refuse quand le plan a change depuis sa validation", () => {
    const p = ecrisPlan();
    ecrisRecu(p);
    writeFileSync(p, JSON.stringify({ format: "16:9", modifie: true }));
    const r = garde(RENDU);
    expect(r.status).toBe(2);
    expect(r.stderr).toContain("a change depuis sa validation");
  });

  it("refuse un recu perime au-dela d'une heure", () => {
    const p = ecrisPlan();
    ecrisRecu(p, { ageMs: 61 * 60 * 1000 });
    const r = garde(RENDU);
    expect(r.status).toBe(2);
    expect(r.stderr).toContain("trop ancienne");
  });

  it("refuse un recu dont la date est illisible", () => {
    const p = ecrisPlan();
    writeFileSync(
      join(dossier, ".portail-ok.json"),
      JSON.stringify({
        plan: p,
        empreinte: createHash("sha256").update(readFileSync(p)).digest("hex"),
        valideLe: "pas-une-date",
      }),
    );
    expect(garde(RENDU).status).toBe(2);
  });

  it("cite le portail CAPSULE quand le contrat est un capsule.json", () => {
    ecrisPlan("capsule.json");
    const r = garde(RENDU);
    expect(r.status).toBe(2);
    expect(r.stderr).toContain("portail:capsule");
  });
});

describe("laissez-passer", () => {
  it("laisse partir le rendu quand le recu couvre le plan courant", () => {
    const p = ecrisPlan();
    ecrisRecu(p);
    expect(garde(RENDU).status).toBe(0);
  });
});

describe("d'ou vient la commande a juger", () => {
  it("la lit dans le payload de hook sur stdin", () => {
    // Chemin de production : tous les tests ci-dessus passent deja par la.
    ecrisPlan();
    const r = garde(RENDU);
    expect(r.status).toBe(2);
    expect(r.stderr).toContain("Rendu refuse");
  });

  it("la lit aussi en argument, pour l'usage manuel documente", () => {
    ecrisPlan();
    const r = garde(RENDU, { viaArgv: true });
    expect(r.status).toBe(2);
    expect(r.stderr).toContain("Rendu refuse");
  });

  it("ne bloque rien sur un payload vide", () => {
    ecrisPlan();
    expect(garde(null).status).toBe(0);
  });
});
