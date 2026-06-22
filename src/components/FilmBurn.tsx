import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  Easing,
} from "remotion";

interface Props {
  /** Variante visuelle (placement du halo) */
  variant?: 1 | 2;
}

/**
 * Flash cyan cinematique — 100% CSS / SVG, aucun decodage video.
 * Conçu pour les transitions entre scenes : leger flash plein + halo
 * radial cyan qui souffle puis s'efface. Zero lag, parfaitement fluide.
 */
export const FilmBurn: React.FC<Props> = ({ variant = 1 }) => {
  const frame = useCurrentFrame();

  // Enveloppe : 0 -> peak (frame 8) -> 0 (frame 32)
  const intensity = interpolate(
    frame,
    [0, 8, 32],
    [0, 1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    }
  );

  if (intensity <= 0) return null;

  const cx = variant === 1 ? 30 : 70;
  const cy = variant === 1 ? 40 : 60;

  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "screen" }}>
      {/* Halo radial cyan (souffle) */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at ${cx}% ${cy}%, rgba(167,232,242,${
            0.55 * intensity
          }) 0%, rgba(73,182,201,${0.30 * intensity}) 28%, transparent 60%)`,
        }}
      />
      {/* Flash plein leger */}
      <AbsoluteFill
        style={{
          backgroundColor: `rgba(220, 248, 255, ${0.10 * intensity})`,
        }}
      />
      {/* Bande de lumiere oblique (motif film) */}
      <div
        style={{
          position: "absolute",
          top: "-20%",
          left: `${variant === 1 ? -20 : 60}%`,
          width: "60%",
          height: "140%",
          background:
            "linear-gradient(90deg, transparent, rgba(167,232,242,0.4) 50%, transparent)",
          filter: "blur(40px)",
          transform: `rotate(${variant === 1 ? -12 : 12}deg)`,
          opacity: intensity * 0.6,
        }}
      />
    </AbsoluteFill>
  );
};
