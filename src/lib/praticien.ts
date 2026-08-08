import { z } from "zod";

/**
 * Couches 2 et 3 du skill (decision 003) : les preferences du praticien et les
 * exemples valides, rendues LISIBLES PAR DU CODE.
 *
 * Jusqu'ici praticiens/<client>.json n'etait lu par aucune ligne de code : la
 * boucle d'apprentissage (doctrine, REGLE 6) reposait entierement sur le fait
 * qu'un humain pense a rouvrir le fichier. Elle s'est arretee toute seule
 * pendant dix jours sans que rien ne le signale.
 *
 * Ce module ne remplace pas la lecture du JSON par l'agent : il garantit que ce
 * que l'agent lit est VALIDE, et donne au portail doctrine des seuils chiffres
 * sur lesquels s'appuyer.
 */

/** Preferences a valeur de seuil : le portail doctrine s'en sert pour juger. */
export const seuilsSchema = z.object({
  /** Duree max d'une infographie a l'ecran, en secondes. */
  dureeInfographieMaxSec: z.number().positive().default(6),
  /** Nombre max de coupes dans la voix. 0 = un seul passage continu. */
  coupuresVoixMax: z.number().int().min(0).default(1),
  /** Duree min d'un fondu entre deux passages de voix (RÈGLE 0). */
  crossfadeMinSec: z.number().positive().default(0.15),
  /** Volume du lit musical sous la voix. */
  volumeMusique: z.number().min(0).max(1).default(0.08),
});

export type Seuils = z.infer<typeof seuilsSchema>;

export const exempleValideSchema = z.object({
  quoi: z.string(),
  ou: z.string(),
  pourquoi: z.string(),
  format: z.string(),
});

export const correctionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date attendue au format AAAA-MM-JJ"),
  video: z.string(),
  retour: z.string(),
  action: z.string(),
});

export const praticienSchema = z.object({
  praticien: z.string(),
  structure: z.string(),
  charte: z.object({
    source: z.string(),
    accent: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    nomToujoursEnMajuscules: z.boolean(),
  }),
  preferences: z.record(z.string(), z.string()),
  corrections: z.array(correctionSchema),
  exemplesValides: z.array(exempleValideSchema),
});

export type Praticien = z.infer<typeof praticienSchema>;

/** Valide un JSON praticien deja charge. Leve si le fichier est malforme. */
export const litPraticien = (brut: unknown): Praticien =>
  praticienSchema.parse(brut);

/**
 * Seuils applicables : les valeurs par defaut de la doctrine, ecrasees par ce
 * que le praticien a demande. Les preferences sont en prose — on n'en extrait
 * que ce qui est chiffre et sans ambiguite.
 */
export const seuilsDe = (p: Praticien): Seuils => {
  const nombreDans = (texte: string | undefined, motif: RegExp) => {
    if (!texte) return undefined;
    const m = texte.match(motif);
    return m ? Number(m[1].replace(",", ".")) : undefined;
  };

  return seuilsSchema.parse({
    // « graphique ≤ 5-6 s » -> on retient la borne HAUTE
    dureeInfographieMaxSec:
      nombreDans(p.preferences.dureeInfographies, /≤\s*\d+(?:[.,]\d+)?\s*-\s*(\d+(?:[.,]\d+)?)\s*s/) ??
      nombreDans(p.preferences.dureeInfographies, /≤\s*(\d+(?:[.,]\d+)?)\s*s/),
    // « volume ~0,08 »
    volumeMusique: nombreDans(p.preferences.musique, /volume\s*~?\s*(\d+[.,]\d+)/),
  });
};

/**
 * L'etat de sante de la boucle d'apprentissage (REGLE 6).
 * Un `exemplesValides` vide veut dire que l'agent n'a jamais vu a quoi
 * ressemble une reussite — seulement des descriptions d'echecs a eviter.
 */
export const santeBoucle = (p: Praticien) => {
  const dates = p.corrections.map((c) => c.date).sort();
  return {
    corrections: p.corrections.length,
    exemples: p.exemplesValides.length,
    derniereCorrection: dates.length > 0 ? dates[dates.length - 1] : null,
    /** La couche 3 de la decision 003 est-elle alimentee ? */
    couche3Alimentee: p.exemplesValides.length > 0,
  };
};
