import { AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame, interpolate, Easing } from "remotion";
import { z } from "zod";
import { FPS, VerticalTitle, VerticalCaptions, EndCard } from "./CapsuleChrome";
import { Watermark } from "../clinical/BaudotChrome";
import { PortraitSting, KineticList, BrollCutaway, CtaRibbon } from "./CapsuleOverlays";
import { BigStat, ProgressChart, SiteCard } from "./CapsuleInfographics";
import { PunchCard, SlideAnimated } from "./CapsuleTypography";

/**
 * CapsuleV2 — capsule verticale « voix continue ».
 * La parole du praticien est la colonne vertébrale : elle n'est JAMAIS coupée
 * en cours de phrase (spans calés sur la transcription). Les visuels — slide,
 * listes animées, B-roll, CTA — se posent par-dessus sans toucher l'audio.
 */

const STING = 75; // 2,5 s
const TITLE = 90; // 3 s
const CREDITS = 120; // 4 s

export const capsuleV2Schema = z.object({
  src: z.string(),
  eyebrow: z.string(),
  title: z.string(),
  /** Plages de voix conservées (s, bornes = fins de phrases de la transcription) */
  spans: z.array(z.object({ fromSec: z.number(), toSec: z.number() })),
  /** Calques plein cadre : slide, liste animée ou B-roll — en temps FINAL (s) */
  overlays: z.array(
    z.object({
      atSec: z.number(),
      durationSec: z.number(),
      kind: z.enum(["slide", "list", "broll", "stat", "chart", "site", "punch", "slideAnim"]),
      slideSrc: z.string().optional(),
      label: z.string().optional(),
      kicker: z.string().optional(),
      items: z.array(z.string()).optional(),
      staggerSec: z.number().optional(),
      brollSrc: z.string().optional(),
      brollStartSec: z.number().optional(),
      statValue: z.string().optional(),
      chartTitle: z.string().optional(),
      chartCaption: z.string().optional(),
      siteUrl: z.string().optional(),
      siteTitle: z.string().optional(),
      siteSubtitle: z.string().optional(),
      punchPairs: z.array(z.object({ big: z.string(), small: z.string() })).optional(),
      slideHeader: z.string().optional(),
      slideSub: z.string().optional(),
      slideGroups: z.array(z.object({ label: z.string(), items: z.array(z.string()) })).optional(),
      slideFooter: z.string().optional(),
    })
  ),
  cta: z.object({ atSec: z.number(), durationSec: z.number(), line1: z.string(), line2: z.string() }).optional(),
  /** Lit musical discret sous la voix (fondus bakés dans le fichier) */
  music: z.object({ src: z.string(), volume: z.number().min(0).max(1) }).optional(),
  captions: z.array(z.object({ text: z.string(), fromSec: z.number(), toSec: z.number() })),
});

export type CapsuleV2Props = z.infer<typeof capsuleV2Schema> & Record<string, unknown>;

export const capsuleV2Duration = (spans: { fromSec: number; toSec: number }[]) =>
  STING + TITLE + Math.round(spans.reduce((a, s) => a + (s.toSec - s.fromSec), 0) * FPS) + CREDITS;

/* Piste principale : le rush, plein cadre, SANS zoom (source basse résolution) */
const VoiceSpan: React.FC<{ src: string; fromSec: number; dur: number; punchIn: boolean }> = ({ src, fromSec, dur, punchIn }) => {
  const f = useCurrentFrame();
  // Entrée : léger zoom-punch UNIQUEMENT à la jonction des spans (masque la coupe)
  const punch = punchIn
    ? interpolate(f, [0, 12], [1.08, 1.0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) })
    : 1;
  const fadeOut = interpolate(f, [dur - 10, dur], [1, 0], { extrapolateLeft: "clamp" });
  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden", opacity: fadeOut }}>
      <AbsoluteFill style={{ transform: `scale(${punch})` }}>
        <OffthreadVideo
          src={staticFile(src)}
          trimBefore={Math.round(fromSec * FPS)}
          volume={1}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>
      <Watermark />
    </AbsoluteFill>
  );
};

