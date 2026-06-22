import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
} from "remotion";
import { SceneWrapper } from "../components/SceneWrapper";
import { LogoMark } from "../components/LogoMark";

/**
 * SCENE 9 — OUTRO (~83.2 -> 86.1 s)
 */
export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [8, 50], [0, 1], { extrapolateRight: "clamp" });

  return (
    <SceneWrapper transition="fade">
      <AbsoluteFill
        style={{
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 30,
          opacity,
        }}
      >
        <LogoMark delay={12} width={360} glow float={false} underline={false} />

        <div
          className="font-serif"
          style={{
            fontSize: 56,
            fontStyle: "italic",
            fontWeight: 500,
            color: "var(--white)",
            marginTop: 8,
          }}
        >
          À très bientôt
        </div>

        <div
          style={{
            width: 200,
            height: 1,
            background:
              "linear-gradient(90deg, transparent, var(--cyan-2), transparent)",
          }}
        />

        <div
          style={{
            fontSize: 19,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            fontWeight: 500,
            color: "var(--muted)",
          }}
        >
          Institut de Microchirurgie Parodontale
        </div>
      </AbsoluteFill>
    </SceneWrapper>
  );
};
