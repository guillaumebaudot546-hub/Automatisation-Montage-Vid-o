import {
  useCurrentFrame,
  interpolate,
  Easing,
} from "remotion";

interface Item {
  label: string;
  /** 0-100 */
  value: number;
  highlight?: boolean;
}

interface Props {
  items: Item[];
  delay?: number;
  /** Largeur du conteneur des barres (en px) */
  width?: number;
  /** Légende en haut */
  caption?: string;
}

/**
 * Graphe de comparaison horizontal (façon presse médicale, sobre).
 * Animation : remplissage progressif de 0 -> valeur.
 */
export const BarCompare: React.FC<Props> = ({
  items,
  delay = 0,
  width = 540,
  caption,
}) => {
  const frame = useCurrentFrame();
  const local = Math.max(0, frame - delay);

  const containerOpacity = interpolate(local, [0, 33], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        opacity: containerOpacity,
        width,
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      {caption && (
        <div
          style={{
            fontSize: 12,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            fontWeight: 600,
            color: "var(--muted)",
            marginBottom: 4,
          }}
        >
          {caption}
        </div>
      )}
      {items.map((it, i) => {
        const d = 12 + i * 21;
        const p = interpolate(local, [d, d + 36], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        });
        const shown = it.value * p;
        return (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
              }}
            >
              <span
                style={{
                  fontSize: 16,
                  fontWeight: it.highlight ? 600 : 400,
                  color: it.highlight ? "var(--white)" : "var(--muted)",
                  letterSpacing: "0.01em",
                }}
              >
                {it.label}
              </span>
              <span
                className="font-mono"
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  color: it.highlight ? "var(--cyan-1)" : "var(--muted)",
                }}
              >
                {Math.round(shown)} %
              </span>
            </div>
            <div
              style={{
                width: "100%",
                height: 8,
                borderRadius: 6,
                background: "rgba(255,255,255,0.05)",
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <div
                style={{
                  width: `${shown}%`,
                  height: "100%",
                  borderRadius: 6,
                  background: it.highlight
                    ? "linear-gradient(90deg, var(--cyan-3), var(--cyan-1))"
                    : "linear-gradient(90deg, rgba(157,177,201,0.4), rgba(157,177,201,0.7))",
                  boxShadow: it.highlight
                    ? "0 0 18px rgba(73,182,201,0.45)"
                    : "none",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
