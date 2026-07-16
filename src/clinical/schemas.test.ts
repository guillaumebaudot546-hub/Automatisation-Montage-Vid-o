import { describe, expect, it } from "vitest";
import { clinicalSchema } from "./ClinicalWrap";
import { highlightsSchema } from "./ClinicalHighlights";

/**
 * Filet des schémas zod : attrape une prop cassée (faute de frappe,
 * valeur hors bornes) AVANT d'ouvrir le Studio ou de lancer un rendu.
 */

describe("clinicalSchema (template long)", () => {
  it("accepte un jeu de props minimal valide", () => {
    const r = clinicalSchema.safeParse({
      src: "clinical/x.mp4",
      contentFrames: 9000,
      eyebrow: "Cas clinique",
      title: "Titre",
    });
    expect(r.success).toBe(true);
  });

  it("rejette un volume hors bornes", () => {
    const r = clinicalSchema.safeParse({
      src: "x.mp4",
      contentFrames: 100,
      eyebrow: "e",
      title: "t",
      musicChromeVol: 3,
    });
    expect(r.success).toBe(false);
  });
});

describe("highlightsSchema (template 1 min)", () => {
  const base = {
    src: "clinical/x.mp4",
    eyebrow: "Cas clinique",
    title: "Titre",
    segments: [{ startSec: 10, durationSec: 9, transition: "zoom" as const }],
    soundCues: [{ sound: "swoosh" as const, atSec: 5, volume: 0.1, pitch: 1 }],
  };

  it("accepte segments + sons + captions valides", () => {
    const r = highlightsSchema.safeParse({
      ...base,
      captions: [{ text: "Bonjour", fromSec: 6, toSec: 15 }],
      ctaLine1: "Maîtriser le LASER",
    });
    expect(r.success).toBe(true);
  });

  it("rejette une transition inconnue", () => {
    const r = highlightsSchema.safeParse({
      ...base,
      segments: [{ startSec: 0, durationSec: 5, transition: "spin" }],
    });
    expect(r.success).toBe(false);
  });

  it("rejette un pitch hors bornes (tonalité 0,5–2)", () => {
    const r = highlightsSchema.safeParse({
      ...base,
      soundCues: [{ sound: "impact", atSec: 1, volume: 0.2, pitch: 5 }],
    });
    expect(r.success).toBe(false);
  });
});
