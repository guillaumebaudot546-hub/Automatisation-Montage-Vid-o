import {
  AbsoluteFill,
  Audio,
  Loop,
  OffthreadVideo,
  Sequence,
  staticFile,
  useCurrentFrame,
  interpolate,
  Easing,
} from "remotion";
import { z } from "zod";
import { TitleCard, LowerThird, Watermark, EndCredits } from "./BaudotChrome";
import { CaptionTrack, CtaCard } from "./HighlightExtras";

/**
 * ClinicalHighlights — version courte (~1 min) d'un cas clinique.
 * Les MOMENTS (segments) et les SONS (instant, volume, tonalité) sont des
 * props éditables dans le panneau droit du Studio : sélection manuelle
 * des passages, insertion manuelle des bruitages, pitch réglable.
 */

export const FPS = 30;
const STING = 90;   // 3 s
const TITLE = 75;   // 2,5 s
const CREDITS = 120; // 4 s
const XFADE = 12;   // crossfade entre segments

export const highlightsSchema = z.object({
  src: z.string().describe("Fichier vidéo dans public/"),
  eyebrow: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  hasAudio: z.boolean().optional(),
  /** Moments retenus — éditables : début (s) + durée (s) dans le rush */
  segments: z
    .array(
      z.object({
        startSec: z.number().min(0).step(0.5).describe("Début dans le rush (s)"),
        durationSec: z.number().min(1).max(30).step(0.5).describe("Durée (s)"),
        transition: z
          .enum(["fade", "flash", "zoom"])
          .optional()
          .describe("Entrée du segment : fondu / flash / zoom punch"),
      })
    )
    .describe("Sélection des moments importants"),
  /** Bruitages — insertion manuelle : instant, volume, tonalité (pitch) */
  soundCues: z
    .array(
      z.object({
        sound: z.enum(["swoosh", "click", "bubble", "zoom", "impact", "riser"]),
        atSec: z.number().min(0).step(0.1).describe("Instant dans la vidéo finale (s)"),
        volume: z.number().min(0).max(1).step(0.01),
        pitch: z.number().min(0.5).max(2).step(0.05).describe("Tonalité (1 = normale)"),
      })
    )
    .describe("Insertion manuelle des sons"),
  /** Sous-titres narratifs — texte + fenêtre (s) sur la timeline finale */
  captions: z
    .array(
      z.object({
        text: z.string(),
        fromSec: z.number().min(0).step(0.1),
        toSec: z.number().min(0).step(0.1),
      })
    )
    .optional()
    .describe("Commentaire synchronisé aux visuels"),
  ctaLine1: z.string().optional().describe("Carton CTA — ligne principale"),
  ctaLine2: z.string().optional().describe("Carton CTA — ligne accent"),
  // Musique (mêmes réglages que le template long)
  musicSrc: z.string().optional(),
  musicOffsetSec: z.number().min(0).max(240).step(0.5).optional(),
  musicChromeVol: z.number().min(0).max(1).step(0.01).optional(),
  musicBedVol: z.number().min(0).max(1).step(0.01).optional(),
  sourceVol: z.number().min(0).max(2).step(0.05).optional(),
});

export type ClinicalHighlightsProps = z.infer<typeof highlightsSchema> &
  Record<string, unknown>;

const SFX_FILE: Record<string, string> = {
  swoosh: "sfx/swoosh.wav",
  click: "sfx/click.wav",
  bubble: "sfx/bubble.wav",
  zoom: "sfx/zoom.wav",
  impact: "sfx/impact.wav",
  riser: "sfx/cinematic-riser.mp3",
};

/** Durée totale en frames pour Root/calculateMetadata. */
const CTA_CARD = 120; // 4 s si ctaLine1 fourni

export const highlightsDuration = (
  segments: { durationSec: number }[],
  hasCta?: boolean
) =>
  STING +
  TITLE +
  segments.reduce((acc, s) => acc + Math.round(s.durationSec * FPS), 0) +
  (hasCta ? CTA_CARD : 0) +
  CREDITS;

