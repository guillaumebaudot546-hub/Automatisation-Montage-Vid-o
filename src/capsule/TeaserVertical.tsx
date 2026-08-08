import { AbsoluteFill, Audio, OffthreadVideo, Sequence, staticFile, useCurrentFrame, interpolate, Easing } from "remotion";
import { z } from "zod";
import { FPS, VerticalTitle, VerticalCaptions } from "./CapsuleChrome";
import { Watermark } from "../clinical/ClientChrome";
import { CHARTE } from "../theme/client-01";

/**
 * TeaserVertical — short 9:16 tiré d'un cours long PAYSAGE (16:9).
 * Gère le recadrage : "crop" (visage centré → plein cadre) ou "fit" (slide/plan
 * large → contenu entier sur fond flouté). Structure teaser : HOOK → titre →
 * valeur → CTA, rythme rapide, musique.
 */

const HOOK_HOLD = 6; // frames de battement avant le hook
const TITLE = 66; // 2,2 s
const CTA = 96; // 3,2 s
const XF = 9;
const C = CHARTE.color;
const FLUO = "#5FE8FF";

const clipSchema = z.object({
  startSec: z.number(),
  durationSec: z.number(),
  reframe: z.enum(["crop", "fit"]),
  caption: z.string().optional(),
  kicker: z.string().optional(),
});

export const teaserSchema = z.object({
  src: z.string(),
  eyebrow: z.string(),
  title: z.string(),
  hook: clipSchema,
  value: z.array(clipSchema),
  cta: clipSchema,
  ctaLine1: z.string(),
  ctaLine2: z.string(),
  music: z.object({ src: z.string(), volume: z.number() }).optional(),
});
export type TeaserProps = z.infer<typeof teaserSchema> & Record<string, unknown>;

const fr = (s: number) => Math.round(s * FPS);

export const teaserDuration = (p: { hook: { durationSec: number }; value: { durationSec: number }[]; cta: { durationSec: number } }) =>
  fr(p.hook.durationSec) + TITLE + p.value.reduce((a, v) => a + fr(v.durationSec), 0) + fr(p.cta.durationSec) + CTA;

/* ---------- Un plan source, recadré selon le mode ---------- */
const Clip: React.FC<{ src: string; startSec: number; dur: number; reframe: "crop" | "fit"; punch?: boolean; kicker?: string }> = ({
  src,
  startSec,
  dur,
  reframe,
  punch,
  kicker,
}) => {
  const f = useCurrentFrame();
  const enter = interpolate(f, [0, XF], [0, 1], { extrapolateRight: "clamp" });
  const exit = interpolate(f, [dur, dur + XF], [1, 0], { extrapolateLeft: "clamp" });
  const op = Math.min(enter, exit);
  const pz = punch ? interpolate(f, [0, 12], [1.18, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }) : 1;
  const kb = interpolate(f, [0, dur + XF], [1.0, 1.05]);
  const trim = Math.round(startSec * FPS);

  return (
    <AbsoluteFill style={{ opacity: op, backgroundColor: "#000", overflow: "hidden" }}>
      {reframe === "fit" && (
        <AbsoluteFill style={{ filter: "blur(44px) brightness(0.4)", transform: "scale(1.4)" }}>
          <OffthreadVideo src={staticFile(src)} trimBefore={trim} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </AbsoluteFill>
      )}
      <AbsoluteFill style={{ transform: `scale(${kb * pz})`, alignItems: "center", justifyContent: "center" }}>
        <OffthreadVideo
          src={staticFile(src)}
          trimBefore={trim}
          volume={1}
          style={{ width: "100%", height: "100%", objectFit: reframe === "crop" ? "cover" : "contain" }}
        />
      </AbsoluteFill>
      {kicker && (
        <div style={{ position: "absolute", top: "9%", width: "100%", textAlign: "center", fontFamily: CHARTE.font.body, fontSize: 26, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: FLUO, textShadow: `0 0 14px ${FLUO}66, 0 2px 8px rgba(0,0,0,0.9)` }}>
          {kicker}
        </div>
      )}
      <Watermark />
    </AbsoluteFill>
  );
};

