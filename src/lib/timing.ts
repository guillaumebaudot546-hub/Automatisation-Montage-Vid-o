// Timings @ 60 fps.
// Intro (sting logo, recadrée) : 4,5 s. Puis prologue Story (12,5 s, muet).
// La voix off démarre au Hook → CONTENT_OFFSET = intro + story.

export const FPS = 60;

// Décalage appliqué au contenu porté par la voix off.
export const CONTENT_OFFSET = 1020;

export const TIMINGS = {
  intro:         { from:    0, duration: 270 }, // 0      – 4.50 s
  story:         { from:  270, duration: 750 }, // 4.50   – 17.00 s
  hook:          { from: 1020, duration: 600 }, // 17.00  – 27.00 s
  presentation:  { from: 1620, duration: 841 }, // 27.00  – 41.02 s
  chaptersIntro: { from: 2461, duration: 271 }, // 41.02  – 45.53 s
  chapter1:      { from: 2732, duration: 1124 },// 45.53  – 64.27 s
  chapter2:      { from: 3856, duration: 848 }, // 64.27  – 78.40 s
  chapter3:      { from: 4704, duration: 877 }, // 78.40  – 93.02 s
  community:     { from: 5581, duration: 599 }, // 93.02  – 103.00 s
  cta:           { from: 6180, duration: 482 }, // 103.00 – 111.03 s
  outro:         { from: 6662, duration: 194 }, // 111.03 – 114.27 s
} as const;

export const TOTAL_FRAMES = 6856;
