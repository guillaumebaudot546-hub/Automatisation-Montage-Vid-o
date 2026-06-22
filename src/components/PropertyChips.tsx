import {
  useCurrentFrame,
  interpolate,
} from "remotion";

interface Chip {
  label: string;
  /** Sous-libellé court (optionnel) */
  sub?: string;
}

interface Props {
  items: Chip[];
  delay?: number;
  caption?: string;
}

/**
 * Triplet de "puces" éditoriales pour mettre en avant des propriétés clés
 * (ex : Biocompatible · Esthétique · Pérenne).
 */
export const PropertyChips: React.FC<Props> = ({ items, delay = 0, caption }) => {
  const frame = useCurrentFrame();
  const local = Math.max(0, frame - delay);

  const containerOpacity = interpolate(local, [0, 33], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <div style={{ opacity: containerOpacity, display: "flex", flexDirection: "column", gap: 14 }}>
      {caption && (
        <div
          style={{
            fontSize: 12,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            fontWeight: 600,
            color: "var(--muted)",
          }}
        >
          {caption}
        </div>
      )}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        {items.map((c, i) => {
          const d = 12 + i * 21;
          const op = interpolate(local, [d, d + 18], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const ty = interpolate(local, [d, d + 22], [12, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <div
              key={i}
              style={{
                opacity: op,
                transform: `translateY(${ty}px)`,
                padding: "16px 22px",
                borderRadius: 14,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(73,182,201,0.25)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10)",
                display: "flex",
                flexDirection: "column",
                gap: 4,
                minWidth: 160,
              }}
            >
              <div
                className="font-display"
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: "var(--white)",
                  letterSpacing: "-0.01em",
                }}
              >
                {c.label}
              </div>
              {c.sub && (
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--muted)",
                    letterSpacing: "0.04em",
                  }}
                >
                  {c.sub}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
