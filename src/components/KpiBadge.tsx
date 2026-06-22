import {
  useCurrentFrame,
  spring,
  useVideoConfig,
  interpolate,
  Easing,
} from "remotion";

interface Props {
  value: string;
  label: string;
  delay?: number;
}

/**
 * Indicateur cle raffine : grand chiffre champagne, libelle discret.
 * Comptage anime pour les valeurs numeriques.
 */
export const KpiBadge: React.FC<Props> = ({ value, label, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - delay;

  const sp = spring({
    frame: Math.max(0, localFrame),
    fps,
    config: { damping: 20, stiffness: 110, mass: 0.7 },
  });
  const ty = interpolate(sp, [0, 1], [18, 0]);
  const opacity = interpolate(localFrame, [0, 37], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const m = value.match(/^(\d+)(.*)$/);
  let display = value;
  if (m) {
    const target = parseInt(m[1], 10);
    const p = interpolate(localFrame, [12, 83], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    });
    display = `${Math.round(target * p)}${m[2]}`;
  }

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${ty}px)`,
        padding: "20px 30px",
        borderRadius: 16,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)",
        minWidth: 180,
      }}
    >
      <div
        className="font-stat"
        style={{
          fontSize: 58,
          fontWeight: 700,
          color: "var(--cyan-2)",
          lineHeight: 1,
        }}
      >
        {display}
      </div>
      <div
        style={{
          marginTop: 10,
          fontSize: 14,
          fontWeight: 500,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "var(--muted)",
        }}
      >
        {label}
      </div>
    </div>
  );
};
