import { OffthreadVideo, Loop, staticFile, useVideoConfig } from "remotion";
import { MediaFrame } from "./MediaFrame";

interface Props {
  src: string;
  delay?: number;
  aspect?: number;
  caption?: string;
  className?: string;
  style?: React.CSSProperties;
  /** Decalage de depart dans le clip source, en secondes. */
  startFrom?: number;
  /** Duree du clip en secondes : si fournie, le clip boucle pour couvrir la scene. */
  loopSeconds?: number;
}

/**
 * Cadre VIDEO : clip reel (laser, implant, geste clinique) dans le cadre media
 * partage. Muet, et en boucle (via loopSeconds) pour couvrir toute la scene.
 */
export const VideoFrame: React.FC<Props> = ({
  src,
  delay = 0,
  aspect = 4 / 5,
  caption,
  className = "",
  style,
  startFrom = 0,
  loopSeconds,
}) => {
  const { fps } = useVideoConfig();

  const video = (
    <OffthreadVideo
      src={staticFile(src)}
      muted
      trimBefore={startFrom > 0 ? Math.round(startFrom * fps) : undefined}
      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
    />
  );

  return (
    <MediaFrame delay={delay} aspect={aspect} caption={caption} className={className} style={style}>
      {loopSeconds ? (
        <Loop durationInFrames={Math.round(loopSeconds * fps)}>{video}</Loop>
      ) : (
        video
      )}
    </MediaFrame>
  );
};
