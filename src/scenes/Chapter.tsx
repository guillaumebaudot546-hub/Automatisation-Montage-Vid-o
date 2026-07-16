import { AbsoluteFill } from "remotion";
import { SceneWrapper, type TransitionKind } from "../components/SceneWrapper";
import { Kicker } from "../components/Kicker";
import { Bullet } from "../components/Bullet";
import { StillFrame } from "../components/StillFrame";
import { VideoFrame } from "../components/VideoFrame";
import { Showcase3D } from "../components/Showcase3D";
import { ChapterDataBlock, type ChapterData } from "./ChapterData";

export type ChapterMedia =
  | { type: "3d"; model: "implant" | "laser" | "probe"; cameraZ?: number }
  | { type: "still"; src: string; caption?: string; aspect?: number }
  | { type: "video"; src: string; caption?: string; startFrom?: number; loopSeconds?: number; aspect?: number };

export type { ChapterData };

export interface ChapterProps {
  number: string;
  kicker: string;
  title: string;
  highlight?: string;
  bullets: string[];
  media?: ChapterMedia;
  data?: ChapterData;
  transition?: TransitionKind;
}

const MEDIA_W = 680;
const MEDIA_H = 840;

// Largeur du cadre selon le ratio natif du média : un média paysage
// prend plus de largeur pour ne jamais être recadré/coupé.
const widthFor = (aspect: number) => (aspect >= 1.3 ? 800 : aspect >= 1 ? 700 : MEDIA_W);

const renderMedia = (media: ChapterMedia) => {
  if (media.type === "3d") {
    return (
      <Showcase3D
        model={media.model}
        width={MEDIA_W}
        height={MEDIA_H}
        delay={50}
        cameraZ={media.cameraZ ?? 6}
      />
    );
  }
  const aspect = media.aspect ?? MEDIA_W / MEDIA_H;
  if (media.type === "video") {
    return (
      <VideoFrame
        src={media.src}
        delay={50}
        caption={media.caption}
        startFrom={media.startFrom}
        loopSeconds={media.loopSeconds}
        aspect={aspect}
        style={{ width: widthFor(aspect) }}
      />
    );
  }
  return (
    <StillFrame
      src={media.src}
      delay={50}
      caption={media.caption}
      aspect={aspect}
      style={{ width: widthFor(aspect) }}
    />
  );
};

/**
 * Chapitre — direction "publicité luxe" : grosse donnée chiffrée + visualisation
 * simple, média à droite, bullets compacts en bas. Très data-driven, très calme.
 */
export const Chapter: React.FC<ChapterProps> = ({
  number,
  kicker,
  title,
  highlight,
  bullets,
  media,
  data,
  transition = "fade",
}) => {
  return (
    <SceneWrapper transition={transition}>
      <AbsoluteFill
        style={{
          padding: "70px 110px",
          flexDirection: "row",
          alignItems: "stretch",
          gap: 56,
        }}
      >
        {/* Colonne gauche */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 28,
            justifyContent: "center",
          }}
        >
          {/* Header : numéro + kicker */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: 26 }}>
            <div
              className="font-serif"
              style={{
                fontSize: 150,
                fontWeight: 500,
                lineHeight: 0.8,
                color: "transparent",
                WebkitTextStroke: "1.5px rgba(73,182,201,0.55)",
              }}
            >
              {number}
            </div>
            <div style={{ paddingBottom: 16 }}>
              <Kicker text={kicker} delay={12} />
            </div>
          </div>

          {/* Titre principal */}
          <h2
            className="font-display"
            style={{
              fontSize: 56,
              fontWeight: 700,
              color: "var(--white)",
              letterSpacing: "-0.02em",
              lineHeight: 1.06,
              margin: 0,
            }}
          >
            {highlight ? (
              <>
                {title}{" "}
                <span
                  className="font-serif"
                  style={{ fontStyle: "italic", fontWeight: 600, color: "var(--cyan-1)" }}
                >
                  {highlight}
                </span>
              </>
            ) : (
              title
            )}
          </h2>

          {/* Bloc data (gros chiffre + viz) */}
          {data && <div style={{ marginTop: 4 }}><ChapterDataBlock data={data} /></div>}

          {/* Bullets compacts */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 4 }}>
            {bullets.map((b, i) => (
              <Bullet key={i} text={b} delay={207 + i * 27} />
            ))}
          </div>
        </div>

        {/* Colonne droite : média */}
        {media && (
          <div
            style={{
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {renderMedia(media)}
          </div>
        )}
      </AbsoluteFill>
    </SceneWrapper>
  );
};
