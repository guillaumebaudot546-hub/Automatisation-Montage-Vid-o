import {
  AbsoluteFill,
  Img,
  OffthreadVideo,
  staticFile,
  useCurrentFrame,
  interpolate,
  Easing,
} from "remotion";

/**
 * Story — prologue storytelling (12,5 s, muet, avant la voix off).
 * Arc : constat → problème → bascule. Visuels plein cadre (aucun vide),
 * texte éditorial serif par-dessus un voile navy.
 * Beat 1 : 0-250 · Beat 2 : 250-500 · Beat 3 : 500-750.
 */

const BEAT = 250;

/** Texte d'un beat : eyebrow + phrase serif, entrée mot à mot. */
const BeatText: React.FC<{ eyebrow: string; lines: string[]; local: number }> = ({
  eyebrow,
  lines,
  local,
}) => {
  const eyeOp = interpolate(local, [10, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div style={{ position: "absolute", left: 120, bottom: 140, maxWidth: 1300 }}>
      <div
        style={{
          opacity: eyeOp,
          fontSize: 17,
          letterSpacing: "0.34em",
          textTransform: "uppercase",
          fontWeight: 600,
          color: "var(--cyan-2)",
          marginBottom: 22,
        }}
      >
        {eyebrow}
      </div>
      {lines.map((l, i) => {
        const d = 24 + i * 14;
        const op = interpolate(local, [d, d + 18], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const ty = interpolate(local, [d, d + 22], [28, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        });
        return (
          <div
            key={i}
            className="font-serif"
            style={{
              fontSize: 74,
              fontWeight: 500,
              lineHeight: 1.14,
              color: "var(--white)",
              opacity: op,
              transform: `translateY(${ty}px)`,
            }}
          >
            {l}
          </div>
        );
      })}
    </div>
  );
};

/** Média plein cadre avec Ken Burns discret + voile navy. */
const FullBleed: React.FC<{
  children: React.ReactNode;
  local: number;
  dur: number;
}> = ({ children, local, dur }) => {
  const op = Math.min(
    interpolate(local, [0, 18], [0, 1], { extrapolateRight: "clamp" }),
    interpolate(local, [dur - 18, dur], [1, 0], { extrapolateLeft: "clamp" })
  );
  const scale = interpolate(local, [0, dur], [1.06, 1.14], {
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ opacity: op, overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${scale})` }}>{children}</AbsoluteFill>
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(6,13,24,0.45) 0%, rgba(6,13,24,0.30) 45%, rgba(6,13,24,0.88) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};

export const Story: React.FC = () => {
  const f = useCurrentFrame();

  // Beat 3 : question de bascule, centrée
  const b3 = f - 2 * BEAT;
  const b3op = Math.min(
    interpolate(b3, [10, 34], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
    interpolate(b3, [BEAT - 26, BEAT], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
  );
  const underline = interpolate(b3, [50, 95], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#060D18" }}>
      {/* Beat 1 — le constat (vidéo clinique plein cadre) */}
      {f < BEAT + 20 && (
        <FullBleed local={f} dur={BEAT}>
          <OffthreadVideo
            src={staticFile("clinical-procedure.mp4")}
            muted
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </FullBleed>
      )}
      {f < BEAT + 20 && (
        <BeatText
          eyebrow="Le constat"
          lines={["1 adulte sur 2 souffre", "de maladie parodontale."]}
          local={f}
        />
      )}

      {/* Beat 2 — le problème (photo laser plein cadre) */}
      {f >= BEAT - 20 && f < 2 * BEAT + 20 && (
        <FullBleed local={f - BEAT} dur={BEAT}>
          <Img
            src={staticFile("photo-laser.jpg")}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </FullBleed>
      )}
      {f >= BEAT - 20 && f < 2 * BEAT + 20 && (
        <BeatText
          eyebrow="Le problème"
          lines={["Des protocoles longs, invasifs,", "redoutés des patients."]}
          local={f - BEAT}
        />
      )}

      {/* Beat 3 — la bascule (question, plein noir) */}
      {f >= 2 * BEAT - 20 && (
        <AbsoluteFill
          style={{ alignItems: "center", justifyContent: "center", opacity: b3op }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              className="font-serif"
              style={{
                fontSize: 96,
                fontWeight: 500,
                fontStyle: "italic",
                color: "var(--white)",
                letterSpacing: "-0.01em",
              }}
            >
              Et si vous pouviez{" "}
              <span style={{ color: "var(--cyan-1)" }}>changer ça&nbsp;?</span>
            </div>
            <div
              style={{
                margin: "30px auto 0",
                width: `${underline}%`,
                maxWidth: 520,
                height: 2,
                background:
                  "linear-gradient(90deg, transparent, var(--cyan-2), transparent)",
              }}
            />
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
