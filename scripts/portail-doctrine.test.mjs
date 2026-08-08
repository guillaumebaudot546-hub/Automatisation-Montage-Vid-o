// Tests du portail doctrine — sur LE fichier qui tourne en production.
//
// Ces tests visaient src/lib/portail-doctrine.ts, un jumeau qui n'a jamais ete
// deploye. Le VPS execute scripts/portail-doctrine.mjs, qui n'etait teste par
// rien : l'ecriture du recu et la sortie 3 — la moitie du verrou — n'etaient
// couvertes par aucune assertion. Ils visent desormais le bon fichier, et les
// tests « CLI » ci-dessous lancent le vrai script comme le VPS l'appelle.
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  portailDoctrine,
  seuilsDe,
  verifieCalques,
  verifieFormat,
  verifieSousTitres,
  verifieVoix,
} from "./portail-doctrine.mjs";

const ICI = dirname(fileURLToPath(import.meta.url));
const RACINE = resolve(ICI, "..");
const SCRIPT = join(ICI, "portail-doctrine.mjs");

/** Les seuils par defaut de la doctrine, tels que le CLI les calcule. */
const seuils = {
  dureeInfographieMaxSec: 6,
  coupuresVoixMax: 1,
  crossfadeMinSec: 0.15,
  volumeMusique: 0.08,
};

/** Transcription de reference : 4 phrases, frontieres nettes. */
const CUES = [
  { s: 0.0, e: 2.0, t: "Je vais faire une analogie." },
  { s: 2.0, e: 5.0, t: "Je vous ai parle du sculpteur." },
  { s: 5.0, e: 9.0, t: "Nous sommes des sculpteurs de tissus vivants." },
  { s: 9.0, e: 14.0, t: "Et les sculpteurs, ils travaillent la matiere." },
];

const planValide = {
  format: "9:16",
  spans: [{ fromSec: 0, toSec: 14 }],
  overlays: [{ atSec: 2, durationSec: 4, kind: "stat" }],
  captions: CUES.map((c) => ({ fromSec: c.s, toSec: c.e, text: c.t })),
};

describe("RÈGLE 0 — la voix n'est jamais hachee", () => {
  it("accepte un passage continu cale sur les phrases", () => {
    expect(verifieVoix(planValide, CUES, seuils)).toEqual([]);
  });

  it("rejette une coupe au milieu d'une phrase", () => {
    const plan = { ...planValide, spans: [{ fromSec: 0, toSec: 6.4 }] };
    const v = verifieVoix(plan, CUES, seuils);
    expect(v).toHaveLength(1);
    expect(v[0].gravite).toBe("rejet");
    expect(v[0].message).toContain("6.4s");
  });

  it("tolere un leger decalage sous 0,25 s", () => {
    const plan = { ...planValide, spans: [{ fromSec: 0, toSec: 14.2 }] };
    expect(verifieVoix(plan, CUES, seuils)).toEqual([]);
  });

  it("rejette un best-of de fragments eparpilles", () => {
    const plan = {
      ...planValide,
      spans: [
        { fromSec: 0, toSec: 2 },
        { fromSec: 5, toSec: 9 },
        { fromSec: 9, toSec: 14 },
      ],
      crossfades: [0.2, 0.2],
    };
    expect(verifieVoix(plan, CUES, seuils).some((x) => x.message.includes("decousu"))).toBe(true);
  });

  it("rejette un raccord en cut sec entre deux prises", () => {
    const plan = {
      ...planValide,
      spans: [
        { fromSec: 0, toSec: 5 },
        { fromSec: 9, toSec: 14 },
      ],
      crossfades: [0],
    };
    expect(verifieVoix(plan, CUES, seuils).some((x) => x.message.includes("cut sec"))).toBe(true);
  });

  it("accepte deux prises raccordees par un fondu", () => {
    const plan = {
      ...planValide,
      spans: [
        { fromSec: 0, toSec: 5 },
        { fromSec: 9, toSec: 14 },
      ],
      crossfades: [0.2],
    };
    expect(verifieVoix(plan, CUES, seuils)).toEqual([]);
  });

  it("rejette un montage sans aucune voix", () => {
    const v = verifieVoix({ ...planValide, spans: [] }, CUES, seuils);
    expect(v[0].gravite).toBe("rejet");
    expect(v[0].message).toContain("Aucun passage");
  });
});

describe("RÈGLE 3 — le format suit le reseau", () => {
  it("accepte 9:16 pour des Reels", () => {
    expect(verifieFormat({ ...planValide, reseau: "instagram reels" })).toEqual([]);
  });

  it("rejette 9:16 pour YouTube", () => {
    const v = verifieFormat({ ...planValide, reseau: "youtube" });
    expect(v).toHaveLength(1);
    expect(v[0].message).toContain("16:9 attendu");
  });

  it("ne juge pas quand aucun reseau n'est precise", () => {
    expect(verifieFormat(planValide)).toEqual([]);
  });
});

describe("calques", () => {
  it("rejette un calque qui deborde de la video", () => {
    const plan = { ...planValide, overlays: [{ atSec: 12, durationSec: 5, kind: "slide" }] };
    expect(verifieCalques(plan, 14, seuils).some((x) => x.gravite === "rejet")).toBe(true);
  });

  it("avertit sur une infographie qui s'attarde", () => {
    const plan = { ...planValide, overlays: [{ atSec: 0, durationSec: 10, kind: "chart" }] };
    const v = verifieCalques(plan, 14, seuils);
    expect(v).toHaveLength(1);
    expect(v[0].gravite).toBe("avertissement");
  });

  it("laisse un B-roll durer, ce n'est pas une infographie", () => {
    const plan = { ...planValide, overlays: [{ atSec: 0, durationSec: 10, kind: "broll" }] };
    expect(verifieCalques(plan, 14, seuils)).toEqual([]);
  });
});

