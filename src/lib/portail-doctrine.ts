import type { Seuils } from "./praticien";

/**
 * Portail ① de la boucle auto-critique (decision 006) : le juge DETERMINISTE.
 *
 * Gratuit, sans appel API, sans avis. Il ne dit pas si un montage est bon — il
 * dit s'il viole une regle que la machine sait verifier. Ce qui passe ici va au
 * portail ② (le juge, sous-agent) puis au Dr Baudot, seul oracle du gout.
 *
 * IMPORTANT — les criteres d'origine de la decision 006 (« segment avant 12 s »,
 * « alternance zoom/flash », « duree 8-10 s ») venaient de la doctrine CLINIQUE
 * du 17/07, que la decision 013 a retiree pour le talking-head. Les rejouer
 * ferait echouer tout ce qui a ete livre depuis. Ce portail encode la doctrine
 * ACTUELLE : voix continue, coupes aux frontieres de phrases, calques bornes.
 */

export type Span = { fromSec: number; toSec: number };
export type Cue = { s: number; e: number; t: string };
export type Calque = { atSec: number; durationSec: number; kind: string };

export type PlanMontage = {
  format: "9:16" | "16:9" | "1:1";
  reseau?: string;
  spans: Span[];
  overlays?: Calque[];
  captions?: { fromSec: number; toSec: number; text: string }[];
  /** Fondus audio entre spans, en secondes, index i = jonction i→i+1. */
  crossfades?: number[];
};

export type Violation = {
  regle: string;
  gravite: "rejet" | "avertissement";
  message: string;
};

/** Tolerance d'alignement d'une coupe sur une frontiere de phrase. */
const TOLERANCE_SEC = 0.25;

/** Reseaux -> format attendu (RÈGLE 3). */
const FORMAT_ATTENDU: Record<string, PlanMontage["format"]> = {
  reels: "9:16",
  instagram: "9:16",
  tiktok: "9:16",
  shorts: "9:16",
  youtube: "16:9",
  site: "16:9",
  linkedin: "16:9",
  feed: "1:1",
};

const proche = (a: number, b: number) => Math.abs(a - b) <= TOLERANCE_SEC;

/**
 * RÈGLE 0 — la voix n'est jamais hachee.
 * Deux fautes distinctes : couper au milieu d'une phrase, et raccorder deux
 * passages eloignes par un cut sec.
 */
export const verifieVoix = (
  plan: PlanMontage,
  cues: Cue[],
  seuils: Seuils,
): Violation[] => {
  const v: Violation[] = [];
  if (plan.spans.length === 0) {
    return [{ regle: "0", gravite: "rejet", message: "Aucun passage de voix retenu." }];
  }

  if (cues.length > 0) {
    const debuts = cues.map((c) => c.s);
    const fins = cues.map((c) => c.e);
    for (const [i, s] of plan.spans.entries()) {
      if (!debuts.some((d) => proche(d, s.fromSec)) && !fins.some((f) => proche(f, s.fromSec))) {
        v.push({
          regle: "0",
          gravite: "rejet",
          message: `Span ${i + 1} : debut a ${s.fromSec}s ne tombe sur aucune frontiere de phrase (tolerance ${TOLERANCE_SEC}s). La voix serait coupee en cours de mot.`,
        });
      }
      if (!fins.some((f) => proche(f, s.toSec)) && !debuts.some((d) => proche(d, s.toSec))) {
        v.push({
          regle: "0",
          gravite: "rejet",
          message: `Span ${i + 1} : fin a ${s.toSec}s ne tombe sur aucune frontiere de phrase (tolerance ${TOLERANCE_SEC}s).`,
        });
      }
    }
  }

  const coupures = plan.spans.length - 1;
  if (coupures > seuils.coupuresVoixMax) {
    v.push({
      regle: "0",
      gravite: "rejet",
      message: `${plan.spans.length} passages assembles (${coupures} coupures, max ${seuils.coupuresVoixMax}). Des fragments pris a des moments eloignes sonnent decousus meme en phrases entieres.`,
    });
  }

  for (let i = 0; i < coupures; i++) {
    const fondu = plan.crossfades?.[i] ?? 0;
    if (fondu < seuils.crossfadeMinSec) {
      v.push({
        regle: "0",
        gravite: "rejet",
        message: `Jonction ${i + 1}→${i + 2} : fondu de ${fondu}s (minimum ${seuils.crossfadeMinSec}s). Un cut sec entre deux prises est audible.`,
      });
    }
  }
  return v;
};

/** RÈGLE 3 — le format est un parametre, choisi selon le reseau cible. */
export const verifieFormat = (plan: PlanMontage): Violation[] => {
  if (!plan.reseau) return [];
  const cle = Object.keys(FORMAT_ATTENDU).find((k) =>
    plan.reseau!.toLowerCase().includes(k),
  );
  if (!cle) return [];
  const attendu = FORMAT_ATTENDU[cle];
  return plan.format === attendu
    ? []
    : [
        {
          regle: "3",
          gravite: "rejet",
          message: `Format ${plan.format} pour « ${plan.reseau} » : ${attendu} attendu.`,
        },
      ];
};

/** Preference dureeInfographies — un calque ne s'attarde jamais. */
export const verifieCalques = (
  plan: PlanMontage,
  dureeTotaleSec: number,
  seuils: Seuils,
): Violation[] => {
  const v: Violation[] = [];
  const INFOGRAPHIES = new Set(["stat", "chart", "site", "list", "punch"]);

  for (const o of plan.overlays ?? []) {
    if (o.atSec + o.durationSec > dureeTotaleSec + 0.01) {
      v.push({
        regle: "calques",
        gravite: "rejet",
        message: `Calque ${o.kind} a ${o.atSec}s+${o.durationSec}s depasse la fin (${dureeTotaleSec.toFixed(2)}s) : il serait invisible, sans erreur.`,
      });
    }
    if (INFOGRAPHIES.has(o.kind) && o.durationSec > seuils.dureeInfographieMaxSec) {
      v.push({
        regle: "dureeInfographies",
        gravite: "avertissement",
        message: `Calque ${o.kind} tient ${o.durationSec}s (max ${seuils.dureeInfographieMaxSec}s). Revenir a l'image ou au B-roll.`,
      });
    }
  }
  return v;
};

/** Preference sousTitres — transcription integrale, pas un resume. */
export const verifieSousTitres = (plan: PlanMontage): Violation[] => {
  const voixSec = plan.spans.reduce((a, s) => a + (s.toSec - s.fromSec), 0);
  if (voixSec === 0) return [];
  const captionsSec = (plan.captions ?? []).reduce(
    (a, c) => a + (c.toSec - c.fromSec),
    0,
  );
  const couverture = captionsSec / voixSec;
  if (couverture < 0.8) {
    return [
      {
        regle: "sousTitres",
        gravite: "rejet",
        message: `Sous-titres sur ${Math.round(couverture * 100)}% de la voix. La preference exige la transcription integrale, mot pour mot.`,
      },
    ];
  }
  return [];
};

/** Le portail complet. Passe si aucune violation de gravite « rejet ». */
export const portailDoctrine = (
  plan: PlanMontage,
  cues: Cue[],
  seuils: Seuils,
  dureeTotaleSec: number,
) => {
  const violations = [
    ...verifieVoix(plan, cues, seuils),
    ...verifieFormat(plan),
    ...verifieCalques(plan, dureeTotaleSec, seuils),
    ...verifieSousTitres(plan),
  ];
  return {
    passe: violations.every((x) => x.gravite !== "rejet"),
    violations,
  };
};
