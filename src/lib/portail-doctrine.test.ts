import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  portailDoctrine,
  verifieCalques,
  verifieFormat,
  verifieSousTitres,
  verifieVoix,
  type Cue,
  type PlanMontage,
} from "./portail-doctrine";
import { litPraticien, santeBoucle, seuilsDe, seuilsSchema } from "./praticien";

const seuils = seuilsSchema.parse({});

/** Transcription de reference : 4 phrases, frontieres nettes. */
const CUES: Cue[] = [
  { s: 0.0, e: 2.0, t: "Je vais faire une analogie." },
  { s: 2.0, e: 5.0, t: "Je vous ai parle du sculpteur." },
  { s: 5.0, e: 9.0, t: "Nous sommes des sculpteurs de tissus vivants." },
  { s: 9.0, e: 14.0, t: "Et les sculpteurs, ils travaillent la matiere." },
];

const planValide: PlanMontage = {
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
    const plan: PlanMontage = {
      ...planValide,
      spans: [
        { fromSec: 0, toSec: 2 },
        { fromSec: 5, toSec: 9 },
        { fromSec: 9, toSec: 14 },
      ],
      crossfades: [0.2, 0.2],
    };
    const v = verifieVoix(plan, CUES, seuils);
    expect(v.some((x) => x.message.includes("decousus"))).toBe(true);
  });

  it("rejette un raccord en cut sec entre deux prises", () => {
    const plan: PlanMontage = {
      ...planValide,
      spans: [
        { fromSec: 0, toSec: 5 },
        { fromSec: 9, toSec: 14 },
      ],
      crossfades: [0],
    };
    const v = verifieVoix(plan, CUES, seuils);
    expect(v.some((x) => x.message.includes("cut sec"))).toBe(true);
  });

  it("accepte deux prises raccordees par un fondu", () => {
    const plan: PlanMontage = {
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
    const plan = {
      ...planValide,
      overlays: [{ atSec: 12, durationSec: 5, kind: "slide" }],
    };
    const v = verifieCalques(plan, 14, seuils);
    expect(v.some((x) => x.gravite === "rejet")).toBe(true);
  });

  it("avertit sur une infographie qui s'attarde", () => {
    const plan = {
      ...planValide,
      overlays: [{ atSec: 0, durationSec: 10, kind: "chart" }],
    };
    const v = verifieCalques(plan, 14, seuils);
    expect(v).toHaveLength(1);
    expect(v[0].gravite).toBe("avertissement");
  });

  it("laisse un B-roll durer, ce n'est pas une infographie", () => {
    const plan = {
      ...planValide,
      overlays: [{ atSec: 0, durationSec: 10, kind: "broll" }],
    };
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
    const plan: PlanMontage = {
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
    const plan = {
      ...planValide,
      overlays: [{ atSec: 0, durationSec: 10, kind: "chart" }],
    };
    const r = portailDoctrine(plan, CUES, seuils, 14);
    expect(r.passe).toBe(true);
    expect(r.violations).toHaveLength(1);
  });
});

describe("praticiens/client-01.json est lisible par du code", () => {
  const brut = JSON.parse(
    readFileSync(join(process.cwd(), "praticiens", "client-01.json"), "utf8"),
  );

  it("respecte le schema", () => {
    expect(() => litPraticien(brut)).not.toThrow();
  });

  it("expose des seuils chiffres extraits des preferences", () => {
    const s = seuilsDe(litPraticien(brut));
    expect(s.dureeInfographieMaxSec).toBe(6);
    expect(s.volumeMusique).toBeCloseTo(0.08, 3);
  });

  it("la couche 3 de la decision 003 est alimentee", () => {
    const sante = santeBoucle(litPraticien(brut));
    expect(
      sante.couche3Alimentee,
      "exemplesValides vide : l'agent n'a jamais vu de reussite, seulement des echecs a eviter",
    ).toBe(true);
  });

  it("l'accent declare est le cyan IMCP, pas l'ancien beige", () => {
    expect(litPraticien(brut).charte.accent.toLowerCase()).toBe("#49b6c9");
  });
});
