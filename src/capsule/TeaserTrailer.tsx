import { AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame, interpolate, Easing } from "remotion";
import { z } from "zod";
import { FPS, VerticalCaptions } from "./CapsuleChrome";
import { SlideAnimated } from "./CapsuleTypography";
import { Watermark } from "../clinical/ClientChrome";
import { CHARTE } from "../theme/client-01";

/**
 * TeaserTrailer — short 9:16 « trailer » qui BALAYE les points majeurs d'un cours
 * long. Architecture trailer : l'AUDIO est une piste unique pré-assemblée (voix
 * enchaînée par fondus + musique) → la voix ne peut PAS être hachée. Les visuels
 * (slides muettes + typographie) se posent PAR-DESSUS, calés sur les beats.
 * Une seule intro (titre en surimpression sur le 1er plan). Voir skill montage-imcp.
 */

const C = CHARTE.color;
const FLUO = "#5FE8FF";

const beatSchema = z.object({
  fromSec: z.number(),
  durSec: z.number(),
  kind: z.enum(["video", "slideAnim", "cta"]),
  src: z.string().optional(),
  srcStartSec: z.number().optional(),
  reframe: z.enum(["crop", "fit"]).optional(),
  kicker: z.string().optional(),
  caption: z.string().optional(),
  // slideAnim
  slideHeader: z.string().optional(),
  slideSub: z.string().optional(),
  slideGroups: z.array(z.object({ label: z.string(), items: z.array(z.string()) })).optional(),
  slideFooter: z.string().optional(),
  // cta
  ctaLine1: z.string().optional(),
  ctaUrl: z.string().optional(),
});

export const trailerSchema = z.object({
  src: z.string(),
  audioSrc: z.string(),
  title: z.string(),
  totalSec: z.number(),
  beats: z.array(beatSchema),
});
export type TrailerProps = z.infer<typeof trailerSchema> & Record<string, unknown>;

const fr = (s: number) => Math.round(s * FPS);
export const trailerDuration = (p: { totalSec: number }) => fr(p.totalSec);

