import { AbsoluteFill } from "remotion";
import { SceneWrapper } from "../components/SceneWrapper";
import { GlassPanel } from "../components/GlassPanel";
import { Kicker } from "../components/Kicker";
import { Donut } from "../components/Donut";
import { StatHero } from "../components/StatHero";
import { StillFrame } from "../components/StillFrame";

/**
 * SCENE 2 — PRESENTATION
 * Texte editorial a gauche, photo statique a droite,
 * et 2 visualisations data en bas (25 ans / 100 % en ligne).
 */
export const Presentation: React.FC = () => {
  return (
    <SceneWrapper transition="slideLeft">
      <AbsoluteFill
        style={{
          padding: "70px 120px",
          flexDirection: "row",
          alignItems: "center",
          gap: 64,
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 30,
          }}
        >
          <Kicker text="La formation" delay={12} />

          <h2
            style={{
              fontSize: 70,
              fontWeight: 700,
              color: "var(--white)",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              margin: 0,
            }}
            className="font-display"
          >
            Une formule{" "}
            <span className="font-serif" style={{ fontStyle: "italic", fontWeight: 600, color: "var(--cyan-1)" }}>
              100&nbsp;% en ligne
            </span>
            ,<br />
            pensée pour votre quotidien.
          </h2>

          <GlassPanel delay={63} style={{ maxWidth: 720 }}>
            <div
              style={{
                fontSize: 14,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                fontWeight: 600,
                color: "var(--cyan-2)",
                marginBottom: 12,
              }}
            >
              Le formateur
            </div>
            <div
              style={{
                fontSize: 26,
                fontWeight: 400,
                lineHeight: 1.5,
                color: "rgba(238,243,250,0.92)",
              }}
            >
              Protocoles et notions issus de{" "}
              <strong style={{ color: "var(--white)", fontWeight: 600 }}>
                25 ans d'exercice privé
              </strong>{" "}
              en parodontologie et implantologie.
            </div>
          </GlassPanel>

          {/* Bloc data : 25 ans + Donut 100 % en ligne */}
          <div style={{ display: "flex", alignItems: "center", gap: 56 }}>
            <StatHero
              eyebrow="EXPERTISE CLINIQUE"
              value="25"
              caption="années d'exercice privé"
              delay={112}
            />
            <Donut value={100} label="EN LIGNE" delay={157} size={200} />
          </div>
        </div>

        <StillFrame
          src="photo-portrait.jpg"
          delay={37}
          aspect={4 / 3}
          caption="Bloc opératoire"
          style={{ width: 680, flexShrink: 0 }}
        />
      </AbsoluteFill>
    </SceneWrapper>
  );
};
