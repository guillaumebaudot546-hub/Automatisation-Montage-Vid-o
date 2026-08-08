// Tests de l'adaptateur entre le protocole de hook d'Hermes et guard-portail.
//
// POURQUOI CE FICHIER COMPTE PLUS QUE SA TAILLE NE LE SUGGERE.
// Hermes ne bloque PAS sur un code de sortie non nul : sa documentation dit
// qu'un code non nul « logs a warning but never aborts the agent loop ». Sans
// cet adaptateur, guard-portail.mjs refuserait un rendu, Hermes ecrirait
// l'avertissement dans un journal, et le rendu partirait quand meme — la panne
// silencieuse du 01/08/2026.
//
// Ce script vivait UNIQUEMENT sur le VPS : hors du depot, hors de la liste de
// deploiement, hors de tout test. Reconstruire la machine l'aurait fait
// disparaitre, et le verrou serait redevenu decoratif sans que rien ne le dise.
//
// Protocole Hermes : sortie 0 dans tous les cas. « {} » laisse passer,
// {"decision":"block"} bloque.
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ICI = dirname(fileURLToPath(import.meta.url));
const SCRIPT = join(ICI, "hook-portail.py");
const GARDE = join(ICI, "guard-portail.mjs");
const RENDU = "npx hyperframes render 16x9";

/**
 * L'interpreteur Python n'a pas le meme nom partout. Sur le VPS c'est
 * « python3 ». Sur Windows, « python3 » existe mais c'est l'alias du Microsoft
 * Store : il n'execute rien, il imprime une invitation a installer Python et
 * rend une sortie vide — ce qui faisait echouer ces tests avec un
 * « Unexpected end of JSON input » trompeur, sans rapport avec le code teste.
 * On resout une fois, en preferant l'interpreteur qui repond vraiment.
 */
const PYTHON = (() => {
  for (const candidat of ["python3", "python"]) {
    const r = spawnSync(candidat, ["-c", "print(1)"], { encoding: "utf8" });
    if (r.status === 0 && r.stdout.trim() === "1") return candidat;
  }
  return "python3"; // aucun ne repond : on echoue avec le nom canonique
})();

let travail, maison;
beforeEach(() => {
  travail = mkdtempSync(join(tmpdir(), "hook-portail-"));
  maison = mkdtempSync(join(tmpdir(), "hermes-home-"));
  mkdirSync(join(maison, ".hermes"), { recursive: true });
});
afterEach(() => {
  rmSync(travail, { recursive: true, force: true });
  rmSync(maison, { recursive: true, force: true });
});

/** Lance l'adaptateur comme Hermes le fait : payload JSON sur stdin. */
function hook({ commande = RENDU, cwd = travail, garde = GARDE, payload } = {}) {
  const r = spawnSync(PYTHON, [SCRIPT], {
    encoding: "utf8",
    input:
      payload !== undefined
        ? payload
        : JSON.stringify({ tool_name: "Bash", tool_input: { command: commande }, cwd }),
    // USERPROFILE en plus de HOME : expanduser("~") de Python ignore HOME sous
    // Windows. Sans lui, le journal partait dans le vrai dossier personnel et
    // les assertions de tracabilite lisaient un fichier vide.
    env: { ...process.env, HOME: maison, USERPROFILE: maison, IMCP_GUARD_PORTAIL: garde },
  });
  return { ...r, verdict: JSON.parse(r.stdout) };
}

const posePlan = () =>
  writeFileSync(join(travail, "plan.json"), JSON.stringify({ format: "9:16" }));

describe("protocole Hermes", () => {
  it("sort toujours en code 0 — Hermes ne lit pas les codes de sortie", () => {
    posePlan();
    expect(hook().status).toBe(0);
  });

  it("traduit un refus en {\"decision\":\"block\"}, pas en code 2", () => {
    posePlan();
    const v = hook().verdict;
    expect(v.decision).toBe("block");
    expect(v.reason).toContain("Rendu refuse");
  });

  it("laisse passer avec un objet vide", () => {
    // Pas de plan.json : le garde-fou sort en 0, rien a valider.
    expect(hook().verdict).toEqual({});
  });
});

describe("chaine complete avec le vrai guard-portail", () => {
  it("bloque un rendu dont le plan n'a jamais ete valide", () => {
    posePlan();
    expect(hook().verdict.decision).toBe("block");
  });

  it("remonte la raison du garde-fou, pas un message generique", () => {
    posePlan();
    expect(hook().verdict.reason).toContain("npm run portail");
  });

  it("laisse passer une commande qui n'est pas un rendu", () => {
    posePlan();
    expect(hook({ commande: "npm run test" }).verdict).toEqual({});
  });
});

describe("politique de panne", () => {
  it("laisse passer un payload illisible", () => {
    expect(hook({ payload: "{ pas du json" }).verdict).toEqual({});
  });

  it("laisse passer un payload sans commande", () => {
    expect(hook({ payload: JSON.stringify({ tool_name: "Bash" }) }).verdict).toEqual({});
  });

  it("BLOQUE un rendu quand le garde-fou est introuvable", () => {
    // Un verrou casse ne doit pas laisser filer le seul geste qu'il surveille.
    const v = hook({ garde: "/inexistant/guard-portail.mjs" }).verdict;
    expect(v.decision).toBe("block");
    expect(v.reason).toContain("introuvable");
  });

  it("laisse passer les commandes sans rapport meme si le garde-fou manque", () => {
    // Sinon un verrou casse gelerait tout le poste de travail.
    expect(
      hook({ garde: "/inexistant/guard-portail.mjs", commande: "ls -la" }).verdict,
    ).toEqual({});
  });

  it("ne plante pas quand le dossier de travail est inutilisable", () => {
    const r = hook({ cwd: "/dossier/qui/n/existe/pas" });
    expect(r.status).toBe(0);
    expect(() => JSON.parse(r.stdout)).not.toThrow();
  });
});

describe("tracabilite", () => {
  it("journalise chaque decision — un verrou invérifiable n'inspire pas confiance", () => {
    posePlan();
    hook();
    const journal = readJournal();
    expect(journal).toContain("BLOQUE");
  });

  it("journalise aussi les laissez-passer", () => {
    hook({ commande: "npm run test" });
    expect(readJournal()).toContain("PASSE");
  });

  function readJournal() {
    const p = join(maison, ".hermes", "logs", "guard-portail.log");
    return spawnSync("cat", [p], { encoding: "utf8" }).stdout || "";
  }
});
