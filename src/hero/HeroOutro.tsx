import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  Easing,
} from "remotion";
import { C, useFade } from "./heroShared";

/**
 * Fin du hero : S4 preuve (compteurs, 18-22 s) + S5 CTA et raccord de
 * boucle (22-24 s).
 */

const Counter: React.FC<{
  target: number;
  suffix: string;
  label: string;
  delay: number;
  mobile?: boolean;
}> = ({ target, suffix, label, delay, mobile }) => {
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

export const S4Proof: React.FC<{ mobile?: boolean }> = ({ mobile }) => {
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

export const S5CTA: React.FC<{ mobile?: boolean }> = ({ mobile }) => {
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