/* Slide plein cadre (voix continue dessous) */
const SlideOver: React.FC<{ slideSrc: string; label?: string; frames: number }> = ({ slideSrc, label, frames }) => {
  const f = useCurrentFrame();
  const op = Math.min(
    interpolate(f, [0, 10], [0, 1], { extrapolateRight: "clamp" }),
    interpolate(f, [frames - 12, frames], [1, 0], { extrapolateLeft: "clamp" })
  );
  const push = interpolate(f, [0, frames], [1.0, 1.05], { easing: Easing.inOut(Easing.ease) });
  return (
    <AbsoluteFill style={{ background: "rgba(6,13,24,0.985)", opacity: op, alignItems: "center", justifyContent: "center" }}>
      {label && (
        <div style={{ position: "absolute", top: "14%", width: "100%", textAlign: "center", fontFamily: "'Manrope', system-ui, sans-serif", fontSize: 27, letterSpacing: "0.22em", textTransform: "uppercase", fontWeight: 700, color: "#49B6C9" }}>
          {label}
        </div>
      )}
      <Img src={staticFile(slideSrc)} style={{ width: "92%", borderRadius: 16, boxShadow: "0 30px 80px rgba(0,0,0,0.6)", transform: `scale(${push})` }} />
      <Watermark />
    </AbsoluteFill>
  );
};

export const CapsuleV2: React.FC<CapsuleV2Props> = ({ src, eyebrow, title, spans, overlays, cta, music, captions }) => {
  const contentFrom = STING + TITLE;

  // Placement des spans voix bout à bout
  let cursor = contentFrom;
  const placedSpans = spans.map((s, i) => {
    const dur = Math.round((s.toSec - s.fromSec) * FPS);
    const from = cursor;
    cursor += dur;
    return { ...s, from, dur, punchIn: i > 0 };
  });
  const creditsFrom = cursor;

  const toF = (sec: number) => contentFrom + Math.round(sec * FPS);

  return (
    <AbsoluteFill style={{ backgroundColor: "#060D18" }}>
      <Sequence durationInFrames={STING} premountFor={30}>
        <PortraitSting frames={STING} />
      </Sequence>

      <Sequence from={STING} durationInFrames={TITLE} premountFor={30}>
        <VerticalTitle eyebrow={eyebrow} title={title} />
      </Sequence>

      {/* Colonne vertébrale : la voix, jamais coupée en cours de phrase */}
      {placedSpans.map((s, i) => (
        <Sequence key={`v${i}`} from={s.from} durationInFrames={s.dur} premountFor={60}>
          <VoiceSpan src={src} fromSec={s.fromSec} dur={s.dur} punchIn={s.punchIn} />
        </Sequence>
      ))}

      {/* Calques d'illustration — par-dessus, l'audio du rush continue dessous */}
      {overlays.map((o, i) => {
        const frames = Math.round(o.durationSec * FPS);
        return (
          <Sequence key={`o${i}`} from={toF(o.atSec)} durationInFrames={frames} premountFor={45}>
            {o.kind === "slide" && <SlideOver slideSrc={o.slideSrc!} label={o.label} frames={frames} />}
            {o.kind === "list" && <KineticList kicker={o.kicker!} items={o.items!} frames={frames} staggerSec={o.staggerSec} />}
            {o.kind === "broll" && <BrollCutaway src={o.brollSrc!} startSec={o.brollStartSec!} frames={frames} label={o.label} />}
            {o.kind === "stat" && <BigStat value={o.statValue!} label={o.label!} frames={frames} />}
            {o.kind === "chart" && <ProgressChart title={o.chartTitle!} caption={o.chartCaption!} frames={frames} />}
            {o.kind === "site" && <SiteCard url={o.siteUrl!} title={o.siteTitle!} subtitle={o.siteSubtitle!} frames={frames} />}
            {o.kind === "punch" && <PunchCard pairs={o.punchPairs!} frames={frames} />}
            {o.kind === "slideAnim" && (
              <SlideAnimated header={o.slideHeader!} sub={o.slideSub!} groups={o.slideGroups!} footer={o.slideFooter!} frames={frames} />
            )}
          </Sequence>
        );
      })}

      {cta && (
        <Sequence from={toF(cta.atSec)} durationInFrames={Math.round(cta.durationSec * FPS)} premountFor={30}>
          <CtaRibbon line1={cta.line1} line2={cta.line2} frames={Math.round(cta.durationSec * FPS)} />
        </Sequence>
      )}

      <Sequence from={creditsFrom} durationInFrames={CREDITS} premountFor={30}>
        <EndCard />
      </Sequence>

      {/* Lit musical — démarre avec la voix, fondus bakés dans le fichier */}
      {music && (
        <Sequence from={STING}>
          <Audio src={staticFile(music.src)} volume={music.volume} />
        </Sequence>
      )}

      {/* Sous-titres : la transcription intégrale, nettoyée, mot pour mot */}
      <VerticalCaptions
        cues={captions.map((c) => ({ text: c.text, fromSec: contentFrom / FPS + c.fromSec, toSec: contentFrom / FPS + c.toSec }))}
        muteWindows={overlays
          .filter((o) => o.kind !== "broll")
          .map((o) => ({ fromSec: contentFrom / FPS + o.atSec, toSec: contentFrom / FPS + o.atSec + o.durationSec }))}
      />
    </AbsoluteFill>
  );
};
