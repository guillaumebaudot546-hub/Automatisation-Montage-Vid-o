import { Audio, Sequence, staticFile } from "remotion";

type Sound =
  | "swoosh" | "click" | "bubble" | "zoom" | "impact" | "cinematic-riser";
interface Cue { s: Sound; f: number; v: number; d?: number; }

// Frontieres scenes @ 60 fps timeline 97.3 s
const B = [600, 1441, 1712, 2836, 3684, 4561, 5160, 5642];

const CUES: Cue[] = [
  ...B.map((b) => ({ s: "swoosh" as Sound, f: b - 14, v: 0.13 })),
  { s: "cinematic-riser", f: 70, v: 0.18, d: 210 },
  { s: "impact", f: 360, v: 0.15 },
  { s: "click", f: 1545, v: 0.10 },
  { s: "click", f: 1585, v: 0.10 },
  { s: "click", f: 1625, v: 0.10 },
  { s: "impact", f: 5325, v: 0.14 },
  { s: "bubble", f: 5660, v: 0.12 },
];

const EXT: Record<Sound, string> = {
  swoosh: "wav", click: "wav", bubble: "wav", zoom: "wav", impact: "wav",
  "cinematic-riser": "mp3",
};

export const SfxLayer: React.FC = () => (
  <>
    {CUES.map((c, i) => (
      <Sequence key={i} from={Math.max(0, c.f)} durationInFrames={c.d ?? 60}>
        <Audio src={staticFile(`sfx/${c.s}.${EXT[c.s]}`)} volume={() => c.v ?? 1} />
      </Sequence>
    ))}
  </>
);
