import { useCurrentFrame, interpolate, Easing } from "remotion";

interface Props {
  text: string;
  delay?: number;
}

/**
 * Ligne de benefice raffinee : petit marqueur dore + texte clair.
 * Apparition douce (fondu + leger glissement).
 */
export const Bullet: React.FC<Props> = ({ text, delay = 0 }) => {
  const frame = useCurrentFrame();
  const localFrame = frame - delay;

  const opacity = interpolate(localFrame, [0, 41], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const tx = interpolate(localFrame, [0, 53], [-16, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 18,
        opacity,
        transform: `translateX(${tx}px)`,
      }}
    >
      <span
        style={{
          marginTop: 15,
          width: 18,
          height: 1.5,
          background: "var(--cyan-2)",
          flexShrink: 0,
        }}
      />
      <span
        style={{
          color: "rgba(238,243,250,0.90)",
          fontSize: 28,
          lineHeight: 1.5,
          letterSpacing: "-0.003em",
          fontWeight: 400,
        }}
      >
        {text}
      </span>
    </div>
  );
};
