// Timings @ 60 fps — cible 97.3 s = 5836 frames.
// Voix off naturelle (atempo 1.15 sur l'original 111.9 s) = 97.26 s.

export const FPS = 60;

export const TIMINGS = {
  hook:          { from:    0, duration: 600 }, // 0     – 10.0  s
  presentation:  { from:  600, duration: 841 }, // 10.0  – 24.0  s
  chaptersIntro: { from: 1441, duration: 271 }, // 24.0  – 28.5  s
  chapter1:      { from: 1712, duration: 1124 },// 28.5  – 47.27 s
  chapter2:      { from: 2836, duration: 848 }, // 47.27 – 61.40 s
  chapter3:      { from: 3684, duration: 877 }, // 61.40 – 76.02 s
  community:     { from: 4561, duration: 599 }, // 76.02 – 86.00 s
  cta:           { from: 5160, duration: 482 }, // 86.00 – 94.03 s
  outro:         { from: 5642, duration: 194 }, // 94.03 – 97.26 s
} as const;

export const TOTAL_FRAMES = 5836;
