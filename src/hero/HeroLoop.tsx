import {
  AbsoluteFill,
  OffthreadVideo,
  Sequence,
  staticFile,
  useCurrentFrame,
  interpolate,
  Easing,
} from "remotion";

/**
 * HERO LOOP — DentalSynthesis (PRD v1.4)
 * 24 s @ 30 fps = 720 frames. Boucle seamless, muet (autoplay/muted/loop).
 * S1 logo (0-3s) · S2 tagline (3-8s) · S3 modules (8-18s) ·
 * S4 proof (18-22s) · S5 CTA + raccord boucle (22-24s).
 *
 * Palette : navy/cyan (DA IMCP) — variables ci-dessous, swap facile
 * quand la palette officielle du site sera transmise (C1/C4 PRD).
 */

const C = {
  bg0: "#060D18",
  bg1: "#0A1524",
  bg2: "#0D1B30",
  white: "#EEF3FA",
  muted: "#9DB1C9",
  cyan1: "#A7E8F2",
  cyan2: "#49B6C9",
  cyan3: "#1F8FA8",
  blue: "#5B8DEF",
  sand: "#E6C887",
};

const TOTAL = 720;

/* ---------- Fond loop-aligned (périodes entières sur 720 frames) ---------- */
const HeroBackground: React.FC = () => {
  const frame = useCurrentFrame();
  const t = (frame / TOTAL) * 2 * Math.PI;

  const ax = 30 + Math.sin(t) * 9;
  const ay = 30 + Math.cos(t * 2) * 7;
  const bx = 72 + Math.cos(t) * 8;
  const by = 68 + Math.sin(t * 3) * 6;

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg0 }}>
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, ${C.bg1} 0%, ${C.bg2} 48%, #070E1B 100%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `
            radial-gradient(circle at ${ax}% ${ay}%, rgba(73,182,201,0.22), transparent 50%),
            radial-gradient(circle at ${bx}% ${by}%, rgba(91,141,239,0.16), transparent 52%)
          `,
          filter: "blur(50px)",
        }}
      />
      {/* Particules loop-aligned (I7 — ambiance) */}
      {Array.from({ length: 10 }).map((_, i) => {
        const seed = i * 9301 + 49297;
        const x = (seed % 1000) / 10;
        const cycles = 1 + (i % 3); // cycles entiers -> seamless
        const y = (100 + ((frame * cycles) / TOTAL) * 120 + i * 31) % 120 - 10;
        const tw = 0.10 + 0.10 * (0.5 + 0.5 * Math.sin(t * 4 + i));
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${100 - y}%`,
              width: 2 + (i % 3),
              height: 2 + (i % 3),
              borderRadius: "50%",
              background: `rgba(167,232,242,${tw})`,
            }}
          />
        );
      })}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 42%, rgba(0,0,0,0.55) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};

/* ---------- util fade in/out d'une séquence ---------- */
const useFade = (inEnd: number, outStart: number, dur: number) => {
  const f = useCurrentFrame();
  return Math.min(
    interpolate(f, [0, inEnd], [0, 1], {
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    }),
    interpolate(f, [outStart, dur], [1, 0], {
      extrapolateLeft: "clamp",
      easing: Easing.in(Easing.cubic),
    })
  );
};

