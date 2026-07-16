import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  Easing,
} from "remotion";
import { C, useFade } from "./heroShared";

/**
 * Ouverture du hero : S1 logo reveal (0-3 s) + S2 tagline staggered
 * avec maillage CGI (3-8 s).
 */

export const S1Logo: React.FC<{ mobile?: boolean }> = ({ mobile }) => {
  const f = useCurrentFrame();
  const op = useFade(14, 72, 90);
  const reveal = interpolate(f, [4, 50], [100, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const lineW = interpolate(f, [20, 60], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const size = mobile ? 64 : 110;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: op }}>
      <div style={{ textAlign: "center" }}>
        <div
          className="font-display"
          style={{
            fontSize: size,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            color: C.white,
            clipPath: `inset(0 ${reveal}% 0 0)`,
            whiteSpace: "nowrap",
          }}
        >
          Dental
          <span className="font-serif" style={{ fontStyle: "italic", color: C.cyan1 }}>
            Synthesis
          </span>
        </div>
        <div
          style={{
            margin: "22px auto 0",
            width: `${lineW * (mobile ? 2.4 : 4.6)}px`,
            maxWidth: mobile ? 240 : 460,
            height: 1,
            background: `linear-gradient(90deg, transparent, ${C.cyan2}, transparent)`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

export const S2Tagline: React.FC<{ mobile?: boolean }> = ({ mobile }) => {
  const f = useCurrentFrame();
  const op = useFade(12, 128, 150);
  const words = ["L'excellence", "dentaire,", "de la formation", "à la prothèse."];

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: op }}>
      {/* maillage abstrait (CGI léger, SVG) */}
      <svg
        width="100%"
        height="100%"
        style={{ position: "absolute", opacity: 0.14 }}
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
      >
        {Array.from({ length: 7 }).map((_, i) => {
          const y = 140 + i * 130;
          const dash = 2200;
          const off = dash - ((f * 14 + i * 160) % dash);
          return (
            <path
              key={i}
              d={`M -50 ${y} Q 480 ${y - 90 + (i % 3) * 60} 960 ${y} T 1970 ${y}`}
              stroke={C.cyan2}
              strokeWidth={1}
              fill="none"
              strokeDasharray="8 14"
              strokeDashoffset={off}
            />
          );
        })}
      </svg>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: mobile ? 10 : 20,
          maxWidth: mobile ? 620 : 1300,
          textAlign: "center",
        }}
      >
        {words.map((w, i) => {
          const d = 8 + i * 9;
          const wop = interpolate(f, [d, d + 14], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const ty = interpolate(f, [d, d + 18], [26, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.cubic),
          });
          const accent = i >= 2;
          return (
            <span
              key={i}
              className={accent ? "font-serif" : "font-display"}
              style={{
                fontSize: mobile ? 52 : 92,
                fontWeight: accent ? 600 : 700,
                fontStyle: accent ? "italic" : "normal",
                color: accent ? C.cyan1 : C.white,
                opacity: wop,
                transform: `translateY(${ty}px)`,
                letterSpacing: "-0.02em",
              }}
            >
              {w}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
