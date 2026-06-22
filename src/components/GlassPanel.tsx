import {
  useCurrentFrame,
  interpolate,
  Easing,
  spring,
  useVideoConfig,
} from "remotion";

interface Props {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
  blur?: number;
  radius?: number;
  padding?: string | number;
  /** Affiche une fine ligne doree en haut */
  hairline?: boolean;
}

/**
 * Panneau verre raffine (liquid glass discret) : translucide, bord fin,
 * reflet doux. Beaucoup plus sobre que la version precedente.
 */
export const GlassPanel: React.FC<Props> = ({
  children,
  delay = 0,
  className = "",
  style,
  blur = 18,
  radius = 22,
  padding = "32px 38px",
  hairline = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - delay;

  const sp = spring({
    frame: Math.max(0, localFrame),
    fps,
    config: { damping: 22, stiffness: 90, mass: 0.8 },
  });
  const opacity = interpolate(localFrame, [0, 45], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const ty = interpolate(sp, [0, 1], [28, 0]);

  return (
    <div
      className={className}
      style={{
        position: "relative",
        borderRadius: radius,
        padding,
        opacity,
        transform: `translateY(${ty}px)`,
        overflow: "hidden",
        background:
          "linear-gradient(160deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.025) 100%)",
        backdropFilter: `blur(${blur}px) saturate(120%)`,
        WebkitBackdropFilter: `blur(${blur}px) saturate(120%)`,
        border: "1px solid rgba(73,182,201,0.35)",
        boxShadow:
          "0 30px 70px rgba(4,9,18,0.45), 0 0 50px rgba(73,182,201,0.35), 0 0 90px rgba(73,182,201,0.18), inset 0 1px 0 rgba(167,232,242,0.30)",
        ...style,
      }}
    >
      {/* Fine ligne doree en haut */}
      {hairline && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 24,
            right: 24,
            height: 1,
            background:
              "linear-gradient(90deg, transparent, rgba(167,232,242,0.55) 50%, transparent)",
          }}
        />
      )}
      <div style={{ position: "relative" }}>{children}</div>
    </div>
  );
};
