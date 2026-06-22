import { useCurrentFrame, interpolate } from "remotion";

interface Props {
  text: string;
  delay?: number;
}

/**
 * Sur-titre raffine : fine ligne doree + libelle espace en majuscules.
 */
export const Kicker: React.FC<Props> = ({ text, delay = 0 }) => {
  const frame = useCurrentFrame();
  const localFrame = frame - delay;

  const opacity = interpolate(localFrame, [0, 37], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const w = interpolate(localFrame, [0, 53], [0, 48], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div style={{ opacity, display: "inline-flex", alignItems: "center", gap: 16 }}>
      <span
        style={{
          width: w,
          height: 1,
          background: "linear-gradient(90deg, transparent, var(--cyan-2))",
        }}
      />
      <span
        style={{
          fontSize: 17,
          letterSpacing: "0.32em",
          textTransform: "uppercase",
          fontWeight: 600,
          color: "var(--cyan-2)",
        }}
      >
        {text}
      </span>
    </div>
  );
};
