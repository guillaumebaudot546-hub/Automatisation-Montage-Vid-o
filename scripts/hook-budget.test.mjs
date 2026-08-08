// Tests du verrou de budget (decision 019).
//
// Ce hook est le seul obstacle entre une session qui derape et la facture : le
// 03/08/2026, une capsule a coute 8,79 $ mesures. Il n'avait aucun test alors
// qu'il porte deux comportements opposes et faciles a inverser par accident —
// BLOQUER quand la session est trop lourde, et LAISSER PASSER quand sa propre
// mesure est indisponible. Un verrou de budget casse ne doit pas geler la
// production : il doit se taire.
//
// Le hook lit ~/.hermes/state.db. Les tests lui donnent un HOME temporaire :
// rien n'est lu ni ecrit dans le vrai dossier personnel.
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), "hook-budget.py");

/**
 * Meme raison que dans hook-portail.test.mjs : sur Windows « python3 » est
 * l'alias du Microsoft Store, qui n'execute rien et rend une sortie vide.
 * On retient l'interpreteur qui repond reellement.
 */
const PYTHON = (() => {
  for (const candidat of ["python3", "python"]) {
    const r = spawnSync(candidat, ["-c", "print(1)"], { encoding: "utf8" });
    if (r.status === 0 && r.stdout.trim() === "1") return candidat;
  }
  return "python3";
})();

let maison;
beforeEach(() => {
  maison = mkdtempSync(join(tmpdir(), "hermes-home-"));
  mkdirSync(join(maison, ".hermes"), { recursive: true });
});
afterEach(() => {
  rmSync(maison, { recursive: true, force: true });
});

const COLONNES = [
  "session_id", "model", "api_call_count",
  "input_tokens", "output_tokens", "cache_read_tokens", "cache_write_tokens",
];

/** Fabrique un ~/.hermes/state.db contenant les lignes de consommation. */
function poseBase(lignes) {
  const py = `
import sqlite3, json, sys
c = sqlite3.connect(${JSON.stringify(join(maison, ".hermes", "state.db"))})
c.execute("CREATE TABLE session_model_usage (${COLONNES.join(", ")})")
for r in json.loads(sys.argv[1]):
    c.execute("INSERT INTO session_model_usage VALUES (?,?,?,?,?,?,?)",
              [r[k] for k in ${JSON.stringify(COLONNES)}])
c.commit(); c.close()
`;
  const r = spawnSync(PYTHON, ["-c", py, JSON.stringify(lignes)], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`base de test non creee : ${r.stderr}`);
}

/** Une ligne de consommation, complete par des zeros. */
const ligne = (p) => ({
  session_id: "s-test",
  model: "claude-sonnet-5",
  api_call_count: 1,
  input_tokens: 0,
  output_tokens: 0,
  cache_read_tokens: 0,
  cache_write_tokens: 0,
  ...p,
});

/** Lance le hook comme Hermes le fait : payload JSON sur stdin. */
function hook({ env = {}, payload = { tool_name: "Bash" } } = {}) {
  const r = spawnSync(PYTHON, [SCRIPT], {
    encoding: "utf8",
    input: typeof payload === "string" ? payload : JSON.stringify(payload),
    // HOME *et* USERPROFILE : os.path.expanduser("~") de Python ignore HOME
    // sous Windows et lit USERPROFILE. Sans les deux, le hook allait chercher
    // la vraie base ~/.hermes/state.db au lieu de la fixture, et tous les cas
    // « bloque » repondaient « approve » — le test ne testait rien.
    env: { ...process.env, HOME: maison, USERPROFILE: maison, ...env },
  });
  return { ...r, verdict: JSON.parse(r.stdout) };
}

