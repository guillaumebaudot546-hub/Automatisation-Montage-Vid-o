import {
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
  Easing,
} from "remotion";

interface Props {
  /** Valeur affichée (ex "90%", "3×", "25"). Anime un comptage si numérique. */
  value: string;
  /** Légende courte sous la valeur */
  caption: string;
  /** Sur-titre minuscule (ex "DONNÉE CLINIQUE") */
  eyebrow?: string;
  delay?: number;
  align?: "left" | "center";
}

/**
 * "Stat hero" : chiffre éditorial monumental façon pub de luxe.
 * Pensé pour ancrer une donnée clé (90 %, 3×, 25 ans) — typo serif italique,
 * accent cyan, comptage animé. Aucun bruit visuel autour.
 */
export const StatHero: React.FC<Props> = ({
  value,
  caption,
  eyebrow,
  delay = 0,
  align = "left",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = Math.max(0, frame - delay);

  const sp = spring({
    frame: local,
    fps,
    config: { damping: 22, stiffness: 80, mass: 0.9 },
  });
  const opacity = interpolate(local, [0, 45], [0, 1], { extrapolateRight: "clamp" });
  const ty = interpolate(sp, [0, 1], [22, 0]);

  // Comptage si valeur commence par un nombre
  const m = value.match(/^(\d+)(.*)$/);
  let display = value;
  if (m) {
    const target = parseInt(m[1], 10);
    const p = interpolate(local, [18, 98], [0, 1], {
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
        textAlign: align,
        display: "flex",
        flexDirection: "column",
        alignItems: align === "center" ? "center" : "flex-start",
        gap: 10,
      }}
    >
      {eyebrow && (
        <div
          style={{
            fontSize: 13,
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            fontWeight: 600,
            color: "var(--cyan-2)",
          }}
        >
          {eyebrow}
        </div>
      )}
      <div
        className="font-stat"
        style={{
          fontSize: 158,
          fontWeight: 700,
          lineHeight: 0.92,
          color: "var(--cyan-1)",
          textShadow: "0 0 30px rgba(73,182,201,0.30)",
        }}
      >
        {display}
      </div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 400,
          color: "rgba(238,243,250,0.85)",
          maxWidth: 480,
          lineHeight: 1.35,
        }}
      >
        {caption}
      </div>
    </div>
  );
};