export const ClinicalHighlights: React.FC<ClinicalHighlightsProps> = ({
  src,
  eyebrow,
  title,
  subtitle,
  hasAudio,
  segments,
  soundCues,
  musicSrc = "music/concerto.mp3",
  musicOffsetSec = 0,
  musicChromeVol = 0.26,
  musicBedVol = 0.14,
  sourceVol = 1.0,
  captions,
  ctaLine1,
  ctaLine2 = "Contactez IMCP",
}) => {
  const frame = useCurrentFrame();
  const contentFrom = STING + TITLE;

  // Position de chaque segment sur la timeline finale
  let cursor = contentFrom;
  const placed = segments.map((s) => {
    const from = cursor;
    const dur = Math.round(s.durationSec * FPS);
    cursor += dur;
    return { ...s, from, dur };
  });
  const ctaFrom = cursor;
  const ctaDur = ctaLine1 ? CTA_CARD : 0;
  const creditsFrom = ctaFrom + ctaDur;
  const total = creditsFrom + CREDITS;

  // Musique : habillage fort, geste discret, fondu final
  const musicVol = interpolate(
    frame,
    [0, 30, contentFrom - 15, contentFrom + 45, creditsFrom - 40, creditsFrom, total - 24, total],
    [0, musicChromeVol, musicChromeVol, musicBedVol, musicBedVol, musicChromeVol, musicChromeVol, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "#0A1A2F" }}>
      {/* Sting logo (compact) */}
      <Sequence from={0} durationInFrames={STING} premountFor={30}>
        <AbsoluteFill style={{ backgroundColor: "#000" }}>
          <OffthreadVideo
            src={staticFile("intro-imcp.mp4")}
            trimBefore={210}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </AbsoluteFill>
      </Sequence>

      {/* Carton-titre */}
      <Sequence from={STING} durationInFrames={TITLE} premountFor={30}>
        <TitleCard eyebrow={eyebrow} title={title} subtitle={subtitle} />
      </Sequence>

      {/* Segments sélectionnés, transition d'entrée réglable par segment */}
      {placed.map((s, i) => (
        <Sequence key={i} from={s.from} durationInFrames={s.dur + XFADE} premountFor={45}>
          <SegmentBlock
            src={src}
            startSec={s.startSec}
            dur={s.dur}
            hasAudio={hasAudio}
            sourceVol={sourceVol}
            title={i === 0 && !captions ? title : undefined}
            transition={s.transition ?? "fade"}
          />
        </Sequence>
      ))}

      {/* Carton CTA */}
      {ctaLine1 && (
        <Sequence from={ctaFrom} durationInFrames={CTA_CARD} premountFor={30}>
          <CtaCard line1={ctaLine1} line2={ctaLine2} />
        </Sequence>
      )}

      {/* Générique */}
      <Sequence from={creditsFrom} durationInFrames={CREDITS} premountFor={30}>
        <EndCredits />
      </Sequence>

      {/* Sous-titres narratifs synchronisés */}
      {captions && <CaptionTrack captions={captions} />}

      {/* Sons — insertion manuelle (instant, volume, tonalité) */}
      {soundCues.map((c, i) => (
        <Sequence key={`c${i}`} from={Math.round(c.atSec * FPS)} durationInFrames={90}>
          <Audio
            src={staticFile(SFX_FILE[c.sound])}
            volume={c.volume}
            playbackRate={c.pitch}
          />
        </Sequence>
      ))}

      {/* Musique */}
      <Loop durationInFrames={Math.round(4.066 * 60 * FPS)}>
        <Audio
          src={staticFile(musicSrc)}
          trimBefore={Math.round(musicOffsetSec * FPS)}
          volume={musicVol}
        />
      </Loop>
    </AbsoluteFill>
  );
};

/* ---------- Un segment : extrait + transition d'entrée + habillage ---------- */
const SegmentBlock: React.FC<{
  src: string;
  startSec: number;
  dur: number;
  hasAudio?: boolean;
  sourceVol: number;
  title?: string;
  transition: "fade" | "flash" | "zoom";
}> = ({ src, startSec, dur, hasAudio, sourceVol, title, transition }) => {
  const f = useCurrentFrame();

  // Entrée selon la transition choisie
  const enterOp =
    transition === "fade"
      ? interpolate(f, [0, XFADE], [0, 1], { extrapolateRight: "clamp" })
      : interpolate(f, [0, 4], [0, 1], { extrapolateRight: "clamp" }); // flash/zoom : cut quasi net
  const exitOp = interpolate(f, [dur, dur + XFADE], [1, 0], { extrapolateLeft: "clamp" });
  const op = Math.min(enterOp, exitOp);

  // Zoom punch : 1.20 → 1.0 en 14 frames (ease out), sinon Ken Burns léger
  const punch =
    transition === "zoom"
      ? interpolate(f, [0, 14], [1.2, 1.0], {
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        })
      : 1;
  const kb = interpolate(f, [0, dur + XFADE], [1.0, 1.03]);

  // Flash : voile blanc-champagne qui claque puis disparaît (10 frames)
  const flashOp =
    transition === "flash"
      ? interpolate(f, [0, 3, 10], [0.95, 0.6, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 0;

  return (
    <AbsoluteFill style={{ opacity: op, backgroundColor: "#000", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${kb * punch})` }}>
        <OffthreadVideo
          src={staticFile(src)}
          trimBefore={Math.round(startSec * FPS)}
          muted={!hasAudio}
          volume={sourceVol}
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
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
      {title && <LowerThird title={title} />}
    </AbsoluteFill>
  );
};