describe("sous-titres", () => {
  it("accepte une transcription integrale", () => {
    expect(verifieSousTitres(planValide)).toEqual([]);
  });

  it("rejette un sous-titrage partiel", () => {
    const plan = {
      ...planValide,
      captions: [{ fromSec: 0, toSec: 2, text: "Je vais faire une analogie." }],
    };
    const v = verifieSousTitres(plan);
    expect(v).toHaveLength(1);
    expect(v[0].message).toContain("14%");
  });
});

describe("portail complet", () => {
  it("laisse passer un montage conforme", () => {
    const r = portailDoctrine(planValide, CUES, seuils, 14);
    expect(r.passe).toBe(true);
    expect(r.violations).toEqual([]);
  });

  it("bloque et explique un montage fautif", () => {
    const plan = {
      format: "9:16",
      reseau: "youtube",
      spans: [{ fromSec: 0, toSec: 6.4 }],
      overlays: [{ atSec: 0, durationSec: 30, kind: "chart" }],
      captions: [],
    };
    const r = portailDoctrine(plan, CUES, seuils, 6.4);
    expect(r.passe).toBe(false);
    expect(r.violations.map((v) => v.regle)).toContain("0");
    expect(r.violations.map((v) => v.regle)).toContain("3");
    expect(r.violations.map((v) => v.regle)).toContain("sousTitres");
  });

  it("un avertissement seul ne bloque pas", () => {
    const plan = { ...planValide, overlays: [{ atSec: 0, durationSec: 10, kind: "chart" }] };
    const r = portailDoctrine(plan, CUES, seuils, 14);
    expect(r.passe).toBe(true);
    expect(r.violations).toHaveLength(1);
  });
});

describe("seuils extraits des preferences du praticien", () => {
  const praticien = JSON.parse(
    readFileSync(join(RACINE, "praticiens", "client-01.json"), "utf8"),
  );

  it("lit la borne haute de dureeInfographies", () => {
    expect(seuilsDe(praticien).dureeInfographieMaxSec).toBe(6);
  });

  it("lit le volume musical", () => {
    expect(seuilsDe(praticien).volumeMusique).toBeCloseTo(0.08, 3);
  });

  it("retombe sur les defauts doctrine quand la preference est muette", () => {
    const s = seuilsDe({ preferences: {} });
    expect(s.dureeInfographieMaxSec).toBe(6);
    expect(s.volumeMusique).toBeCloseTo(0.08, 3);
    expect(s.coupuresVoixMax).toBe(1);
  });
});

/* --------------------------------------------------------------------------
 * Le CLI tel que le VPS l'appelle. C'est la partie qui n'etait couverte par
 * RIEN : les codes de sortie et le recu — c'est-a-dire le verrou lui-meme.
 * -------------------------------------------------------------------------- */
describe("CLI — codes de sortie et recu", () => {
  let dossier;

  const lance = (...args) =>
    spawnSync(process.execPath, [SCRIPT, ...args], {
      cwd: RACINE,
      encoding: "utf8",
    });

  const ecrisPlan = (plan) => {
    const p = join(dossier, "plan.json");
    writeFileSync(p, JSON.stringify(plan));
    return p;
  };

  beforeEach(() => {
    dossier = mkdtempSync(join(tmpdir(), "portail-"));
  });
  afterEach(() => {
    rmSync(dossier, { recursive: true, force: true });
  });

  it("sort 1 et explique l'usage quand aucun plan n'est donne", () => {
    const r = lance();
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("Usage");
  });

  it("sort 0 sur un plan conforme", () => {
    const r = lance(ecrisPlan(planValide));
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("Aucune violation");
  });

  it("ecrit un recu dont l'empreinte couvre CETTE version du plan", () => {
    const p = ecrisPlan(planValide);
    expect(lance(p).status).toBe(0);

    const recu = JSON.parse(readFileSync(join(dossier, ".portail-ok.json"), "utf8"));
    expect(recu.empreinte).toBe(
      createHash("sha256").update(readFileSync(p)).digest("hex"),
    );
    expect(recu.plan).toBe(p);
    expect(Date.now() - Date.parse(recu.valideLe)).toBeLessThan(60_000);
  });

  it("sort 3 — un verdict, pas un plantage — sur un plan fautif", () => {
    const r = lance(
      ecrisPlan({ ...planValide, reseau: "youtube", captions: [] }),
    );
    expect(r.status).toBe(3);
    expect(r.stdout).toContain("REJET");
    expect(r.stdout).toContain("plafond 3 essais");
  });

  it("n'ecrit AUCUN recu quand il rejette", () => {
    lance(ecrisPlan({ ...planValide, reseau: "youtube", captions: [] }));
    expect(existsSync(join(dossier, ".portail-ok.json"))).toBe(false);
  });

  it("valide et ecrit un recu malgre un simple avertissement", () => {
    const p = ecrisPlan({
      ...planValide,
      overlays: [{ atSec: 0, durationSec: 10, kind: "chart" }],
    });
    const r = lance(p);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("note");
    expect(existsSync(join(dossier, ".portail-ok.json"))).toBe(true);
  });

  it("applique la RÈGLE 0 quand un fichier de cues est fourni", () => {
    const cues = join(dossier, "cues.json");
    writeFileSync(cues, JSON.stringify(CUES));
    const p = ecrisPlan({ ...planValide, spans: [{ fromSec: 0, toSec: 6.4 }] });
    const r = lance(p, cues);
    expect(r.status).toBe(3);
    expect(r.stdout).toContain("hors frontiere de phrase");
  });
});
