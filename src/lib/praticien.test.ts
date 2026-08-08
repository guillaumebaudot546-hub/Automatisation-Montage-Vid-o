import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { litPraticien, santeBoucle, seuilsDe } from "./praticien";

/**
 * Ces tests vivaient dans portail-doctrine.test.ts, supprime le 04/08/2026 avec
 * le jumeau non deploye qu'il testait. Ils portent sur le schema du praticien —
 * bien vivant, lu par le portail et par le builder de capsules — et n'avaient
 * aucune raison de disparaitre avec lui.
 */
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
