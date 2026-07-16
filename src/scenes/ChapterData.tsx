import { StatHero } from "../components/StatHero";
import { BarCompare } from "../components/BarCompare";
import { Curve } from "../components/Curve";
import { PropertyChips } from "../components/PropertyChips";

/**
 * Bloc data d'un chapitre : gros chiffre éditorial + visualisation simple
 * (barres comparatives, courbe ou chips). Extrait de Chapter.tsx.
 */

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

export const ChapterDataBlock: React.FC<{ data: ChapterData }> = ({ data }) => {
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
