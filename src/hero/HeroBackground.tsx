import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, TOTAL } from "./heroShared";

/**
 * Fond loop-aligned du hero : dégradé navy, halos cyan/bleu dérivants,
 * particules (périodes entières sur TOTAL frames → boucle seamless).
 */
export const HeroBackground: React.FC = () => {
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
