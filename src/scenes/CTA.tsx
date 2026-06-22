import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from "remotion";
import { SceneWrapper } from "../components/SceneWrapper";

/**
 * SCENE 8 — CTA — citation editoriale + bouton cyan glassy.
 */
export const CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const quoteOpacity = interpolate(frame, [18, 67], [0, 1], {
    extrapolateRight: "clamp",
  });
  const quoteY = interpolate(
    spring({ frame: frame - 18, fps, config: { damping: 22, stiffness: 70 } }),
    [0, 1],
    [24, 0]
  );

  const ctaOpacity = interpolate(frame, [162, 207], [0, 1], {
    extrapolateRight: "clamp",
  });
  const ctaY = interpolate(
    spring({ frame: frame - 162, fps, config: { damping: 18, stiffness: 90 } }),
    [0, 1],
    [20, 0]
  );

  return (
    <SceneWrapper transition="scale">
      <AbsoluteFill
        style={{
          padding: "120px",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 62,
        }}
      >
        <p
          className="font-serif"
          style={{
            opacity: quoteOpacity,
            transform: `translateY(${quoteY}px)`,
            fontSize: 84,
            fontWeight: 500,
            color: "var(--white)",
            lineHeight: 1.18,
            letterSpacing: "-0.01em",
            textAlign: "center",
            maxWidth: 1500,
            margin: 0,
          }}
        >
          Le meilleur investissement
          <br />
          que vous puissiez faire est dans{" "}
          <span style={{ fontStyle: "italic", color: "var(--cyan-1)" }}>
            votre éducation.
          </span>
        </p>

        <div
          style={{
            opacity: ctaOpacity,
            transform: `translateY(${ctaY}px)`,
            display: "inline-flex",
            alignItems: "center",
            gap: 16,
            padding: "24px 50px",
            background: "linear-gradient(135deg, var(--cyan-2), var(--cyan-3))",
            borderRadius: 999,
            boxShadow:
              "0 20px 50px rgba(73,182,201,0.40), 0 0 80px rgba(73,182,201,0.55), 0 0 160px rgba(73,182,201,0.30), inset 0 1px 0 rgba(255,255,255,0.45)",
            border: "1px solid rgba(167,232,242,0.45)",
          }}
        >
          <span
            className="font-display"
            style={{
              fontSize: 32,
              fontWeight: 700,
              color: "#FFFFFF",
              letterSpacing: "-0.01em",
              textShadow: "0 1px 2px rgba(0,0,0,0.25)",
            }}
          >
            Rejoignez les webinaires IMCP
          </span>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14" />
            <path d="M13 5l7 7-7 7" />
          </svg>
        </div>
      </AbsoluteFill>
    </SceneWrapper>
  );
};
