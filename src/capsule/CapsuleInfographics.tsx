import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";
import { BAUDOT } from "../theme/baudot";
import { Watermark } from "../clinical/BaudotChrome";

/**
 * Infographies animées de la capsule : visuels « qui vendent », générés par
 * la réflexion sur la transcription. Chiffre-choc, graphique de progression,
 * carte site web. Plein cadre, la voix du praticien continue dessous.
 */

const C = BAUDOT.color;

const inOut = (f: number, frames: number) =>
  Math.min(
    interpolate(f, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
    interpolate(f, [frames - 12, frames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
  );

/* ---------- Chiffre-choc : « 6 » paramètres ---------- */
export const BigStat: React.FC<{ value: string; label: string; frames: number }> = ({ value, label, frames }) => {
  const f = useCurrentFrame();
  const op = inOut(f, frames);
  const punch = interpolate(f, [0, 16], [1.6, 1.0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const ring = interpolate(f, [4, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const labelOp = interpolate(f, [14, 26], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const R = 320;
  const circ = 2 * Math.PI * R;
  return (
    <AbsoluteFill style={{ background: BAUDOT.cardBackground, opacity: op, alignItems: "center", justifyContent: "center" }}>
      <svg width={760} height={760} viewBox="0 0 760 760" style={{ position: "absolute" }}>
        <circle cx={380} cy={380} r={R} fill="none" stroke={`${C.champagne}33`} strokeWidth={3} />
        <circle
          cx={380} cy={380} r={R} fill="none" stroke={C.champagne} strokeWidth={6} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - ring)} transform="rotate(-90 380 380)"
        />
      </svg>
      <div style={{ textAlign: "center", transform: `scale(${punch})` }}>
        <div style={{ fontFamily: BAUDOT.font.display, fontSize: 340, fontWeight: 700, color: C.ivory, lineHeight: 1 }}>{value}</div>
      </div>
      <div style={{ position: "absolute", top: "68%", width: "100%", textAlign: "center", opacity: labelOp }}>
        <div style={{ fontFamily: BAUDOT.font.body, fontSize: 40, fontWeight: 700, color: C.champagne, textTransform: "uppercase", letterSpacing: "0.14em" }}>{label}</div>
      </div>
      <Watermark />
    </AbsoluteFill>
  );
};

/* ---------- Graphique de progression : courbe + flèche qui monte ---------- */
export const ProgressChart: React.FC<{ title: string; caption: string; frames: number }> = ({ title, caption, frames }) => {
  const f = useCurrentFrame();
  const op = inOut(f, frames);
  // Courbe tracée progressivement, flèche portée par la pointe
  const draw = interpolate(f, [8, Math.min(72, frames - 20)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  const W = 880, H = 620;
  // Progression « pas à pas » : paliers montants (x, y) dans un repère 0-1
  const pts: [number, number][] = [[0, 0.08], [0.22, 0.2], [0.4, 0.34], [0.58, 0.52], [0.78, 0.72], [1, 0.95]];
  const seg = draw * (pts.length - 1);
  const idx = Math.min(Math.floor(seg), pts.length - 2);
  const t = seg - idx;
  const px = pts[idx][0] + (pts[idx + 1][0] - pts[idx][0]) * t;
  const py = pts[idx][1] + (pts[idx + 1][1] - pts[idx][1]) * t;
  const X = (v: number) => 70 + v * (W - 150);
  const Y = (v: number) => H - 70 - v * (H - 150);
  const path = pts
    .slice(0, idx + 1)
    .map((p, i) => `${i === 0 ? "M" : "L"}${X(p[0])},${Y(p[1])}`)
    .join(" ") + ` L${X(px)},${Y(py)}`;
  const angle = Math.atan2(Y(py) - Y(pts[idx][1]), X(px) - X(pts[idx][0]));
  const gridOp = interpolate(f, [0, 14], [0, 1], { extrapolateRight: "clamp" });
  const labelsOp = interpolate(f, [60, 78], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: BAUDOT.cardBackground, opacity: op, alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", top: "13%", width: "100%", textAlign: "center" }}>
        <div style={{ fontFamily: BAUDOT.font.body, fontSize: 30, letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700, color: C.champagne }}>{title}</div>
      </div>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {/* grille */}
        {[0.25, 0.5, 0.75].map((g) => (
          <line key={g} x1={70} x2={W - 60} y1={Y(g)} y2={Y(g)} stroke={`${C.slate}22`} strokeWidth={1.5} opacity={gridOp} />
        ))}
        <line x1={70} y1={Y(0)} x2={W - 60} y2={Y(0)} stroke={`${C.slate}66`} strokeWidth={2} opacity={gridOp} />
        <line x1={70} y1={Y(0)} x2={70} y2={60} stroke={`${C.slate}66`} strokeWidth={2} opacity={gridOp} />
        {/* aire sous la courbe */}
        <path d={`${path} L${X(px)},${Y(0)} L${X(0)},${Y(0)} Z`} fill={`${C.champagne}18`} />
        {/* courbe */}
        <path d={path} fill="none" stroke={C.champagne} strokeWidth={7} strokeLinecap="round" />
        {/* pointe de flèche portée par la courbe */}
        <g transform={`translate(${X(px)}, ${Y(py)}) rotate(${(angle * 180) / Math.PI})`}>
          <path d="M0,0 L-34,-16 L-26,0 L-34,16 Z" fill={C.champagne} />
        </g>
        {/* jalons */}
        {pts.slice(0, idx + 1).map((p, i) => (
          <circle key={i} cx={X(p[0])} cy={Y(p[1])} r={9} fill={C.ivory} />
        ))}
      </svg>
      <div style={{ position: "absolute", bottom: "16%", width: "100%", textAlign: "center", opacity: labelsOp }}>
        <div style={{ fontFamily: BAUDOT.font.display, fontSize: 52, fontWeight: 700, color: C.ivory }}>{caption}</div>
      </div>
      <Watermark />
    </AbsoluteFill>
  );
};

/* ---------- Carte site web : barre de navigateur + URL tapée ---------- */
export const SiteCard: React.FC<{ url: string; title: string; subtitle: string; frames: number }> = ({ url, title, subtitle, frames }) => {
  const f = useCurrentFrame();
  const op = inOut(f, frames);
  const rise = interpolate(f, [0, 18], [60, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const typed = Math.round(interpolate(f, [12, 52], [0, url.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const caret = Math.floor(f / 8) % 2 === 0 && typed < url.length;
  const btnPulse = 1 + 0.04 * Math.sin(f / 9);
  const btnOp = interpolate(f, [56, 70], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: BAUDOT.cardBackground, opacity: op, alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "86%", transform: `translateY(${rise}px)` }}>
        {/* fenêtre navigateur */}
        <div style={{ borderRadius: 22, overflow: "hidden", boxShadow: "0 40px 100px rgba(0,0,0,0.65)", border: `1.5px solid ${C.champagne}44` }}>
          <div style={{ background: "#0E2033", padding: "20px 26px", display: "flex", alignItems: "center", gap: 12 }}>
            {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
              <div key={c} style={{ width: 16, height: 16, borderRadius: 8, background: c }} />
            ))}
            <div style={{ flex: 1, marginLeft: 14, background: "#060D18", borderRadius: 12, padding: "14px 22px", fontFamily: BAUDOT.font.body, fontSize: 30, fontWeight: 600, color: C.ivory }}>
              {url.slice(0, typed)}
              {caret && <span style={{ color: C.champagne }}>|</span>}
            </div>
          </div>
          <div style={{ background: "#0A1A2F", padding: "56px 40px 60px", textAlign: "center" }}>
            <div style={{ fontFamily: BAUDOT.font.display, fontSize: 58, fontWeight: 700, color: C.ivory, lineHeight: 1.15 }}>{title}</div>
            <div style={{ fontFamily: BAUDOT.font.body, marginTop: 18, fontSize: 28, fontWeight: 500, color: C.slate }}>{subtitle}</div>
            <div style={{ marginTop: 40, opacity: btnOp, transform: `scale(${btnPulse})`, display: "inline-block", background: C.champagne, color: "#06131C", fontFamily: BAUDOT.font.body, fontSize: 30, fontWeight: 800, padding: "20px 52px", borderRadius: 999 }}>
              Découvrir les TP →
            </div>
          </div>
        </div>
      </div>
      <Watermark />
    </AbsoluteFill>
  );
};
