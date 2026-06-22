import {
  Img,
  staticFile,
  useCurrentFrame,
  interpolate,
  Easing,
} from "remotion";

interface Props {
  delay?: number;
  /** Largeur d'affichage (px). L'asset fait 1112px -> affichage = downscale net. */
  width?: number;
  glow?: boolean;
  float?: boolean;
  /** Trait dore qui se dessine sous le sigle */
  underline?: boolean;
}

const ASPECT = 1112 / 282;

/**
 * Sigle IMCP net + animation d'ouverture epuree, moderne et chic :
 * reveal gauche -> droite (clip-path) mene par une fine arete de lumiere
 * doree, leger fondu + montee en echelle, puis trait dore qui se dessine.
 */
export const LogoMark: React.FC<Props> = ({
  delay = 0,
  width = 440,
  glow = true,
  float = true,
  underline = true,
}) => {
  const frame = useCurrentFrame();
  const local = Math.max(0, frame - delay);
  const height = width / ASPECT;

  const opacity = interpolate(local, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
  });
  // Reveal : clip depuis la droite, 100% -> 0%
  const reveal = interpolate(local, [5, 71], [100, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const scale = interpolate(local, [0, 78], [0.975, 1], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const edgeX = 100 - reveal; // position de l'arete lumineuse
  const barOpacity = interpolate(local, [5, 18, 67, 86], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const underlineW = underline
    ? interpolate(local, [76, 131], [0, 100], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.cubic),
      })
    : 0;

  const floatY = float ? Math.sin(frame / 64) * 5 : 0;
  const pulse = (Math.sin(frame / 48) + 1) / 2;
  const glowA = 0.16 + pulse * 0.12;

  return (
    <div
      style={{
        position: "relative",
        opacity,
        transform: `translateY(${floatY}px) scale(${scale})`,
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {glow && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: width * 1.12,
            height: height * 1.7,
            transform: "translate(-50%, -58%)",
            background: `radial-gradient(ellipse at center, rgba(120,210,230,${glowA}) 0%, rgba(73,182,201,${
              glowA * 0.5
            }) 42%, transparent 70%)`,
            filter: "blur(28px)",
          }}
        />
      )}

      <div style={{ position: "relative", width, height }}>
        <Img
          src={staticFile("logo-mark.png")}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "contain",
            clipPath: `inset(0 ${reveal}% 0 0)`,
            WebkitClipPath: `inset(0 ${reveal}% 0 0)`,
            filter: "drop-shadow(0 4px 16px rgba(4,9,18,0.45))",
          }}
        />
        {/* Arete de lumiere doree qui mene le reveal */}
        <div
          style={{
            position: "absolute",
            top: "-8%",
            left: `calc(${edgeX}% - 2px)`,
            width: 4,
            height: "116%",
            background:
              "linear-gradient(180deg, transparent, var(--cyan-1), var(--cyan-2), transparent)",
            filter: "blur(2px)",
            opacity: barOpacity,
            boxShadow: "0 0 18px rgba(167,232,242,0.9)",
          }}
        />
      </div>

      {underline && (
        <div
          style={{
            marginTop: 18,
            width: `${underlineW}%`,
            maxWidth: width * 0.72,
            height: 1,
            background:
              "linear-gradient(90deg, transparent, var(--cyan-2) 50%, transparent)",
          }}
        />
      )}
    </div>
  );
};