describe("politique de panne — un verrou casse se tait", () => {
  it("laisse passer quand state.db n'existe pas", () => {
    expect(hook().verdict.decision).toBe("approve");
  });

  it("laisse passer quand la base est illisible", () => {
    writeFileSync(join(maison, ".hermes", "state.db"), "ceci n'est pas une base sqlite");
    expect(hook().verdict.decision).toBe("approve");
  });

  it("laisse passer quand aucune consommation n'est enregistree", () => {
    poseBase([]);
    expect(hook().verdict.decision).toBe("approve");
  });

  it("laisse passer sur un payload illisible", () => {
    poseBase([ligne({ input_tokens: 1000 })]);
    expect(hook({ payload: "{ ceci n'est pas du json" }).verdict.decision).toBe("approve");
  });

  it("sort toujours en code 0 — le hook n'est jamais lui-meme une panne", () => {
    poseBase([ligne({ api_call_count: 1, input_tokens: 500000 })]);
    expect(hook().status).toBe(0);
  });
});

describe("session dans le budget", () => {
  it("laisse passer une consommation normale", () => {
    poseBase([
      ligne({
        api_call_count: 10,
        input_tokens: 100000,
        output_tokens: 5000,
        cache_read_tokens: 200000,
        cache_write_tokens: 10000,
      }),
    ]);
    expect(hook().verdict.decision).toBe("approve");
  });
});

describe("seuil preventif — contexte par appel", () => {
  it("bloque une session trop chargee", () => {
    poseBase([ligne({ api_call_count: 1, input_tokens: 150000 })]);
    const v = hook().verdict;
    expect(v.decision).toBe("block");
    expect(v.reason).toContain("SESSION TROP CHARGÉE");
  });

  it("dit quoi faire — ouvrir une conversation neuve, pas optimiser", () => {
    poseBase([ligne({ api_call_count: 1, input_tokens: 150000 })]);
    expect(hook().verdict.reason).toContain("conversation neuve");
  });

  it("compte le cache relu dans le contexte, pas seulement l'entree", () => {
    poseBase([ligne({ api_call_count: 1, cache_read_tokens: 150000 })]);
    expect(hook().verdict.decision).toBe("block");
  });

  it("respecte le plafond passe par l'environnement", () => {
    poseBase([ligne({ api_call_count: 1, input_tokens: 150000 })]);
    expect(hook({ env: { IMCP_CONTEXTE_MAX: "500000" } }).verdict.decision).toBe("approve");
  });
});

describe("seuil curatif — cout de la session", () => {
  it("bloque au-dela du budget", () => {
    poseBase([
      ligne({ api_call_count: 100, input_tokens: 50000, output_tokens: 200000 }),
    ]);
    const v = hook().verdict;
    expect(v.decision).toBe("block");
    expect(v.reason).toContain("BUDGET DE SESSION DÉPASSÉ");
  });

  it("respecte le budget passe par l'environnement", () => {
    poseBase([
      ligne({ api_call_count: 100, input_tokens: 50000, output_tokens: 200000 }),
    ]);
    expect(hook({ env: { IMCP_BUDGET_USD: "50" } }).verdict.decision).toBe("approve");
  });

  it("facture l'ecriture de cache plus cher que l'entree — c'est le poste n°1", () => {
    // 65 % du cout mesure le 03/08 venait de la reecriture de cache.
    poseBase([ligne({ api_call_count: 100, cache_write_tokens: 800000000 })]);
    expect(hook().verdict.decision).toBe("block");
  });
});

describe("perimetre de la mesure", () => {
  it("ne juge que la session la plus recemment active", () => {
    poseBase([
      ligne({ session_id: "s-ancienne-ruineuse", api_call_count: 1, input_tokens: 900000 }),
      ligne({ session_id: "s-courante-sobre", api_call_count: 10, input_tokens: 5000 }),
    ]);
    expect(hook().verdict.decision).toBe("approve");
  });

  it("ignore les lignes sans appel API", () => {
    poseBase([ligne({ api_call_count: 0, input_tokens: 900000 })]);
    expect(hook().verdict.decision).toBe("approve");
  });
});
