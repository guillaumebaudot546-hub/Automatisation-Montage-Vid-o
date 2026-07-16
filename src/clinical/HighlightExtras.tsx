import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
} from "remotion";
import { BAUDOT } from "../theme/baudot";

/**
 * Extras des vidéos courtes : sous-titres narratifs synchronisés (bandeau
 * bas) + carton CTA final. Utilisés par ClinicalHighlights uniquement.
 */

const C = BAUDOT.color;
const FPS = 30;

export interface CaptionCue {
  text: string;
  fromSec: number;
  toSec: number;
}

/* ---------- Bandeau sous-titre narratif ---------- */
export const CaptionTrack: React.FC<{ captions: CaptionCue[] }> = ({ captions }) => {
  const f = useCurrentFrame();

  return (
    <>
      {captions.map((c, i) => {
        const from = Math.round(c.fromSec * FPS);
        const to = Math.round(c.toSec * FPS);
        if (f < from - 10 || f > to + 10) return null;
        const op = Math.min(
          interpolate(f, [from, from + 10], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          interpolate(f, [to - 10, to], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        );
        const ty = interpolate(f, [from, from + 14], [16, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        });
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: "50%",
              bottom: 54,
              transform: `translateX(-50%) translateY(${ty}px)`,
              opacity: op,
              maxWidth: 1500,
              padding: "10px 24px",
            }}
          >
            <div
              style={{
                fontFamily: BAUDOT.font.body,
                fontSize: 27,
                fontWeight: 600,
                lineHeight: 1.42,
                color: C.ivory,
                textAlign: "center",
                textShadow:
                  "0 1px 3px rgba(0,0,0,0.95), 0 2px 10px rgba(0,0,0,0.85), 0 0 26px rgba(0,0,0,0.7)",
              }}
            >
              {c.text}
            </div>
          </div>
        );
      })}
    </>
  );
};

/* ---------- Carton CTA final ---------- */
export const CtaCard: React.FC<{ line1: string; line2: string }> = ({ line1, line2 }) => {
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const op = Math.min(
    interpolate(f, [0, 14], [0, 1], { extrapolateRight: "clamp" }),
    interpolate(f, [durationInFrames - 14, durationInFrames], [1, 0], {
      extrapolateLeft: "clamp",
    })
  );
  const ty = interpolate(f, [0, 20], [20, 0], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const lineW = interpolate(f, [18, 55], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill
      style={{
        background: BAUDOT.cardBackground,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ textAlign: "center", opacity: op, transform: `translateY(${ty}px)`, maxWidth: 1500 }}>
        <div
          style={{
            fontFamily: BAUDOT.font.display,
            fontSize: 66,
            fontWeight: 600,
            color: C.ivory,
            lineHeight: 1.2,
          }}
        >
          {line1}
        </div>
        <div
          style={{
            fontFamily: BAUDOT.font.body,
            marginTop: 24,
            fontSize: 30,
            fontWeight: 600,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: C.champagne,
          }}
        >
          {line2}
        </div>
        <div
          style={{
            margin: "32px auto 0",
            width: `${lineW}%`,
            maxWidth: 420,
            height: 1.5,
            background: BAUDOT.hairline(),
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
