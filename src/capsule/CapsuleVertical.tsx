import { AbsoluteFill, OffthreadVideo, Sequence, staticFile } from "remotion";
import { z } from "zod";
import {
  FPS,
  XFADE,
  SegmentBlock,
  SlideInsert,
  VerticalTitle,
  VerticalCaptions,
  VerticalCard,
  EndCard,
} from "./CapsuleChrome";

/**
 * CapsuleVertical — capsule sociale verticale 9:16 (Reels/TikTok/Shorts).
 * Réutilise la doctrine de montage (segments, transitions fade/zoom/flash) et
 * ajoute un INSERT SLIDE plein cadre pour illustrer le propos du praticien.
 * Orchestration timeline seule ; le chrome vit dans CapsuleChrome.tsx.
 */

const STING = 75; // 2,5 s
const TITLE = 90; // 3 s
const SLIDE = 210; // 7 s (insert pédagogique)
const CREDITS = 120; // 4 s

export const capsuleSchema = z.object({
  src: z.string(),
  slideSrc: z.string(),
  eyebrow: z.string(),
  title: z.string(),
  slideLabel: z.string(),
  slideAfterIndex: z.number().int().min(0),
  segments: z.array(
    z.object({
      startSec: z.number().min(0).step(0.5),
      durationSec: z.number().min(1).max(30).step(0.5),
      transition: z.enum(["fade", "flash", "zoom"]).optional(),
      caption: z.string().optional(),
    })
  ),
  ctaLine1: z.string().optional(),
  ctaLine2: z.string().optional(),
});

export type CapsuleProps = z.infer<typeof capsuleSchema> & Record<string, unknown>;

const segFrames = (s: { durationSec: number }) => Math.round(s.durationSec * FPS);

export const capsuleDuration = (segments: { durationSec: number }[], hasCta?: boolean) =>
  STING + TITLE + segments.reduce((a, s) => a + segFrames(s), 0) + SLIDE + (hasCta ? CREDITS : 0) + CREDITS;

export const CapsuleVertical: React.FC<CapsuleProps> = ({
  src,
  slideSrc,
  eyebrow,
  title,
  slideLabel,
  slideAfterIndex,
  segments,
  ctaLine1,
  ctaLine2 = "Contactez IMCP",
}) => {
  const contentFrom = STING + TITLE;

  // Placement des blocs sur la timeline finale, slide insérée après l'index voulu
  let cursor = contentFrom;
  const placed: { kind: "seg" | "slide"; from: number; dur: number; seg?: (typeof segments)[number] }[] = [];
  segments.forEach((seg, i) => {
    const dur = segFrames(seg);
    placed.push({ kind: "seg", from: cursor, dur, seg });
    cursor += dur;
    if (i === slideAfterIndex) {
      placed.push({ kind: "slide", from: cursor, dur: SLIDE });
      cursor += SLIDE;
    }
  });
  const ctaFrom = cursor;
  const creditsFrom = ctaFrom + (ctaLine1 ? CREDITS : 0);

  // Sous-titres : fenêtre finale = fenêtre du segment (marge intérieure)
  const captionCues = placed
    .filter((p) => p.kind === "seg" && p.seg?.caption)
    .map((p) => ({
      text: p.seg!.caption as string,
      fromSec: (p.from + 8) / FPS,
      toSec: (p.from + p.dur - 6) / FPS,
    }));

  return (
    <AbsoluteFill style={{ backgroundColor: "#0A1A2F" }}>
      <Sequence durationInFrames={STING} premountFor={30}>
        <AbsoluteFill style={{ backgroundColor: "#000" }}>
          <OffthreadVideo src={staticFile("intro-imcp.mp4")} trimBefore={210} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </AbsoluteFill>
      </Sequence>

      <Sequence from={STING} durationInFrames={TITLE} premountFor={30}>
        <VerticalTitle eyebrow={eyebrow} title={title} />
      </Sequence>

      {placed.map((p, i) =>
        p.kind === "seg" ? (
          <Sequence key={i} from={p.from} durationInFrames={p.dur + XFADE} premountFor={45}>
            <SegmentBlock src={src} startSec={p.seg!.startSec} dur={p.dur} transition={p.seg!.transition ?? (i === 0 ? "fade" : "zoom")} />
          </Sequence>
        ) : (
          <Sequence key={i} from={p.from} durationInFrames={p.dur} premountFor={30}>
            <SlideInsert slideSrc={slideSrc} label={slideLabel} frames={SLIDE} />
          </Sequence>
        )
      )}

      {ctaLine1 && (
        <Sequence from={ctaFrom} durationInFrames={CREDITS} premountFor={30}>
          <VerticalCard line1={ctaLine1} line2={ctaLine2} />
        </Sequence>
      )}

      <Sequence from={creditsFrom} durationInFrames={CREDITS} premountFor={30}>
        <EndCard />
      </Sequence>

      <VerticalCaptions cues={captionCues} />
    </AbsoluteFill>
  );
};
