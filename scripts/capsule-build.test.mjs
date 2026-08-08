// Tests du generateur de compositions capsule (decision 017).
//
// Ce script est l'application litterale de la decision 005 : l'IA decide QUOI
// (capsule.json, 2 Ko), le code decide COMMENT (index.html, 12 Ko). Il porte
// deux garanties qui n'etaient verifiees par rien : la charte vient de
// src/theme/ et jamais du script, et --check detecte un index.html edite a la
// main. Un HTML genere puis retouche a la main est une derive silencieuse : le
// capsule.json ne le decrit plus.
//
// Sortie 0 = conforme · 2 = derive detectee (--check) · 1 = erreur d'usage.
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ICI = dirname(fileURLToPath(import.meta.url));
const RACINE = resolve(ICI, "..");
const SCRIPT = join(ICI, "capsule-build.mjs");

const CAPSULE = {
  type: "capsule-prompt",
  charte: "client-01",
  format: "16:9",
  reseau: "youtube",
  pied: "Contrôle de déploiement",
  scenes: [
    {
      kicker: "Test",
      lede: ["Le socle répond."],
      dureeSec: 10,
      bloc: { type: "rule" },
      sub: "Vérification automatique.",
    },
  ],
};

/** L'accent cyan de la charte IMCP — le beige #d8c7a8 serait un bug. */
const CYAN = "#49b6c9";

let dossier;
beforeEach(() => {
  dossier = mkdtempSync(join(tmpdir(), "capsule-build-"));
});
afterEach(() => {
  rmSync(dossier, { recursive: true, force: true });
});

const ecris = (cap) => writeFileSync(join(dossier, "capsule.json"), JSON.stringify(cap));

const build = (...args) =>
  spawnSync(process.execPath, [SCRIPT, dossier, ...args], {
    cwd: RACINE,
    encoding: "utf8",
  });

const html = () => readFileSync(join(dossier, "index.html"), "utf8");

describe("usage", () => {
  it("sort 1 sans dossier de projet", () => {
    const r = spawnSync(process.execPath, [SCRIPT], { cwd: RACINE, encoding: "utf8" });
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("Usage");
  });

  it("sort 1 quand le projet n'a pas de capsule.json", () => {
    const r = build();
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("introuvable");
  });

  it("sort 1 sur une charte inexistante, sans rien generer", () => {
    ecris({ ...CAPSULE, charte: "praticien-fantome" });
    const r = build();
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("Charte introuvable");
    expect(existsSync(join(dossier, "index.html"))).toBe(false);
  });
});

describe("generation", () => {
  it("produit un index.html a partir du capsule.json", () => {
    ecris(CAPSULE);
    const r = build();
    expect(r.status).toBe(0);
    expect(html()).toContain("Le socle répond.");
  });

  it("est deterministe — deux generations donnent le meme octet", () => {
    ecris(CAPSULE);
    build();
    const un = html();
    build();
    expect(html()).toBe(un);
  });

  it("porte les timings HyperFrames de la scene", () => {
    ecris(CAPSULE);
    build();
    expect(html()).toContain('data-duration');
  });
});

describe("la charte vient de src/theme/, jamais du script (REGLE 4bis)", () => {
  it("injecte l'accent cyan declare dans src/theme/client-01.ts", () => {
    ecris(CAPSULE);
    build();
    expect(html().toLowerCase()).toContain(CYAN);
  });

  it("ne contient pas l'ancien accent beige remplace par le client", () => {
    ecris(CAPSULE);
    build();
    expect(html().toLowerCase()).not.toContain("#d8c7a8");
  });
});

describe("l'agent ne peut pas injecter de HTML arbitraire", () => {
  it("echappe le balisage hostile dans les textes", () => {
    ecris({
      ...CAPSULE,
      pied: "<script>alert(1)</script>",
      scenes: [{ ...CAPSULE.scenes[0], sub: "<img onerror=x>" }],
    });
    build();
    expect(html()).not.toContain("<script>alert(1)</script>");
    expect(html()).not.toContain("<img onerror=x>");
    expect(html()).toContain("&lt;script&gt;");
  });

  it("traduit le balisage **mot** en surbrillance, pas en HTML libre", () => {
    ecris({ ...CAPSULE, scenes: [{ ...CAPSULE.scenes[0], sub: "**Vérification** faite." }] });
    build();
    expect(html()).toContain('<span class="kw">Vérification</span>');
  });
});

describe("--check : detecter un index.html edite a la main", () => {
  it("sort 0 quand le HTML correspond au capsule.json", () => {
    ecris(CAPSULE);
    build();
    const r = build("--check");
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("conforme");
  });

  it("sort 2 quand le HTML a ete retouche a la main", () => {
    ecris(CAPSULE);
    build();
    writeFileSync(join(dossier, "index.html"), html() + "\n<!-- retouche manuelle -->");
    const r = build("--check");
    expect(r.status).toBe(2);
    expect(r.stdout).toContain("derive");
  });

  it("sort 2 quand le HTML n'a jamais ete genere", () => {
    ecris(CAPSULE);
    const r = build("--check");
    expect(r.status).toBe(2);
    expect(r.stdout).toContain("absent");
  });

  it("sort 2 quand le capsule.json a change sans regeneration", () => {
    ecris(CAPSULE);
    build();
    ecris({ ...CAPSULE, pied: "Un autre pied de page" });
    const r = build("--check");
    expect(r.status).toBe(2);
  });

  it("ne modifie pas le HTML en mode --check", () => {
    ecris(CAPSULE);
    build();
    const avant = html();
    ecris({ ...CAPSULE, pied: "Un autre pied de page" });
    build("--check");
    expect(html()).toBe(avant);
  });
});
