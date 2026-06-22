import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from "remotion";
import { SceneWrapper } from "../components/SceneWrapper";
import { StillFrame } from "../components/StillFrame";
import { Kicker } from "../components/Kicker";

/**
 * SCENE 3 — "3 sujets traites" (~21.2 -> 28.3 s)
 * Titre + liste a gauche, instrument 3D a droite.
 */
export const ChaptersIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({
    frame: frame - 18,
    fps,
    config: { damping: 20, stiffness: 80 },
  });
  const titleOpacity = interpolate(frame, [18, 67], [0, 1], {
    extrapolateRight: "clamp",
  });
  const titleY = interpolate(titleSpring, [0, 1], [24, 0]);

  const chapters = [
    { num: "01", label: "Protocole laser", sub: "Parodontite · Erbium-Yag" },
    { num: "02", label: "Microchirurgie", sub: "Tissus mous & durs" },
    { num: "03", label: "Implantologie", sub: "Zircone & biologie" },
  ];

  return (
    <SceneWrapper transition="rise">
      <AbsoluteFill
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: "90px 130px",
          gap: 70,
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ opacity: titleOpacity, transform: `translateY(${titleY}px)` }}>
            <Kicker text="Le programme" delay={8} />
            <div
              className="font-display"
              style={{
                marginTop: 24,
                fontSize: 116,
                fontWeight: 700,
                color: "var(--white)",
                letterSpacing: "-0.03em",
                lineHeight: 0.98,
              }}
            >
              3 sujets
              <br />
              <span className="font-serif" style={{ fontStyle: "italic", fontWeight: 600, color: "var(--cyan-2)" }}>
                traités
              </span>
            </div>
          </div>

          <div
            style={{
              marginTop: 52,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            {chapters.map((c, i) => {
              const d = 71 + i * 27;
              const op = interpolate(frame, [d, d + 18], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
              const tx = interpolate(frame, [d, d + 24], [-20, 0], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
              return (
                <div
                  key={c.num}
                  style={{
                    opacity: op,
                    transform: `translateX(${tx}px)`,
                    display: "flex",
                    alignItems: "center",
                    gap: 24,
                    padding: "18px 26px",
                    borderRadius: 14,
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    maxWidth: 700,
                  }}
                >
                  <span
                    className="font-mono"
                    style={{ fontSize: 26, fontWeight: 500, color: "var(--cyan-2)" }}
                  >
                    {c.num}
                  </span>
                  <div>
                    <div
                      className="font-display"
                      style={{
                        fontSize: 32,
                        fontWeight: 600,
                        color: "var(--white)",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {c.label}
                    </div>
                    <div style={{ fontSize: 17, color: "var(--muted)", marginTop: 3 }}>
                      {c.sub}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <StillFrame
          src="laser-unit.jpg"
          delay={45}
          aspect={440 / 760}
          caption="Plateau technique"
          style={{ width: 440 }}
        />
      </AbsoluteFill>
    </SceneWrapper>
  );
};
