import {
  AbsoluteFill,
  Audio,
  Img,
  OffthreadVideo,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
} from "remotion";
import { CHARTE } from "../theme/client-01";
import { Watermark } from "../clinical/ClientChrome";

/**
 * Chrome portrait de la capsule verticale : segment vidéo, insert slide,
 * carton-titre, sous-titres zone-sûre, carton CTA, générique. Tuné pour le 9:16.
 * Consommé par CapsuleVertical uniquement.
 */

export const FPS = 30;
export const XFADE = 12;
const C = CHARTE.color;

/* ---------- Segment : extrait vidéo + transition + habillage ---------- */
export const SegmentBlock: React.FC<{
  src: string;
  startSec: number;
  dur: number;
  transition: "fade" | "flash" | "zoom";
}> = ({ src, startSec, dur, transition }) => {
  const f = useCurrentFrame();
  const enterOp =
    transition === "fade"
      ? interpolate(f, [0, XFADE], [0, 1], { extrapolateRight: "clamp" })
      : interpolate(f, [0, 4], [0, 1], { extrapolateRight: "clamp" });
  const exitOp = interpolate(f, [dur, dur + XFADE], [1, 0], { extrapolateLeft: "clamp" });
  const op = Math.min(enterOp, exitOp);
  const punch =
    transition === "zoom"
      ? interpolate(f, [0, 14], [1.2, 1.0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) })
      : 1;
  const kb = interpolate(f, [0, dur + XFADE], [1.0, 1.04]);
  const flashOp =
    transition === "flash"
      ? interpolate(f, [0, 3, 10], [0.95, 0.6, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
      : 0;

  return (
    <AbsoluteFill style={{ opacity: op, backgroundColor: "#000", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${kb * punch})` }}>
        <OffthreadVideo
          src={staticFile(src)}
          trimBefore={Math.round(startSec * FPS)}
          volume={1}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>
      {flashOp > 0 && (
        <AbsoluteFill
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(255,252,244,1) 0%, rgba(198,166,104,0.85) 55%, rgba(198,166,104,0.4) 100%)",
            opacity: flashOp,
            mixBlendMode: "screen",
          }}
        />
      )}
      <Watermark />
    </AbsoluteFill>
  );
};

/* ---------- Insert slide plein cadre (cutaway pédagogique) ---------- */
export const SlideInsert: React.FC<{ slideSrc: string; label: string; frames: number }> = ({ slideSrc, label, frames }) => {
  const f = useCurrentFrame();
  const op = Math.min(
    interpolate(f, [0, 12], [0, 1], { extrapolateRight: "clamp" }),
    interpolate(f, [frames - 14, frames], [1, 0], { extrapolateLeft: "clamp" })
  );
  const push = interpolate(f, [0, frames], [1.0, 1.06], { easing: Easing.inOut(Easing.ease) });
  return (
    <AbsoluteFill style={{ background: CHARTE.cardBackground, opacity: op, alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", top: "15%", width: "100%", textAlign: "center" }}>
        <div style={{ fontFamily: CHARTE.font.body, fontSize: 26, letterSpacing: "0.22em", textTransform: "uppercase", fontWeight: 600, color: C.champagne }}>
          {label}
        </div>
      </div>
      <Img src={staticFile(slideSrc)} style={{ width: "92%", borderRadius: 16, boxShadow: "0 30px 80px rgba(0,0,0,0.6)", transform: `scale(${push})` }} />
      <Watermark />
      <Audio src={staticFile("sfx/cinematic-riser.mp3")} volume={0.1} />
    </AbsoluteFill>
  );
};

/* ---------- Carton-titre portrait ---------- */
export const VerticalTitle: React.FC<{ eyebrow: string; title: string }> = ({ eyebrow, title }) => {
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const op = Math.min(
    interpolate(f, [0, 14], [0, 1], { extrapolateRight: "clamp" }),
    interpolate(f, [durationInFrames - 18, durationInFrames], [1, 0], { extrapolateLeft: "clamp" })
  );
  const ty = interpolate(f, [0, 22], [26, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const lineW = interpolate(f, [16, 56], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return (
    <AbsoluteFill style={{ background: CHARTE.cardBackground, alignItems: "center", justifyContent: "center", padding: "0 90px" }}>
      <div style={{ textAlign: "center", opacity: op, transform: `translateY(${ty}px)` }}>
        <div style={{ fontFamily: CHARTE.font.body, fontSize: 24, letterSpacing: "0.32em", textTransform: "uppercase", fontWeight: 600, color: C.champagne, marginBottom: 34 }}>{eyebrow}</div>
        <div style={{ fontFamily: CHARTE.font.display, fontSize: 78, fontWeight: 600, color: C.ivory, lineHeight: 1.12 }}>{title}</div>
        <div style={{ margin: "44px auto 0", width: `${lineW}%`, maxWidth: 420, height: 2, background: CHARTE.hairline() }} />
      </div>
    </AbsoluteFill>
  );
};

/* ---------- Sous-titres portrait, zone sûre — **mot** = mot-clé en cyan fluo ---------- */
const FLUO_SUB = "#5FE8FF";
const renderMarkup = (text: string) =>
  text.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <span key={i} style={{ color: FLUO_SUB, fontWeight: 800, textShadow: `0 0 14px ${FLUO_SUB}66, 0 2px 4px rgba(0,0,0,0.98)` }}>
        {part.slice(2, -2)}
      </span>
    ) : (
      part
    )
  );

export const VerticalCaptions: React.FC<{
  cues: { text: string; fromSec: number; toSec: number }[];
  /** Plages (s) où les cartes graphiques plein écran masquent les sous-titres */
  muteWindows?: { fromSec: number; toSec: number }[];
}> = ({ cues, muteWindows = [] }) => {
  const f = useCurrentFrame();
  const muted = muteWindows.some((m) => f >= Math.round(m.fromSec * FPS) - 6 && f <= Math.round(m.toSec * FPS) + 6);
  if (muted) return null;
  return (
    <>
      {cues.map((c, i) => {
        const from = Math.round(c.fromSec * FPS);
        const to = Math.round(c.toSec * FPS);
        if (f < from - 10 || f > to + 10) return null;
        const op = Math.min(
          interpolate(f, [from, from + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          interpolate(f, [to - 10, to], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
        );
        const ty = interpolate(f, [from, from + 14], [18, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
        return (
          <div key={i} style={{ position: "absolute", left: "50%", bottom: "24%", transform: `translateX(-50%) translateY(${ty}px)`, opacity: op, width: "84%", padding: "0 12px" }}>
            <div style={{ fontFamily: CHARTE.font.body, fontSize: 40, fontWeight: 700, lineHeight: 1.4, color: C.ivory, textAlign: "center", textShadow: "0 2px 4px rgba(0,0,0,0.98), 0 3px 14px rgba(0,0,0,0.9), 0 0 30px rgba(0,0,0,0.75)" }}>{renderMarkup(c.text)}</div>
          </div>
        );
      })}
    </>
  );
};

/* ---------- Carton CTA ---------- */
export const VerticalCard: React.FC<{ line1: string; line2: string }> = ({ line1, line2 }) => {
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const op = Math.min(
    interpolate(f, [0, 14], [0, 1], { extrapolateRight: "clamp" }),
    interpolate(f, [durationInFrames - 14, durationInFrames], [1, 0], { extrapolateLeft: "clamp" })
  );
  const ty = interpolate(f, [0, 20], [22, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return (
    <AbsoluteFill style={{ background: CHARTE.cardBackground, alignItems: "center", justifyContent: "center", padding: "0 90px" }}>
      <div style={{ textAlign: "center", opacity: op, transform: `translateY(${ty}px)` }}>
        <div style={{ fontFamily: CHARTE.font.display, fontSize: 58, fontWeight: 600, color: C.ivory, lineHeight: 1.22 }}>{line1}</div>
        <div style={{ fontFamily: CHARTE.font.body, marginTop: 26, fontSize: 30, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: C.champagne }}>{line2}</div>
      </div>
    </AbsoluteFill>
  );
};

/* ---------- Générique de fin (sans crédit musical) ---------- */
export const EndCard: React.FC = () => {
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const op = Math.min(
    interpolate(f, [0, 18], [0, 1], { extrapolateRight: "clamp" }),
    interpolate(f, [durationInFrames - 16, durationInFrames], [1, 0], { extrapolateLeft: "clamp" })
  );
  const rise = (d: number) => interpolate(f, [d, d + 20], [16, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const fade = (d: number) => interpolate(f, [d, d + 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: CHARTE.cardBackground, alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", opacity: op }}>
        <Img src={staticFile("logo-mark.png")} style={{ width: 340, display: "block", margin: "0 auto", opacity: fade(4), transform: `translateY(${rise(4)}px)` }} />
        <div style={{ fontFamily: CHARTE.font.display, fontSize: 44, fontWeight: 600, fontStyle: "italic", color: C.ivory, marginTop: 34, opacity: fade(18), transform: `translateY(${rise(18)}px)` }}>DR FABRICE CHARTE</div>
        <div style={{ fontFamily: CHARTE.font.body, fontSize: 20, letterSpacing: "0.28em", textTransform: "uppercase", color: C.slate, marginTop: 14, opacity: fade(30), transform: `translateY(${rise(30)}px)` }}>Microchirurgie · Laser Er-YAG</div>
      </div>
    </AbsoluteFill>
  );
};
