import { AbsoluteFill, Loop, OffthreadVideo, staticFile } from "remotion";
import { SceneWrapper } from "../components/SceneWrapper";
import { Kicker } from "../components/Kicker";
import { GlassPanel } from "../components/GlassPanel";

/**
 * SCENE 7 — COMMUNAUTE (~67.2 -> 76.1 s)
 * B-roll en fond (cadrage fixe, sans zoom), voile navy, texte sur glass.
 */
export const Community: React.FC = () => {
  return (
    <SceneWrapper transition="fade">
      {/* B-roll fixe en boucle (3.83s × 60fps = 230 frames par cycle) */}
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <Loop durationInFrames={230}>
          <OffthreadVideo
            src={staticFile("broll-1-1080.mp4")}
            muted
            style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.3 }}
          />
        </Loop>
        <AbsoluteFill
          style={{
            background:
              "linear-gradient(180deg, rgba(6,13,24,0.6) 0%, rgba(10,21,36,0.88) 100%)",
          }}
        />
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          padding: "120px 150px",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <Kicker text="Plus qu'une formation" delay={12} />

        <h2
          className="font-display"
          style={{
            marginTop: 30,
            fontSize: 98,
            fontWeight: 700,
            color: "var(--white)",
            lineHeight: 1.04,
            letterSpacing: "-0.025em",
            maxWidth: 1600,
          }}
        >
          Une{" "}
          <span className="font-serif" style={{ fontStyle: "italic", fontWeight: 600, color: "var(--cyan-2)" }}>
            communauté
          </span>{" "}
          d'échanges confraternels.
        </h2>

        <GlassPanel delay={63} style={{ marginTop: 46, maxWidth: 1440 }}>
          <div
            style={{
              fontSize: 30,
              lineHeight: 1.5,
              fontWeight: 400,
              color: "rgba(238,243,250,0.95)",
            }}
          >
            Un réseau qui décuple{" "}
            <strong style={{ color: "var(--white)", fontWeight: 600 }}>
              vos chances de succès thérapeutiques
            </strong>{" "}
            — et des clés concrètes pour progresser au quotidien.
          </div>
        </GlassPanel>
      </AbsoluteFill>
    </SceneWrapper>
  );
};
