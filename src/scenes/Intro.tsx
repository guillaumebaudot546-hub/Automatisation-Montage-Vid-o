import {
  AbsoluteFill,
  OffthreadVideo,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";

/**
 * Intro — carte-titre : sting logo IMCP, recadré au montage.
 * Le fichier source fait 14 s mais le logo est résolu dès 8,5 s
 * (image figée ensuite). On entre à 5,5 s (trimBefore 330 @60fps)
 * et on tient 4,5 s : fin d'animation + 1,5 s de tenue.
 * Fondu entrée/sortie pour raccord dip-to-black avec le Hook.
 */
export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const opacity = Math.min(
    interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" }),
    interpolate(frame, [durationInFrames - 24, durationInFrames], [1, 0], {
      extrapolateLeft: "clamp",
    })
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "#000000" }}>
      <AbsoluteFill style={{ opacity }}>
        <OffthreadVideo
          src={staticFile("intro-imcp.mp4")}
          trimBefore={330}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