/* ---------- Carton CTA teaser ---------- */
const TeaserCta: React.FC<{ line1: string; line2: string }> = ({ line1, line2 }) => {
  const f = useCurrentFrame();
  const op = interpolate(f, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  const ty = interpolate(f, [0, 18], [30, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const pulse = 1 + 0.05 * Math.sin(f / 8);
  return (
    <AbsoluteFill style={{ background: CHARTE.cardBackground, opacity: op, alignItems: "center", justifyContent: "center", padding: "0 90px" }}>
      <div style={{ textAlign: "center", transform: `translateY(${ty}px)` }}>
        <div style={{ fontFamily: CHARTE.font.display, fontSize: 66, fontWeight: 700, color: C.ivory, lineHeight: 1.18 }}>{line1}</div>
        <div style={{ marginTop: 34, transform: `scale(${pulse})`, display: "inline-block", background: FLUO, color: "#06131C", fontFamily: CHARTE.font.body, fontSize: 32, fontWeight: 800, padding: "22px 54px", borderRadius: 999 }}>
          {line2}
        </div>
      </div>
      <Watermark />
    </AbsoluteFill>
  );
};

export const TeaserVertical: React.FC<TeaserProps> = ({ src, eyebrow, title, hook, value, cta, ctaLine1, ctaLine2, music }) => {
  // Placement : HOOK d'abord (accroche), puis titre, valeur, plan CTA, carton CTA
  let cur = HOOK_HOLD;
  const hookFrom = cur;
  cur += fr(hook.durationSec);
  const titleFrom = cur;
  cur += TITLE;
  const placedValue = value.map((v) => {
    const from = cur;
    cur += fr(v.durationSec);
    return { ...v, from };
  });
  const ctaClipFrom = cur;
  cur += fr(cta.durationSec);
  const ctaCardFrom = cur;

  const caps: { text: string; fromSec: number; toSec: number }[] = [];
  const pushCap = (from: number, dur: number, text?: string) => {
    if (text) caps.push({ text, fromSec: (from + 6) / FPS, toSec: (from + dur - 4) / FPS });
  };
  pushCap(hookFrom, fr(hook.durationSec), hook.caption);
  placedValue.forEach((v) => pushCap(v.from, fr(v.durationSec), v.caption));
  pushCap(ctaClipFrom, fr(cta.durationSec), cta.caption);

  return (
    <AbsoluteFill style={{ backgroundColor: "#060D18" }}>
      <Sequence from={hookFrom} durationInFrames={fr(hook.durationSec) + XF} premountFor={45}>
        <Clip src={src} startSec={hook.startSec} dur={fr(hook.durationSec)} reframe={hook.reframe} kicker={hook.kicker} />
      </Sequence>

      <Sequence from={titleFrom} durationInFrames={TITLE} premountFor={30}>
        <VerticalTitle eyebrow={eyebrow} title={title} />
      </Sequence>

      {placedValue.map((v, i) => (
        <Sequence key={i} from={v.from} durationInFrames={fr(v.durationSec) + XF} premountFor={45}>
          <Clip src={src} startSec={v.startSec} dur={fr(v.durationSec)} reframe={v.reframe} punch kicker={v.kicker} />
        </Sequence>
      ))}

      <Sequence from={ctaClipFrom} durationInFrames={fr(cta.durationSec) + XF} premountFor={45}>
        <Clip src={src} startSec={cta.startSec} dur={fr(cta.durationSec)} reframe={cta.reframe} />
      </Sequence>

      <Sequence from={ctaCardFrom} durationInFrames={CTA} premountFor={30}>
        <TeaserCta line1={ctaLine1} line2={ctaLine2} />
      </Sequence>

      <VerticalCaptions cues={caps} />

      {music && (
        <Sequence>
          <Audio src={staticFile(music.src)} volume={() => music.volume} />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};
