import {
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
  Easing,
} from "remotion";

interface Props {
  delay?: number;
  aspect?: number;
  caption?: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

/**
 * Cadre media partage (photo OU video) : meme chrome premium pour tout media.
 * Source unique de l'habillage — teinte navy, fine ligne cyan, ombre douce,
 * apparition en fondu + glissement. Le contenu (Img / Video) est passe en children.
 */
export const MediaFrame: React.FC<Props> = ({
  delay = 0,
  aspect = 4 / 5,
  caption,
  className = "",
  style,
  children,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = Math.max(0, frame - delay);

  const sp = spring({
    frame: local,
    fps,
    config: { damping: 22, stiffness: 90, mass: 0.8 },
  });
  const opacity = interpolate(local, [0, 45], [0, 1], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const ty = interpolate(sp, [0, 1], [26, 0]);

  return (
    <div
      className={className}
      style={{
        position: "relative",
        borderRadius: 20,
        overflow: "hidden",
        aspectRatio: String(aspect),
        opacity,
        transform: `translateY(${ty}px)`,
        border: "1px solid rgba(73,182,201,0.45)",
        boxShadow:
          "0 36px 80px rgba(4,9,18,0.55), 0 0 70px rgba(73,182,201,0.45), 0 0 130px rgba(73,182,201,0.22), inset 0 1px 0 rgba(167,232,242,0.30)",
        ...style,
      }}
    >
      {children}

      {/* Teinte navy douce pour homogeneite */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(6,13,24,0.10) 0%, rgba(10,21,36,0.42) 100%)",
        }}
      />

      {/* Fine ligne cyan en haut */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 18,
          right: 18,
          height: 1,
          background:
            "linear-gradient(90deg, transparent, rgba(167,232,242,0.5) 50%, transparent)",
        }}
      />

      {/* Legende discrete (optionnelle) */}
      {caption && (
        <div
          style={{
            position: "absolute",
            left: 20,
            bottom: 18,
            fontSize: 15,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            fontWeight: 500,
            color: "rgba(238,243,250,0.85)",
            textShadow: "0 1px 6px rgba(0,0,0,0.6)",
          }}
        >
          {caption}
        </div>
      )}
    </div>
  );
};
