import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
} from "remotion";

export type TransitionKind =
  | "fade"
  | "slideLeft"
  | "slideRight"
  | "rise"
  | "scale";

interface Props {
  children: React.ReactNode;
  /** Type de transition d'entree/sortie */
  transition?: TransitionKind;
}

/**
 * Enrobe chaque scene avec une transition propre et discrete.
 * Fondu systematique + un mouvement leger variable (glissement / montee /
 * zoom) pour rythmer sans surcharger. Easing doux (premium).
 */
export const SceneWrapper: React.FC<Props> = ({
  children,
  transition = "fade",
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const IN = 48;
  const OUT = 40;
  const exitStart = durationInFrames - OUT;

  const eIn = interpolate(frame, [0, IN], [0, 1], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const eOut = interpolate(frame, [exitStart, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    easing: Easing.in(Easing.cubic),
  });
  const opacity = Math.min(eIn, eOut);

  // progression 0->1 a l'entree, 1->0 a la sortie (pour les transforms)
  const pIn = interpolate(frame, [0, IN], [1, 0], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const pOut = interpolate(frame, [exitStart, durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    easing: Easing.in(Easing.cubic),
  });

  let tx = 0;
  let ty = 0;
  let scale = 1;

  switch (transition) {
    case "slideLeft":
      tx = pIn * 90 - pOut * 60;
      break;
    case "slideRight":
      tx = -pIn * 90 + pOut * 60;
      break;
    case "rise":
      ty = pIn * 70 - pOut * 45;
      break;
    case "scale":
      scale = 1 + pIn * 0.05 - pOut * 0.02;
      break;
    case "fade":
    default:
      ty = pIn * 18 - pOut * 12;
      break;
  }

  return (
    <AbsoluteFill
      style={{
        opacity,
        transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
