import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";
import { BAUDOT } from "../theme/baudot";
import { Watermark } from "../clinical/BaudotChrome";

/**
 * Typographie d'impact : carte punch (écran noir + texte fluo) pour les
 * phrases-clés du praticien, et slide re-animée (contenu extrait de la slide
 * fournie, ré-animé en cascade au lieu de l'image statique).
 */

const C = BAUDOT.color;
export const FLUO = "#5FE8FF"; // cyan fluo — palette IMCP poussée en luminance
const GLOW = `0 0 18px ${FLUO}88, 0 0 60px ${FLUO}44`;

const inOut = (f: number, frames: number) =>
  Math.min(
    interpolate(f, [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
    interpolate(f, [frames - 10, frames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
  );

const pop = (f: number, at: number) => ({
  opacity: interpolate(f, [at, at + 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
  transform: `scale(${interpolate(f, [at, at + 12], [1.35, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  })})`,
});

/* ---------- Carte punch : écran noir, texte fluo — phrase-clé du praticien ---------- */
export const PunchCard: React.FC<{
  pairs: { big: string; small: string }[];
  frames: number;
}> = ({ pairs, frames }) => {
  const f = useCurrentFrame();
  const op = inOut(f, frames);
  return (
    <AbsoluteFill style={{ background: "#02070D", opacity: op, alignItems: "center", justifyContent: "center", gap: 30 }}>
      {pairs.map((p, i) => {
        const at = 6 + i * 22;
        const s = pop(f, at);
        return (
          <div key={i} style={{ textAlign: "center", ...s }}>
            <span style={{ fontFamily: BAUDOT.font.display, fontSize: 200, fontWeight: 700, color: FLUO, textShadow: GLOW, lineHeight: 1 }}>
              {p.big}
            </span>
            <div style={{ fontFamily: BAUDOT.font.body, fontSize: 44, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: C.ivory, marginTop: 6 }}>
              {p.small}
            </div>
            {i < pairs.length - 1 && (
              <div style={{ margin: "36px auto 0", width: 200, height: 2, background: `${FLUO}66` }} />
            )}
          </div>
        );
      })}
      <Watermark />
    </AbsoluteFill>
  );
};

/* ---------- Slide ré-animée : le contenu de la slide fournie, en cascade ---------- */
export const SlideAnimated: React.FC<{
  header: string;
  sub: string;
  groups: { label: string; items: string[] }[];
  footer: string;
  frames: number;
}> = ({ header, sub, groups, footer, frames }) => {
  const f = useCurrentFrame();
  const op = inOut(f, frames);
  let cue = 4;
  const next = (step: number) => {
    const at = cue;
    cue += step;
    return at;
  };
  const headAt = next(8);
  const subAt = next(8);
  return (
    <AbsoluteFill style={{ background: BAUDOT.cardBackground, opacity: op, alignItems: "center", justifyContent: "center", padding: "0 80px" }}>
      <div style={{ width: "100%", textAlign: "center" }}>
        <div style={{ fontFamily: BAUDOT.font.display, fontSize: 76, fontWeight: 700, color: FLUO, textShadow: GLOW, ...pop(f, headAt) }}>
          {header}
        </div>
        <div style={{ fontFamily: BAUDOT.font.body, fontSize: 28, fontStyle: "italic", color: C.slate, marginTop: 14, opacity: interpolate(f, [subAt, subAt + 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
          {sub}
        </div>
        <div style={{ display: "flex", gap: 40, marginTop: 56, justifyContent: "center" }}>
          {groups.map((g, gi) => {
            const gAt = next(10);
            return (
              <div key={gi} style={{ flex: 1, maxWidth: 430, textAlign: "left", opacity: interpolate(f, [gAt, gAt + 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
                <div style={{ fontFamily: BAUDOT.font.body, fontSize: 24, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: C.champagne, marginBottom: 22 }}>
                  {g.label}
                </div>
                {g.items.map((it, ii) => {
                  const iAt = gAt + 6 + ii * 8;
                  const tx = interpolate(f, [iAt, iAt + 10], [40, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
                  return (
                    <div key={ii} style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 18, opacity: interpolate(f, [iAt, iAt + 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }), transform: `translateX(${tx}px)` }}>
                      <div style={{ width: 10, height: 10, borderRadius: 5, background: FLUO, boxShadow: GLOW }} />
                      <div style={{ fontFamily: BAUDOT.font.body, fontSize: 29, fontWeight: 600, color: C.ivory }}>{it}</div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
        <div style={{ fontFamily: BAUDOT.font.display, fontSize: 34, fontStyle: "italic", color: C.champagne, marginTop: 52, opacity: interpolate(f, [cue + 4, cue + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
          {footer}
        </div>
      </div>
      <Watermark />
    </AbsoluteFill>
  );
};
