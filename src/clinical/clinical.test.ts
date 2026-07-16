import { describe, expect, it } from "vitest";
import { wrapDuration } from "./ClinicalWrap";
import { highlightsDuration } from "./ClinicalHighlights";

/**
 * Filet des templates cliniques : les durées calculées doivent rester
 * cohérentes avec les briques (sting/carton/CTA/générique) — une frame
 * d'écart = compo tronquée ou trou noir en fin de vidéo.
 */

describe("wrapDuration (template long)", () => {
  it("ajoute l'habillage (intro 135 + carton 105 + générique 180) au contenu", () => {
    expect(wrapDuration(1000)).toBe(135 + 105 + 1000 + 180);
  });

  it("croît linéairement avec le contenu", () => {
    expect(wrapDuration(2000) - wrapDuration(1000)).toBe(1000);
  });
});

describe("highlightsDuration (template 1 min)", () => {
  const segs = [{ durationSec: 10 }, { durationSec: 8.5 }];

  it("somme sting 90 + carton 75 + segments (s×30) + générique 120", () => {
    expect(highlightsDuration(segs)).toBe(90 + 75 + 300 + 255 + 120);
  });

  it("ajoute le carton CTA (120) quand demandé", () => {
    expect(highlightsDuration(segs, true) - highlightsDuration(segs)).toBe(120);
  });

  it("arrondit les demi-secondes sans dérive", () => {
    expect(highlightsDuration([{ durationSec: 1.5 }])).toBe(90 + 75 + 45 + 120);
  });
});
