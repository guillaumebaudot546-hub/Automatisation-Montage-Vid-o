import {
  useCurrentFrame,
  interpolate,
  Easing,
} from "remotion";

interface Props {
  /** Valeur 0-100 */
  value: number;
  label: string;
  delay?: number;
  size?: number;
}

/**
 * Anneau (donut) cyan animé — courbe de Bezier qui se trace.
 * Utilisé pour visualiser un pourcentage clé (ex 100 % en ligne).
 */
export const Donut: React.FC<Props> = ({
  value,
  label,
  delay = 0,
  size = 220,
}) => {
  const frame = useCurrentFrame();
  const local = Math.max(0, frame - delay);

  const opacity = interpolate(local, [0, 37], [0, 1], { extrapolateRight: "clamp" });
  const p = interpolate(local, [12, 104], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const shown = value * p;

  const r = size / 2 - 14;
  const C = 2 * Math.PI * r;
  const dash = C * (1 - shown / 100);

  return (
    <div
      style={{
        opacity,
        width: size,
        height: size,
        position: "relative",
      }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id="donutg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#A7E8F2" />
            <stop offset="100%" stopColor="#1F8FA8" />
          </linearGradient>
          <filter id="dglow">
            <feGaussianBlur stdDeviation="2" />
          </filter>
        </defs>
        {/* anneau de fond */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={10}
          fill="none"
        />
        {/* valeur */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#donutg)"
          strokeWidth={10}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={C}
          strokeDashoffset={dash}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ filter: "drop-shadow(0 0 18px rgba(73,182,201,0.8)) drop-shadow(0 0 32px rgba(73,182,201,0.4))" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          className="font-stat"
          style={{
            fontSize: 56,
            fontWeight: 700,
            color: "var(--white)",
            lineHeight: 1,
          }}
        >
          {Math.round(value)}
          <span style={{ fontSize: 28, color: "var(--cyan-1)" }}> %</span>
        </div>
        <div
          style={{
            marginTop: 8,
            fontSize: 13,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            fontWeight: 600,
            color: "var(--muted)",
          }}
        >
          {label}
        </div>
      </div>
    </div>
  );
};
