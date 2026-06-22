import { Img, staticFile } from "remotion";
import { MediaFrame } from "./MediaFrame";

interface Props {
  src: string;
  delay?: number;
  aspect?: number;
  caption?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Cadre photo STATIQUE et elegant : image fixe dans le cadre media partage.
 */
export const StillFrame: React.FC<Props> = ({
  src,
  delay = 0,
  aspect = 4 / 5,
  caption,
  className = "",
  style,
}) => {
  return (
    <MediaFrame delay={delay} aspect={aspect} caption={caption} className={className} style={style}>
      <Img
        src={staticFile(src)}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
    </MediaFrame>
  );
};
