import {
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from "remotion";
import { ThreeStage } from "./three/ThreeStage";
import { ImplantScrew } from "./three/ImplantScrew";
import { LaserHandpiece } from "./three/LaserHandpiece";
import { MicroProbe } from "./three/MicroProbe";

type ModelId = "implant" | "laser" | "probe";

interface Props {
  model: ModelId;
  width: number;
  height: number;
  delay?: number;
  cameraZ?: number;
}

const MODELS: Record<ModelId, React.FC> = {
  implant: ImplantScrew,
  laser: LaserHandpiece,
  probe: MicroProbe,
};

/**
 * Vitrine verre raffinee abritant un modele 3D.
 */
export const Showcase3D: React.FC<Props> = ({
  model,
  width,
  height,
  delay = 0,
  cameraZ = 6,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = Math.max(0, frame - delay);
  const Model = MODELS[model];

  const sp = spring({
    frame: local,
    fps,
    config: { damping: 22, stiffness: 90, mass: 0.8 },
  });
  const opacity = interpolate(local, [0, 45], [0, 1], { extrapolateRight: "clamp" });
  const ty = interpolate(sp, [0, 1], [26, 0]);

  return (
    <div
      style={{
        position: "relative",
        width,
        height,
        opacity,
        transform: `translateY(${ty}px)`,
        borderRadius: 22,
        overflow: "hidden",
        background:
          "linear-gradient(160deg, rgba(255,255,255,0.05), rgba(10,21,36,0.35))",
        backdropFilter: "blur(14px) saturate(120%)",
        WebkitBackdropFilter: "blur(14px) saturate(120%)",
        border: "1px solid rgba(73,182,201,0.45)",
        boxShadow:
          "0 36px 80px rgba(4,9,18,0.5), 0 0 70px rgba(73,182,201,0.45), 0 0 140px rgba(73,182,201,0.20), inset 0 1px 0 rgba(167,232,242,0.30)",
      }}
    >
      {/* Halo doux (champagne + teal) derriere le modele */}
      <div
        style={{
          position: "absolute",
          top: "22%",
          left: "50%",
          width: "78%",
          height: "58%",
          transform: "translateX(-50%)",
          background:
            "radial-gradient(ellipse at center, rgba(73,182,201,0.28), rgba(73,182,201,0.12) 55%, transparent 72%)",
          filter: "blur(34px)",
        }}
      />

      <div style={{ position: "absolute", inset: 0 }}>
        <ThreeStage width={width} height={height} cameraZ={cameraZ}>
          <Model />
        </ThreeStage>
      </div>

      {/* Fine ligne doree en haut */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 20,
          right: 20,
          height: 1,
          background:
            "linear-gradient(90deg, transparent, rgba(167,232,242,0.5) 50%, transparent)",
        }}
      />

      {/* Label discret */}
      <div
        style={{
          position: "absolute",
          bottom: 20,
          left: 22,
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span style={{ width: 14, height: 1, background: "var(--cyan-2)" }} />
        <span
          className="font-mono"
          style={{
            fontSize: 13,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "rgba(238,243,250,0.8)",
            fontWeight: 500,
          }}
        >
          Modélisation 3D
        </span>
      </div>
    </div>
  );
};