/* ---------- S1 — Logo reveal (0-3s) ---------- */
const S1Logo: React.FC<{ mobile?: boolean }> = ({ mobile }) => {
  const f = useCurrentFrame();
  const op = useFade(14, 72, 90);
  const reveal = interpolate(f, [4, 50], [100, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const lineW = interpolate(f, [20, 60], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const size = mobile ? 64 : 110;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: op }}>
      <div style={{ textAlign: "center" }}>
        <div
          className="font-display"
          style={{
            fontSize: size,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            color: C.white,
            clipPath: `inset(0 ${reveal}% 0 0)`,
            whiteSpace: "nowrap",
          }}
        >
          Dental
          <span className="font-serif" style={{ fontStyle: "italic", color: C.cyan1 }}>
            Synthesis
          </span>
        </div>
        <div
          style={{
            margin: "22px auto 0",
            width: `${lineW * (mobile ? 2.4 : 4.6)}px`,
            maxWidth: mobile ? 240 : 460,
            height: 1,
            background: `linear-gradient(90deg, transparent, ${C.cyan2}, transparent)`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

/* ---------- S2 — Tagline staggered + maillage CGI (3-8s) ---------- */
const S2Tagline: React.FC<{ mobile?: boolean }> = ({ mobile }) => {
  const f = useCurrentFrame();
  const op = useFade(12, 128, 150);
  const words = ["L'excellence", "dentaire,", "de la formation", "à la prothèse."];

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: op }}>
      {/* maillage abstrait (CGI léger, SVG) */}
      <svg
        width="100%"
        height="100%"
        style={{ position: "absolute", opacity: 0.14 }}
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
      >
        {Array.from({ length: 7 }).map((_, i) => {
          const y = 140 + i * 130;
          const dash = 2200;
          const off = dash - ((f * 14 + i * 160) % dash);
          return (
            <path
              key={i}
              d={`M -50 ${y} Q 480 ${y - 90 + (i % 3) * 60} 960 ${y} T 1970 ${y}`}
              stroke={C.cyan2}
              strokeWidth={1}
              fill="none"
              strokeDasharray="8 14"
              strokeDashoffset={off}
            />
          );
        })}
      </svg>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: mobile ? 10 : 20,
          maxWidth: mobile ? 620 : 1300,
          textAlign: "center",
        }}
      >
        {words.map((w, i) => {
          const d = 8 + i * 9;
          const wop = interpolate(f, [d, d + 14], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const ty = interpolate(f, [d, d + 18], [26, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.cubic),
          });
          const accent = i >= 2;
          return (
            <span
              key={i}
              className={accent ? "font-serif" : "font-display"}
              style={{
                fontSize: mobile ? 52 : 92,
                fontWeight: accent ? 600 : 700,
                fontStyle: accent ? "italic" : "normal",
                color: accent ? C.cyan1 : C.white,
                opacity: wop,
                transform: `translateY(${ty}px)`,
                letterSpacing: "-0.02em",
              }}
            >
              {w}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/* ---------- S3 — Modules (8-18s) : 3 cards, slide latéral ---------- */
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

const S3Modules: React.FC<{ mobile?: boolean }> = ({ mobile }) => {
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

/* ---------- S4 — Proof : compteurs + UGC praticien (18-22s) ---------- */
const Counter: React.FC<{ target: number; suffix: string; label: string; delay: number; mobile?: boolean }> = ({
  target,
  suffix,
  label,
  delay,
  mobile,
}) => {
  const f = useCurrentFrame();
  const lf = Math.max(0, f - delay);
  const op = interpolate(lf, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  const p = interpolate(lf, [0, 40], [0, 1], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  return (
    <div style={{ opacity: op, textAlign: "center" }}>
      <div
        className="font-stat"
        style={{ fontSize: mobile ? 56 : 84, fontWeight: 700, color: C.cyan1, lineHeight: 1 }}
      >
        {Math.round(target * p)}
        {suffix}
      </div>
      <div
        style={{
          marginTop: 10,
          fontSize: mobile ? 14 : 17,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          fontWeight: 500,
          color: C.muted,
        }}
      >
        {label}
      </div>
    </div>
  );
};

const S4Proof: React.FC<{ mobile?: boolean }> = ({ mobile }) => {
  const op = useFade(12, 102, 120);
  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        opacity: op,
        flexDirection: "column",
        gap: mobile ? 36 : 56,
      }}
    >
      <div
        style={{
          fontSize: 15,
          letterSpacing: "0.32em",
          textTransform: "uppercase",
          fontWeight: 600,
          color: C.cyan2,
        }}
      >
        Ils nous font confiance
      </div>
      <div style={{ display: "flex", gap: mobile ? 40 : 110, flexWrap: "wrap", justifyContent: "center" }}>
        <Counter target={25} suffix=" ans" label="d'expertise clinique" delay={10} mobile={mobile} />
        <Counter target={500} suffix="+" label="praticiens formés" delay={20} mobile={mobile} />
        <Counter target={98} suffix=" %" label="de satisfaction" delay={30} mobile={mobile} />
      </div>
    </AbsoluteFill>
  );
};

/* ---------- S5 — CTA + raccord boucle (22-24s) ---------- */
const S5CTA: React.FC<{ mobile?: boolean }> = ({ mobile }) => {
  const f = useCurrentFrame();
  // fade-out global vers fond nu -> raccord avec S1 (seamless)
  const op = useFade(10, 44, 60);
  const scale = interpolate(f, [0, 18], [0.96, 1], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        opacity: op,
        flexDirection: "column",
        gap: 30,
        transform: `scale(${scale})`,
      }}
    >
      <div
        className="font-display"
        style={{
          fontSize: mobile ? 44 : 66,
          fontWeight: 700,
          color: C.white,
          letterSpacing: "-0.02em",
          textAlign: "center",
        }}
      >
        Dental
        <span className="font-serif" style={{ fontStyle: "italic", color: C.cyan1 }}>
          Synthesis
        </span>
      </div>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 14,
          padding: mobile ? "16px 34px" : "20px 44px",
          background: `linear-gradient(135deg, ${C.cyan2}, ${C.cyan3})`,
          borderRadius: 999,
          border: "1px solid rgba(167,232,242,0.45)",
          boxShadow: "0 16px 40px rgba(73,182,201,0.40), 0 0 70px rgba(73,182,201,0.35)",
        }}
      >
        <span
          className="font-display"
          style={{ fontSize: mobile ? 20 : 26, fontWeight: 700, color: "#fff" }}
        >
          Découvrez nos solutions
        </span>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14" />
          <path d="M13 5l7 7-7 7" />
        </svg>
      </div>
    </AbsoluteFill>
  );
};

/* ---------- assemblage ---------- */
export const HeroLoop: React.FC<{ mobile?: boolean }> = ({ mobile }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg0 }}>
      <HeroBackground />
      <Sequence from={0} durationInFrames={90}>
        <S1Logo mobile={mobile} />
      </Sequence>
      <Sequence from={90} durationInFrames={150}>
        <S2Tagline mobile={mobile} />
      </Sequence>
      <Sequence from={240} durationInFrames={300}>
        <S3Modules mobile={mobile} />
      </Sequence>
      <Sequence from={540} durationInFrames={120}>
        <S4Proof mobile={mobile} />
      </Sequence>
      <Sequence from={660} durationInFrames={60}>
        <S5CTA mobile={mobile} />
      </Sequence>
    </AbsoluteFill>
  );
};

export const HeroLoopMobile: React.FC = () => <HeroLoop mobile />;
