import {
  useCurrentFrame,
  interpolate,
  Easing,
} from "remotion";

interface Props {
  caption?: string;
  /** Etiquette de l'axe X gauche -> droite */
  xLeft?: string;
  xRight?: string;
  delay?: number;
  width?: number;
  height?: number;
}

/**
 * Courbe ascendante (progression / confiance) qui se trace doucement.
 * SVG pur, déterministe, accent cyan.
 */
export const Curve: React.FC<Props> = ({
  caption = "Progression du geste",
  xLeft = "Début",
  xRight = "Maîtrise",
  delay = 0,
  width = 560,
  height = 220,
}) => {
  const frame = useCurrentFrame();
  const local = Math.max(0, frame - delay);

  const opacity = interpolate(local, [0, 33], [0, 1], { extrapolateRight: "clamp" });
  const draw = interpolate(local, [18, 136], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });

  // courbe S inversée -> montée puis stabilisation (logistique simplifiée)
  const ml = 50, mt = 30, w = width - 80, h = height - 70;
  const pts: [number, number][] = [];
  for (let i = 0; i <= 60; i++) {
    const t = i / 60;
    // sigmoïde : 1 / (1 + e^{-k(t-0.5)})
    const y = 1 / (1 + Math.exp(-8 * (t - 0.45)));
    pts.push([ml + t * w, mt + (1 - y) * h]);
  }
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`).join(" ");

  // longueur approximative pour le dashoffset
  let len = 0;
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i][0] - pts[i - 1][0];
    const dy = pts[i][1] - pts[i - 1][1];
    len += Math.sqrt(dx * dx + dy * dy);
  }
  const offset = len * (1 - draw);

  return (
    <div style={{ opacity, width }}>
      {caption && (
        <div
          style={{
            fontSize: 12,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            fontWeight: 600,
            color: "var(--muted)",
            marginBottom: 8,
          }}
        >
          {caption}
        </div>
      )}
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient id="curvefill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#49B6C9" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#49B6C9" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* grille discrète */}
        {[0.25, 0.5, 0.75].map((g, i) => (
          <line
            key={i}
            x1={ml}
            y1={mt + g * h}
            x2={ml + w}
            y2={mt + g * h}
            stroke="rgba(255,255,255,0.06)"
            strokeDasharray="3 6"
          />
        ))}
        {/* axe */}
        <line x1={ml} y1={mt + h} x2={ml + w} y2={mt + h} stroke="rgba(255,255,255,0.18)" />
        {/* aire sous la courbe (apparaît avec le tracé) */}
        <path
          d={`${d} L ${ml + w} ${mt + h} L ${ml} ${mt + h} Z`}
          fill="url(#curvefill)"
          opacity={draw}
        />
        {/* courbe */}
        <path
          d={d}
          stroke="#A7E8F2"
          strokeWidth={3}
          fill="none"
          strokeDasharray={len}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ filter: "drop-shadow(0 0 6px rgba(167,232,242,0.6))" }}
        />
        {/* point final */}
        {draw > 0.95 && (
          <circle
            cx={pts[pts.length - 1][0]}
            cy={pts[pts.length - 1][1]}
            r={5}
            fill="#A7E8F2"
            style={{ filter: "drop-shadow(0 0 8px rgba(167,232,242,0.9))" }}
          />
        )}
        {/* labels axe X */}
        <text
          x={ml}
          y={mt + h + 22}
          fill="rgba(157,177,201,0.7)"
          fontSize="13"
          fontFamily="JetBrains Mono, monospace"
          letterSpacing="0.16em"
        >
          {xLeft.toUpperCase()}
        </text>
        <text
          x={ml + w}
          y={mt + h + 22}
          fill="var(--cyan-1)"
          fontSize="13"
          fontFamily="JetBrains Mono, monospace"
          letterSpacing="0.16em"
          textAnchor="end"
        >
          {xRight.toUpperCase()}
        </text>
      </svg>
    </div>
  );
};
