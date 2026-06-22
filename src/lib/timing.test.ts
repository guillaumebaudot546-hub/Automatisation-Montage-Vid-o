// Filet de securite du domaine "montage".
// Verifie que la timeline est saine : scenes contigues (pas de trou, pas de chevauchement)
// et somme exacte = TOTAL_FRAMES. Si quelqu'un casse un timing, ce test passe au ROUGE.
import { describe, it, expect } from "vitest";
import { TIMINGS, TOTAL_FRAMES, FPS } from "./timing";

describe("timeline montage", () => {
  const scenes = Object.values(TIMINGS);

  it("commence a la frame 0", () => {
    expect(scenes[0].from).toBe(0);
  });

  it("n'a ni trou ni chevauchement entre scenes", () => {
    for (let i = 1; i < scenes.length; i++) {
      const prevEnd = scenes[i - 1].from + scenes[i - 1].duration;
      expect(scenes[i].from).toBe(prevEnd);
    }
  });

  it("se termine pile a TOTAL_FRAMES", () => {
    const last = scenes[scenes.length - 1];
    expect(last.from + last.duration).toBe(TOTAL_FRAMES);
  });

  it("tourne a 60 fps", () => {
    expect(FPS).toBe(60);
  });
});
