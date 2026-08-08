import {
  AbsoluteFill,
  OffthreadVideo,
  staticFile,
  useCurrentFrame,
  interpolate,
  Easing,
} from "remotion";
import { CHARTE } from "../theme/client-01";
import { Watermark } from "../clinical/ClientChrome";
import { FPS } from "./CapsuleChrome";

/**
 * Calques de la capsule v2 : sting portrait natif, listes de points animées
 * (mise en avant des propos), B-roll d'illustration, bandeau CTA.
 * Tous se posent PAR-DESSUS la piste voix continue — jamais ne la coupent.
 */

const C = CHARTE.color;

/* ---------- Sting : l'animation logo ORIGINALE (intro-imcp.mp4), ajustée au
   format portrait — vidéo entière contenue au centre, fond = même vidéo floutée.
   Aucun recadrage, aucune nouvelle animation. ---------- */
export const PortraitSting: React.FC<{ frames: number }> = ({ frames }) => {
  const f = useCurrentFrame();
  const op = Math.min(
    interpolate(f, [0, 8], [0, 1], { extrapolateRight: "clamp" }),
    interpolate(f, [frames - 12, frames], [1, 0], { extrapolateLeft: "clamp" })
  );
  return (
    <AbsoluteFill style={{ backgroundColor: "#000", opacity: op }}>
      {/* Fond : la même animation, agrandie et floutée (remplit le portrait) */}
      <AbsoluteFill style={{ filter: "blur(46px) brightness(0.45)", transform: "scale(1.6)" }}>
        <OffthreadVideo src={staticFile("intro-imcp.mp4")} trimBefore={210} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </AbsoluteFill>
      {/* Premier plan : l'animation originale ENTIÈRE, jamais recadrée */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <OffthreadVideo src={staticFile("intro-imcp.mp4")} trimBefore={210} muted style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ---------- Liste de points animée — mise en avant des propos ---------- */
export const KineticList: React.FC<{
  kicker: string;
  items: string[];
  frames: number;
  /** décalage (s) d'apparition de chaque item, calé sur le débit de parole */
  staggerSec?: number;
}> = ({ kicker, items, frames, staggerSec = 2.6 }) => {
  const f = useCurrentFrame();
  const op = Math.min(
    interpolate(f, [0, 10], [0, 1], { extrapolateRight: "clamp" }),
    interpolate(f, [frames - 12, frames], [1, 0], { extrapolateLeft: "clamp" })
  );
  return (
    <AbsoluteFill style={{ background: CHARTE.cardBackground, opacity: op, justifyContent: "center", padding: "0 96px" }}>
      <div
        style={{
          fontFamily: CHARTE.font.body,
          fontSize: 30,
          letterSpacing: "0.26em",
          textTransform: "uppercase",
          fontWeight: 700,
          color: C.champagne,
          marginBottom: 64,
        }}
      >
        {kicker}
      </div>
      {items.map((item, i) => {
        const start = Math.round(i * staggerSec * FPS);
        const io = interpolate(f, [start, start + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const tx = interpolate(f, [start, start + 16], [90, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        });
        const barH = interpolate(f, [start + 4, start + 20], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return (
          <div key={i} style={{ display: "flex", alignItems: "stretch", gap: 30, opacity: io, transform: `translateX(${tx}px)`, marginBottom: 54 }}>
            <div style={{ width: 6, borderRadius: 3, background: C.champagne, height: `${barH}%`, minHeight: 8, alignSelf: "center" }} />
            <div style={{ fontFamily: CHARTE.font.body, fontSize: 30, fontWeight: 500, color: C.slate, paddingTop: 2 }}>
              <span style={{ display: "block", fontSize: 52, fontWeight: 700, color: C.ivory, lineHeight: 1.18 }}>{item}</span>
            </div>
          </div>
        );
      })}
      <Watermark />
    </AbsoluteFill>
  );
};

/* ---------- B-roll d'illustration (vidéo clinique, muette, voix continue dessous) ---------- */
export const BrollCutaway: React.FC<{
  src: string;
  startSec: number;
  frames: number;
  label?: string;
}> = ({ src, startSec, frames, label }) => {
  const f = useCurrentFrame();
  const op = Math.min(
    interpolate(f, [0, 10], [0, 1], { extrapolateRight: "clamp" }),
    interpolate(f, [frames - 12, frames], [1, 0], { extrapolateLeft: "clamp" })
  );
  const zoom = interpolate(f, [0, 14], [1.15, 1.0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const flashOp = interpolate(f, [0, 3, 10], [0.9, 0.5, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ opacity: op, backgroundColor: "#000", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${zoom})` }}>
        <OffthreadVideo
          src={staticFile(src)}
          trimBefore={Math.round(startSec * FPS)}
          muted
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(255,252,244,1) 0%, rgba(73,182,201,0.5) 55%, rgba(73,182,201,0.15) 100%)",
          opacity: flashOp,
          mixBlendMode: "screen",
        }}
      />
      {label && (
        <div
          style={{
            position: "absolute",
            top: "8%",
            width: "100%",
            textAlign: "center",
            fontFamily: CHARTE.font.body,
            fontSize: 26,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            fontWeight: 700,
            color: C.ivory,
            textShadow: "0 2px 10px rgba(0,0,0,0.9)",
          }}
        >
          {label}
        </div>
      )}
      <Watermark />
    </AbsoluteFill>
  );
};

/* ---------- Bandeau CTA discret (le visage reste visible) ---------- */
export const CtaRibbon: React.FC<{ line1: string; line2: string; frames: number }> = ({ line1, line2, frames }) => {
  const f = useCurrentFrame();
  const op = Math.min(
    interpolate(f, [0, 12], [0, 1], { extrapolateRight: "clamp" }),
    interpolate(f, [frames - 14, frames], [1, 0], { extrapolateLeft: "clamp" })
  );
  const ty = interpolate(f, [0, 16], [40, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "9%",
        transform: `translateX(-50%) translateY(${ty}px)`,
        opacity: op,
        padding: "22px 42px",
        borderRadius: 18,
        background: "rgba(10,26,47,0.82)",
        backdropFilter: "blur(8px)",
        border: `1.5px solid ${C.champagne}55`,
        textAlign: "center",
      }}
    >
      <div style={{ fontFamily: CHARTE.font.body, fontSize: 34, fontWeight: 700, color: C.ivory }}>{line1}</div>
      <div style={{ fontFamily: CHARTE.font.body, marginTop: 8, fontSize: 24, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: C.champagne }}>
        {line2}
      </div>
    </div>
  );
};
