import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  Easing,
} from "remotion";

interface Props {
  /** Frame de départ (local au Sequence parent) */
  delay?: number;
  duration?: number;
  /** Direction du balayage */
  direction?: "ltr" | "rtl";
}

/**
 * Transition "liquid glass" : une dalle de verre dépoli traverse l'écran,
 * accompagnée d'un flash lumineux. Utilisée entre les scènes et avant
 * les inserts IRL.
 */
export const GlassWipe: React.FC<Props> = ({
  delay = 0,
  duration = 26,
  direction = "ltr",
}) => {
  const frame = useCurrentFrame();
  const local = frame - delay;
  if (local < 0 || local > duration) return null;

  const p = interpolate(local, [0, duration], [0, 1], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const start = direction === "ltr" ? -60 : 160;
  const end = direction === "ltr" ? 160 : -60;
  const x = interpolate(p, [0, 1], [start, end]);

  const flash = interpolate(
    local,
    [0, duration * 0.4, duration * 0.6, duration],
    [0, 0.5, 0.5, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill style={{ overflow: "hidden", pointerEvents: "none" }}>
      {/* Flash global */}
      <AbsoluteFill style={{ background: "white", opacity: flash * 0.25 }} />

      {/* Dalle de verre dépoli */}
      <div
        style={{
          position: "absolute",
          top: "-10%",
          left: `${x}%`,
          width: "70%",
          height: "120%",
          transform: "skewX(-12deg)",
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.10) 30%, rgba(147,197,253,0.18) 50%, rgba(255,255,255,0.10) 70%, transparent)",
          backdropFilter: "blur(26px) saturate(140%)",
          WebkitBackdropFilter: "blur(26px) saturate(140%)",
          borderLeft: "1px solid rgba(255,255,255,0.35)",
          borderRight: "1px solid rgba(255,255,255,0.35)",
          boxShadow: "0 0 80px rgba(59,130,246,0.4)",
        }}
      />
    </AbsoluteFill>
  );
};
