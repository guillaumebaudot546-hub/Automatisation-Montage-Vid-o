import {
  AbsoluteFill,
  Img,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
} from "remotion";
import { CHARTE } from "../theme/client-01";

/**
 * Habillage vidéo Dr Baudot (DA landing page) : carton-titre, lower-third,
 * watermark, générique de fin. Consommé par ClinicalWrap — réutilisable
 * pour toute future vidéo.
 */

const C = CHARTE.color;

/* ---------- Carton-titre ---------- */
export const TitleCard: React.FC<{
  eyebrow: string;
  title: string;
  subtitle?: string;
}> = ({ eyebrow, title, subtitle }) => {
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const op = Math.min(
    interpolate(f, [0, 14], [0, 1], { extrapolateRight: "clamp" }),
    interpolate(f, [durationInFrames - 18, durationInFrames], [1, 0], {
      extrapolateLeft: "clamp",
    })
  );
  const ty = interpolate(f, [0, 22], [24, 0], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const lineW = interpolate(f, [16, 56], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill
      style={{
        background: CHARTE.cardBackground,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          textAlign: "center",
          opacity: op,
          transform: `translateY(${ty}px)`,
          maxWidth: 1500,
        }}
      >
        <div
          style={{
            fontFamily: CHARTE.font.body,
            fontSize: 18,
            letterSpacing: "0.34em",
            textTransform: "uppercase",
            fontWeight: 600,
            color: C.champagne,
            marginBottom: 28,
          }}
        >
          {eyebrow}
        </div>
        <div
          style={{
            fontFamily: CHARTE.font.display,
            fontSize: 100,
            fontWeight: 600,
            color: C.ivory,
            lineHeight: 1.08,
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div
            style={{
              fontFamily: CHARTE.font.body,
              marginTop: 20,
              fontSize: 28,
              fontWeight: 500,
              color: C.slate,
            }}
          >
            {subtitle}
          </div>
        )}
        <div
          style={{
            margin: "36px auto 0",
            width: `${lineW}%`,
            maxWidth: 460,
            height: 1.5,
            background: CHARTE.hairline(),
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

/* ---------- Lower-third ---------- */
export const LowerThird: React.FC<{ title: string }> = ({ title }) => {
  const f = useCurrentFrame();
  const op = Math.min(
    interpolate(f, [20, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
    interpolate(f, [220, 250], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
  );
  const tx = interpolate(f, [20, 44], [-30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <div
      style={{
        position: "absolute",
        left: 60,
        bottom: 56,
        opacity: op,
        transform: `translateX(${tx}px)`,
        padding: "18px 30px",
        borderRadius: 12,
        background: "rgba(10,26,47,0.72)",
        backdropFilter: "blur(10px)",
        borderLeft: `3px solid ${C.champagne}`,
      }}
    >
      <div
        style={{
          fontFamily: CHARTE.font.display,
          fontSize: 32,
          fontWeight: 600,
          color: C.ivory,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontFamily: CHARTE.font.body,
          marginTop: 6,
          fontSize: 16,
          letterSpacing: "0.14em",
          color: C.slate,
        }}
      >
        DR FABRICE CHARTE — INSTITUT MICROCHIRURGIE PARODONTALE
      </div>
    </div>
  );
};

/* ---------- Watermark ---------- */
export const Watermark: React.FC = () => {
  const f = useCurrentFrame();
  const op = interpolate(f, [0, 30], [0, 0.5], { extrapolateRight: "clamp" });
  return (
    <Img
      src={staticFile("logo-mark.png")}
      style={{ position: "absolute", top: 44, right: 56, width: 140, opacity: op }}
    />
  );
};

/* ---------- Générique de fin ---------- */
export const EndCredits: React.FC = () => {
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const op = Math.min(
    interpolate(f, [0, 18], [0, 1], { extrapolateRight: "clamp" }),
    interpolate(f, [durationInFrames - 16, durationInFrames], [1, 0], {
      extrapolateLeft: "clamp",
    })
  );
  const rise = (d: number) =>
    interpolate(f, [d, d + 20], [16, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    });
  const fade = (d: number) =>
    interpolate(f, [d, d + 16], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

  return (
    <AbsoluteFill
      style={{
        background: CHARTE.cardBackground,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ textAlign: "center", opacity: op }}>
        <Img
          src={staticFile("logo-mark.png")}
          style={{
            width: 380,
            display: "block",
            margin: "0 auto",
            opacity: fade(4),
            transform: `translateY(${rise(4)}px)`,
          }}
        />
        <div
          style={{
            fontFamily: CHARTE.font.display,
            fontSize: 46,
            fontWeight: 600,
            fontStyle: "italic",
            color: C.ivory,
            marginTop: 34,
            opacity: fade(18),
            transform: `translateY(${rise(18)}px)`,
          }}
        >
          DR FABRICE CHARTE
        </div>
        <div
          style={{
            fontFamily: CHARTE.font.body,
            fontSize: 18,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: C.slate,
            marginTop: 12,
            opacity: fade(30),
            transform: `translateY(${rise(30)}px)`,
          }}
        >
          Parodontologie · Implantologie · Microchirurgie · Laser
        </div>
        <div
          style={{
            margin: "30px auto 0",
            width: 220,
            height: 1,
            background: CHARTE.hairline(0.7),
            opacity: fade(40),
          }}
        />
        <div
          style={{
            fontFamily: CHARTE.font.body,
            fontSize: 15,
            color: C.slate,
            marginTop: 22,
            opacity: fade(48),
          }}
        >
          Musique : Saint-Preux — Concerto Pour Une Voix (1995)
        </div>
      </div>
    </AbsoluteFill>
  );
};
