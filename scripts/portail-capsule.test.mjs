// Tests du portail des capsules generees depuis un prompt (decision 017).
//
// Jusqu'au 02/08/2026 une capsule passait SANS AUCUN garde-fou. Ce portail est
// desormais le seul controle entre un prompt et un rendu facture — et il
// n'avait aucun test. La capsule de reference ci-dessous est celle que
// scripts/deploy-vps.sh envoie en controle de deploiement : si elle cesse de
// passer, le deploiement echouera aussi.
//
// Sortie 0 = passe · 3 = rejet · 1 = erreur d'usage.
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ICI = dirname(fileURLToPath(import.meta.url));
const RACINE = resolve(ICI, "..");
const SCRIPT = join(ICI, "portail-capsule.mjs");

/** La capsule du controle de deploiement : connue bonne en production. */
const CAPSULE_OK = {
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

let dossier;
beforeEach(() => {
  dossier = mkdtempSync(join(tmpdir(), "portail-capsule-"));
});
afterEach(() => {
  rmSync(dossier, { recursive: true, force: true });
});

/** Ecrit une capsule derivee de la reference, puis lance le portail. */
const juge = (patch) => {
  if (patch !== undefined) {
    writeFileSync(join(dossier, "capsule.json"), JSON.stringify(patch));
  }
  return spawnSync(process.execPath, [SCRIPT, dossier], {
    cwd: RACINE,
    encoding: "utf8",
  });
};

/** La reference, avec une seule scene remplacee. */
const avecScene = (scene) => ({
  ...CAPSULE_OK,
  scenes: [{ ...CAPSULE_OK.scenes[0], ...scene }],
});

describe("usage", () => {
  it("sort 1 quand le dossier n'a pas de capsule.json", () => {
    const r = juge();
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("introuvable");
  });

  it("sort 1 quand aucun dossier n'est donne", () => {
    const r = spawnSync(process.execPath, [SCRIPT], { cwd: RACINE, encoding: "utf8" });
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("Usage");
  });
});

describe("la capsule de reference passe", () => {
  it("sort 0 sans aucune violation", () => {
    const r = juge(CAPSULE_OK);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("Aucune violation");
  });

  it("ecrit un recu — sans lui, guard-portail refuserait le rendu", () => {
    expect(juge(CAPSULE_OK).status).toBe(0);
    expect(existsSync(join(dossier, ".portail-ok.json"))).toBe(true);
  });
});

describe("charte", () => {
  it("rejette une charte qui n'existe pas", () => {
    const r = juge({ ...CAPSULE_OK, charte: "praticien-fantome" });
    expect(r.status).toBe(3);
    expect(r.stdout).toContain("introuvable");
  });
});

describe("musique — regle non negociable", () => {
  it("rejette une piste sans preuve de licence", () => {
    const r = juge({ ...CAPSULE_OK, musique: { fichier: "beau-morceau.mp3" } });
    expect(r.status).toBe(3);
    expect(r.stdout).toContain("licence");
  });

  it("rejette une piste declaree mais absente du projet", () => {
    const r = juge({
      ...CAPSULE_OK,
      musique: { fichier: "absente.mp3", licence: "CC0 — preuve jointe" },
    });
    expect(r.status).toBe(3);
    expect(r.stdout).toContain("Piste absente");
  });
});

describe("format (REGLE 5bis)", () => {
  it("rejette un format hors doctrine", () => {
    const r = juge({ ...CAPSULE_OK, format: "4:3" });
    expect(r.status).toBe(3);
    expect(r.stdout).toContain("hors doctrine");
  });

  it("rejette un format incoherent avec le reseau", () => {
    const r = juge({ ...CAPSULE_OK, format: "16:9", reseau: "instagram reels" });
    expect(r.status).toBe(3);
    expect(r.stdout).toContain("9:16 attendu");
  });
});

describe("structure", () => {
  it("rejette une capsule sans scene", () => {
    const r = juge({ ...CAPSULE_OK, scenes: [] });
    expect(r.status).toBe(3);
    expect(r.stdout).toContain("Aucune scene");
  });

  it("rejette un bloc hors vocabulaire", () => {
    const r = juge(avecScene({ bloc: { type: "carrousel-3d" } }));
    expect(r.status).toBe(3);
    expect(r.stdout).toContain("hors vocabulaire");
  });

  it("rejette une scene plus courte que le minimum", () => {
    const r = juge(avecScene({ dureeSec: 2 }));
    expect(r.status).toBe(3);
    expect(r.stdout).toContain("minimum 4 s");
  });

  it("avertit seulement quand le pied de page manque", () => {
    const sans = { ...CAPSULE_OK };
    delete sans.pied;
    const r = juge(sans);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("attribution");
  });
});

describe("lisibilite — le controle central d'une video muette", () => {
  it("rejette du texte qu'on n'a pas le temps de lire", () => {
    const r = juge(
      avecScene({
        dureeSec: 5,
        sub: "Voici beaucoup trop de mots pour le temps imparti a cette scene " +
          "et personne ne pourra jamais lire tout cela avant la coupure suivante.",
      }),
    );
    expect(r.status).toBe(3);
    expect(r.stdout).toContain("Illisible");
  });

  it("rejette une scene entierement mangee par son animation d'entree", () => {
    const r = juge(avecScene({ dureeSec: 3, bloc: { type: "etapes-score" } }));
    expect(r.status).toBe(3);
    expect(r.stdout).toContain("animation d'entree");
  });

  it("avertit sur une scene lisible mais sans marge", () => {
    const r = juge(
      avecScene({ dureeSec: 5, sub: "Un rythme tenable mais serre pour la lecture ici." }),
    );
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("sans marge");
  });

  it("ne compte pas le balisage **gras** comme du texte a lire", () => {
    const r = juge(avecScene({ sub: "**Vérification** automatique." }));
    expect(r.status).toBe(0);
  });
});

describe("debordement", () => {
  it("rejette une ligne de titre qui passera a la ligne", () => {
    const r = juge(
      avecScene({
        lede: ["Une ligne de titre beaucoup trop longue qui va casser le masque d'animation."],
        dureeSec: 20,
      }),
    );
    expect(r.status).toBe(3);
    expect(r.stdout).toContain("cassera le masque");
  });

  it("avertit seulement sur un sur-titre trop long", () => {
    const r = juge(
      avecScene({ kicker: "UN SUR-TITRE VRAIMENT TRES LONG POUR DES MAJUSCULES", dureeSec: 20 }),
    );
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("deborde");
  });
});
