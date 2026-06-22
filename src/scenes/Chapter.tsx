import { AbsoluteFill } from "remotion";
import { SceneWrapper, type TransitionKind } from "../components/SceneWrapper";
import { Kicker } from "../components/Kicker";
import { Bullet } from "../components/Bullet";
import { StillFrame } from "../components/StillFrame";
import { Showcase3D } from "../components/Showcase3D";
import { StatHero } from "../components/StatHero";
import { BarCompare } from "../components/BarCompare";
import { Curve } from "../components/Curve";
import { PropertyChips } from "../components/PropertyChips";

export type ChapterMedia =
  | { type: "3d"; model: "implant" | "laser" | "probe"; cameraZ?: number }
  | { type: "still"; src: string; caption?: string };

export type ChapterData =
  | {
      kind: "bars";
      stat: { value: string; caption: string; eyebrow?: string };
      bars: { caption: string; items: { label: string; value: number; highlight?: boolean }[] };
      side?: { value: string; label: string };
    }
  | {
      kind: "curve";
      stat: { value: string; caption: string; eyebrow?: string };
      curve: { caption?: string; xLeft?: string; xRight?: string };
    }
  | {
      kind: "chips";
      stat: { value: string; caption: string; eyebrow?: string };
      chips: { caption?: string; items: { label: string; sub?: string }[] };
    };

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

const MEDIA_W = 540;
const MEDIA_H = 680;

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
  return (
    <StillFrame
      src={media.src}
      delay={50}
      caption={media.caption}
      aspect={MEDIA_W / MEDIA_H}
      style={{ width: MEDIA_W }}
    />
  );
};

const renderData = (data: ChapterData) => {
  if (data.kind === "bars") {
    return (
      <div style={{ display: "flex", gap: 56, alignItems: "flex-start", flexWrap: "wrap" }}>
        <StatHero {...data.stat} delay={90} />
        <div style={{ display: "flex", flexDirection: "column", gap: 18, minWidth: 360 }}>
          <BarCompare delay={149} {...data.bars} width={420} />
          {data.side && (
            <div
              style={{
                marginTop: 4,
                display: "inline-flex",
                alignItems: "baseline",
                gap: 12,
              }}
            >
              <span
                className="font-stat"
                style={{
                  fontSize: 54,
                  fontWeight: 700,
                  color: "var(--cyan-1)",
                  lineHeight: 1,
                }}
              >
                {data.side.value}
              </span>
              <span
                style={{
                  fontSize: 14,
                  letterSpacing: "0.26em",
                  textTransform: "uppercase",
                  fontWeight: 600,
                  color: "var(--muted)",
                }}
              >
                {data.side.label}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
  if (data.kind === "curve") {
    return (
      <div style={{ display: "flex", gap: 56, alignItems: "flex-end", flexWrap: "wrap" }}>
        <StatHero {...data.stat} delay={90} />
        <Curve delay={149} {...data.curve} width={500} height={200} />
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <StatHero {...data.stat} delay={90} />
      <PropertyChips delay={149} {...data.chips} />
    </div>
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
          {data && <div style={{ marginTop: 4 }}>{renderData(data)}</div>}

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
