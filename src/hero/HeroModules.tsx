import {
  AbsoluteFill,
  OffthreadVideo,
  staticFile,
  useCurrentFrame,
  interpolate,
  Easing,
} from "remotion";
import { C, useFade } from "./heroShared";

/**
 * S3 du hero (8-18 s) : carrousel des 3 modules (Formations / IA /
 * Prothèses), slide latéral, insert vidéo par module.
 */

interface Mod {
  title: string;
  sub: string;
  color: string;
  video: string;
  icon: React.ReactNode;
}

const MODS: Mod[] = [
  {
    title: "Formations",
    sub: "Webinaires & protocoles cliniques",
    color: C.cyan2,
    video: "hero/insert-praticien.mp4",
    icon: (
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10 12 5 2 10l10 5 10-5z" />
        <path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5" />
      </svg>
    ),
  },
  {
    title: "Solutions IA",
    sub: "Diagnostic & imagerie augmentés",
    color: C.blue,
    video: "hero/insert-clinique.mp4",
    icon: (
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="6" y="6" width="12" height="12" rx="2" />
        <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" />
      </svg>
    ),
  },
  {
    title: "Prothèses",
    sub: "Zircone & ingénierie tissulaire",
    color: C.sand,
    video: "hero/insert-implant.mp4",
    icon: (
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3C8 3 5 5.5 5 9c0 2 .8 3.2 1.6 4.6.7 1.2 1.4 3.4 1.7 6 .1.8 1.2 1 1.6.2.7-1.7 1.3-4.3 2.1-4.3s1.4 2.6 2.1 4.3c.4.8 1.5.6 1.6-.2.3-2.6 1-4.8 1.7-6C18.2 12.2 19 11 19 9c0-3.5-3-6-7-6z" />
      </svg>
    ),
  },
];

export const S3Modules: React.FC<{ mobile?: boolean }> = ({ mobile }) => {
  const f = useCurrentFrame();
  const op = useFade(12, 278, 300);
  const PER = 100; // frames par module

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: op }}>
      {MODS.map((m, i) => {
        const start = i * PER;
        const lf = f - start;
        if (lf < -20 || lf > PER + 20) return null;
        const inOp = interpolate(lf, [0, 16], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const outOp = interpolate(lf, [PER - 14, PER], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const tx = interpolate(lf, [0, 18], [mobile ? 60 : 140, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        });
        const txOut = interpolate(lf, [PER - 16, PER], [0, mobile ? -60 : -140], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.in(Easing.cubic),
        });

        return (
          <AbsoluteFill
            key={m.title}
            style={{
              alignItems: "center",
              justifyContent: "center",
              opacity: Math.min(inOp, outOp),
              transform: `translateX(${tx + txOut}px)`,
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: mobile ? "column" : "row",
                alignItems: "center",
                gap: mobile ? 30 : 70,
                padding: mobile ? "0 40px" : "0 120px",
              }}
            >
              {/* texte */}
              <div style={{ maxWidth: mobile ? 620 : 660 }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 14,
                    color: m.color,
                    marginBottom: 18,
                  }}
                >
                  {m.icon}
                  <span
                    style={{
                      fontSize: 15,
                      letterSpacing: "0.3em",
                      textTransform: "uppercase",
                      fontWeight: 600,
                    }}
                  >
                    Module 0{i + 1}
                  </span>
                </div>
                <div
                  className="font-display"
                  style={{
                    fontSize: mobile ? 58 : 96,
                    fontWeight: 700,
                    color: C.white,
                    letterSpacing: "-0.025em",
                    lineHeight: 1,
                  }}
                >
                  {m.title}
                </div>
                <div
                  style={{
                    marginTop: 16,
                    fontSize: mobile ? 22 : 30,
                    color: C.muted,
                    fontWeight: 400,
                  }}
                >
                  {m.sub}
                </div>
              </div>

              {/* insert vidéo (UGC/CGI) */}
              <div
                style={{
                  width: mobile ? 420 : 560,
                  aspectRatio: "16/10",
                  borderRadius: 18,
                  overflow: "hidden",
                  border: `1px solid ${m.color}55`,
                  boxShadow: `0 30px 70px rgba(4,9,18,0.55), 0 0 60px ${m.color}33`,
                  position: "relative",
                  flexShrink: 0,
                }}
              >
                <OffthreadVideo
                  src={staticFile(m.video)}
                  muted
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(180deg, rgba(6,13,24,0.08), rgba(10,21,36,0.35))",
                  }}
                />
              </div>
            </div>
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
};
