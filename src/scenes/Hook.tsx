import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
  Easing,
} from "remotion";
import { SceneWrapper } from "../components/SceneWrapper";
import { LogoMark } from "../components/LogoMark";

/**
 * SCENE 1 — HOOK (0 -> ~8.8 s)
 * Logo IMCP, puis reveal editorial "Game Changer" (serif + champagne).
 */
export const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phase 1 : logo (0 -> 140), fondu sortant 130-152
  const logoOpacity = interpolate(frame, [0, 1, 298, 344], [1, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const lineW = interpolate(frame, [33, 104], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const subOpacity = interpolate(frame, [116, 176, 293, 339], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Phase 2 : "Game Changer" (a partir de 150)
  const gcSpring = spring({
    frame: frame - 344,
    fps,
    config: { damping: 20, stiffness: 70, mass: 1 },
  });
  const gcOpacity = interpolate(frame, [344, 401], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const gcY = interpolate(gcSpring, [0, 1], [30, 0]);
  const kickerOpacity = interpolate(frame, [356, 407], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const underline = interpolate(frame, [422, 497], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const subOpacity2 = interpolate(frame, [452, 505], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <SceneWrapper transition="fade">
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
        }}
      >
        {/* Phase 1 : logo */}
        <div
          style={{
            position: "absolute",
            opacity: logoOpacity,
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 30,
          }}
        >
          <LogoMark delay={18} width={520} glow float underline={false} />
          <div
            style={{
              width: `${lineW}%`,
              maxWidth: 460,
              height: 1,
              background:
                "linear-gradient(90deg, transparent, var(--cyan-2) 50%, transparent)",
            }}
          />
          <div
            style={{
              fontSize: 22,
              letterSpacing: "0.34em",
              textTransform: "uppercase",
              fontWeight: 500,
              color: "var(--muted)",
              opacity: subOpacity,
            }}
          >
            Institut de Microchirurgie Parodontale
          </div>
        </div>

        {/* Phase 2 : Game Changer */}
        <div
          style={{
            position: "absolute",
            opacity: gcOpacity,
            transform: `translateY(${gcY}px)`,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 22,
              letterSpacing: "0.42em",
              textTransform: "uppercase",
              fontWeight: 600,
              color: "var(--cyan-2)",
              marginBottom: 24,
              opacity: kickerOpacity,
            }}
          >
            Un véritable
          </div>

          <div
            className="font-serif"
            style={{
              fontSize: 200,
              fontWeight: 600,
              lineHeight: 1,
              color: "var(--white)",
              whiteSpace: "nowrap",
            }}
          >
            Game{" "}
            <span style={{ fontStyle: "italic", color: "var(--cyan-2)" }}>
              Changer
            </span>
          </div>

          {/* Soulignement dore anime */}
          <div
            style={{
              width: `${underline}%`,
              maxWidth: 560,
              height: 2,
              margin: "26px auto 0",
              background:
                "linear-gradient(90deg, transparent, var(--cyan-2) 50%, transparent)",
            }}
          />

          <div
            style={{
              marginTop: 26,
              fontSize: 25,
              fontWeight: 400,
              letterSpacing: "0.02em",
              color: "var(--muted)",
              opacity: subOpacity2,
            }}
          >
            pour votre pratique clinique
          </div>
        </div>
      </AbsoluteFill>
    </SceneWrapper>
  );
};
