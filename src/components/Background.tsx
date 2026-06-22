import { AbsoluteFill, useCurrentFrame } from "remotion";

/**
 * Fond raffine : navy profond, halos tres doux (or + teal) qui derivent
 * lentement, grain de lumiere discret. Pas de neon, beaucoup de calme.
 */
export const Background: React.FC = () => {
  const frame = useCurrentFrame();

  const ax = 28 + Math.sin(frame / 440) * 10;
  const ay = 26 + Math.cos(frame / 380) * 8;
  const bx = 74 + Math.cos(frame / 480) * 9;
  const by = 70 + Math.sin(frame / 400) * 7;

  return (
    <AbsoluteFill style={{ backgroundColor: "#060D18" }}>
      {/* Degrade profond */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, #0A1524 0%, #0D1B30 48%, #070E1B 100%)",
        }}
      />

      {/* Halos tres doux : champagne + teal */}
      <AbsoluteFill
        style={{
          background: `
            radial-gradient(circle at ${ax}% ${ay}%, rgba(73, 182, 201, 0.30), transparent 52%),
            radial-gradient(circle at ${bx}% ${by}%, rgba(73, 182, 201, 0.28), transparent 54%)
          `,
          filter: "blur(50px)",
        }}
      />

      {/* Grille fine, tres discrete */}
      <AbsoluteFill
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)
          `,
          backgroundSize: "96px 96px",
          opacity: 0.5,
        }}
      />

      {/* Quelques poussieres de lumiere (discretes, lentes) */}
      {Array.from({ length: 6 }).map((_, i) => {
        const seed = i * 9301 + 49297;
        const x = (seed % 1000) / 10;
        const speed = 0.009 + ((seed >> 3) % 100) / 6400;
        const size = 1.5 + ((seed >> 5) % 3);
        const y = 100 - ((frame * speed + i * 17) % 118);
        const tw = 0.06 + 0.12 * (0.5 + 0.5 * Math.sin(frame / 44 + i));
        const gold = i % 2 === 0;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y}%`,
              width: size,
              height: size,
              borderRadius: "50%",
              background: gold
                ? `rgba(167,232,242,${tw})`
                : `rgba(255,255,255,${tw})`,
            }}
          />
        );
      })}

      {/* Vignette */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 42%, rgba(0,0,0,0.6) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