/* ---------- Plan vidéo muet, recadré ---------- */
const VideoBeat: React.FC<{ src: string; startSec: number; frames: number; reframe: "crop" | "fit"; kicker?: string }> = ({ src, startSec, frames, reframe, kicker }) => {
  const f = useCurrentFrame();
  const op = Math.min(interpolate(f, [0, 13], [0, 1], { extrapolateRight: "clamp" }), interpolate(f, [frames - 13, frames], [1, 0], { extrapolateLeft: "clamp" }));
  const zoom = interpolate(f, [0, 12], [1.12, 1.0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const kb = interpolate(f, [0, frames], [1.0, 1.05]);
  return (
    <AbsoluteFill style={{ opacity: op, backgroundColor: "#000", overflow: "hidden" }}>
      {reframe === "fit" && (
        <AbsoluteFill style={{ filter: "blur(46px) brightness(0.4)", transform: "scale(1.4)" }}>
          <OffthreadVideo src={staticFile(src)} trimBefore={Math.round(startSec * FPS)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </AbsoluteFill>
      )}
      <AbsoluteFill style={{ transform: `scale(${kb * zoom * (reframe === "fit" ? 1.42 : 1)})`, alignItems: "center", justifyContent: "center" }}>
        <OffthreadVideo src={staticFile(src)} trimBefore={Math.round(startSec * FPS)} muted style={{ width: "100%", height: "100%", objectFit: reframe === "crop" ? "cover" : "contain", objectPosition: reframe === "crop" ? "72% 38%" : "center" }} />
      </AbsoluteFill>
      {kicker && (
        <div style={{ position: "absolute", top: "8%", width: "100%", textAlign: "center", fontFamily: CHARTE.font.body, fontSize: 26, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: FLUO, textShadow: `0 0 14px ${FLUO}66, 0 2px 8px rgba(0,0,0,0.9)`, opacity: Math.min(interpolate(f, [16, 26], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }), interpolate(f, [frames - 20, frames - 12], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })) }}>
          {kicker}
        </div>
      )}
      <Watermark />
    </AbsoluteFill>
  );
};

/* ---------- Titre en surimpression (1re intro unique, pas de carton séparé) ---------- */
const TitleOverlay: React.FC<{ title: string; frames: number }> = ({ title, frames }) => {
  const f = useCurrentFrame();
  const op = Math.min(interpolate(f, [4, 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }), interpolate(f, [frames - 16, frames], [1, 0], { extrapolateLeft: "clamp" }));
  const ty = interpolate(f, [4, 22], [24, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return (
    <div style={{ position: "absolute", top: "12%", width: "100%", textAlign: "center", opacity: op, transform: `translateY(${ty}px)`, padding: "0 70px" }}>
      <div style={{ fontFamily: CHARTE.font.display, fontSize: 74, fontWeight: 700, color: C.ivory, lineHeight: 1.1, textShadow: "0 3px 18px rgba(0,0,0,0.9)" }}>{title}</div>
    </div>
  );
};

/* ---------- Carton CTA final ---------- */
const CtaEnd: React.FC<{ line1: string; url: string; frames: number }> = ({ line1, url, frames }) => {
  const f = useCurrentFrame();
  const op = Math.min(interpolate(f, [0, 12], [0, 1], { extrapolateRight: "clamp" }), interpolate(f, [frames - 10, frames], [1, 0], { extrapolateLeft: "clamp" }));
  const ty = interpolate(f, [0, 18], [30, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const pulse = 1 + 0.05 * Math.sin(f / 8);
  return (
    <AbsoluteFill style={{ background: CHARTE.cardBackground, opacity: op, alignItems: "center", justifyContent: "center", padding: "0 90px" }}>
      <div style={{ textAlign: "center", transform: `translateY(${ty}px)` }}>
        <Img src={staticFile("logo-mark.png")} style={{ width: 260, display: "block", margin: "0 auto 40px" }} />
        <div style={{ fontFamily: CHARTE.font.display, fontSize: 60, fontWeight: 700, color: C.ivory, lineHeight: 1.18 }}>{line1}</div>
        <div style={{ marginTop: 34, transform: `scale(${pulse})`, display: "inline-block", background: FLUO, color: "#06131C", fontFamily: CHARTE.font.body, fontSize: 34, fontWeight: 800, padding: "22px 56px", borderRadius: 999 }}>{url}</div>
      </div>
    </AbsoluteFill>
  );
};

export const TeaserTrailer: React.FC<TrailerProps> = ({ src, audioSrc, title, beats }) => {
  const caps = beats.filter((b) => b.kind === "video" && b.caption).map((b) => ({ text: b.caption as string, fromSec: b.fromSec + 0.5, toSec: b.fromSec + b.durSec - 0.4 }));
  const titleBeat = beats[0];
  return (
    <AbsoluteFill style={{ backgroundColor: "#060D18" }}>
      {beats.map((b, i) => (
        <Sequence key={i} from={fr(b.fromSec)} durationInFrames={fr(b.durSec)} premountFor={45}>
          {b.kind === "video" && <VideoBeat src={src} startSec={b.srcStartSec!} frames={fr(b.durSec)} reframe={b.reframe ?? "fit"} kicker={b.kicker} />}
          {b.kind === "slideAnim" && <SlideAnimated header={b.slideHeader!} sub={b.slideSub!} groups={b.slideGroups!} footer={b.slideFooter!} frames={fr(b.durSec)} />}
          {b.kind === "cta" && <CtaEnd line1={b.ctaLine1!} url={b.ctaUrl!} frames={fr(b.durSec)} />}
        </Sequence>
      ))}

      {/* Titre unique en surimpression sur le 1er plan */}
      <Sequence from={fr(titleBeat.fromSec)} durationInFrames={fr(Math.min(titleBeat.durSec, 3.2))} premountFor={30}>
        <TitleOverlay title={title} frames={fr(Math.min(titleBeat.durSec, 3.2))} />
      </Sequence>

      <VerticalCaptions cues={caps} />

      <Audio src={staticFile(audioSrc)} />
    </AbsoluteFill>
  );
};
