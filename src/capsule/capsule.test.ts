import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { capsuleV2Duration, capsuleV2Schema } from "./CapsuleV2";
import { CAPSULE1_PROPS } from "./capsule1-props";
import { TEASER4_PROPS } from "./teaser4-props";
import { SUTURE_PROPS } from "./suture-props";

const FPS = 30;
const STING = 75;
const TITLE = 90;
const CREDITS = 120;
const PUBLIC = join(process.cwd(), "public");

/**
 * Le moteur reellement en production, c'est CapsuleV2 : les trois compositions
 * livrees passent par lui. Il n'avait aucun filet — ces tests le posent.
 */

const CAPSULES = [
  { id: "CapsuleLaserErYag", props: CAPSULE1_PROPS },
  { id: "TeaserLaserErYag", props: TEASER4_PROPS },
  { id: "CapsuleSutures", props: SUTURE_PROPS },
] as const;

describe("capsuleV2Duration", () => {
  it("compose sting + titre + voix + credits", () => {
    const spans = [{ fromSec: 0, toSec: 10 }];
    expect(capsuleV2Duration(spans)).toBe(STING + TITLE + 10 * FPS + CREDITS);
  });

  it("croit lineairement avec la duree de voix conservee", () => {
    const court = capsuleV2Duration([{ fromSec: 0, toSec: 5 }]);
    const long = capsuleV2Duration([{ fromSec: 0, toSec: 25 }]);
    expect(long - court).toBe(20 * FPS);
  });

  it("rend un entier de frames sur des bornes a decimales", () => {
    const d = capsuleV2Duration([
      { fromSec: 0.51, toSec: 1.02 },
      { fromSec: 4.13, toSec: 71.15 },
    ]);
    expect(Number.isInteger(d)).toBe(true);
  });

  /**
   * capsuleV2Duration arrondit la SOMME une seule fois, alors que le rendu
   * arrondit CHAQUE span puis cumule. Quand les deux divergent, la derniere
   * frame annoncee n'a aucun contenu : image noire en fin de capsule.
   */
  it("annonce autant de frames que le rendu en pose reellement", () => {
    for (const { id, props } of CAPSULES) {
      const parLot = capsuleV2Duration(props.spans);
      const parSpan =
        STING +
        TITLE +
        props.spans.reduce(
          (a, s) => a + Math.round((s.toSec - s.fromSec) * FPS),
          0,
        ) +
        CREDITS;
      expect(parLot, `${id} : ecart somme-arrondie vs span-par-span`).toBe(
        parSpan,
      );
    }
  });
});

describe("Root.tsx ne code aucune duree en dur", () => {
  /**
   * Historique : TeaserLaserErYag declarait durationInFrames={1590} alors que
   * capsuleV2Duration(TEASER4_PROPS.spans) vaut 1860 — 270 frames, 9 s d'ecart.
   * calculateMetadata rattrapait au rendu, donc la fausse valeur n'a jamais
   * casse une video : elle a juste menti dans le Studio pendant des semaines.
   *
   * Corrige a la racine : durationInFrames appelle desormais capsuleV2Duration.
   * Ce test interdit le retour d'un litteral, seul moyen de reintroduire l'ecart.
   */
  const root = readFileSync(join(process.cwd(), "src", "Root.tsx"), "utf8");

  /** Bloc <Composition> d'un id donne, jusqu'a sa balise fermante. */
  const blocDe = (id: string) => {
    const debut = root.indexOf(`id="${id}"`);
    return root.slice(debut, debut + root.slice(debut).indexOf("/>"));
  };

  it("aucune composition CapsuleV2 ne porte un durationInFrames litteral", () => {
    // Perimetre : le moteur de production. Les compositions gelees
    // (HeroLoop, Highlights) gardent leur litteral — elles ne sont plus
    // touchees et leurs defaultProps sont inline, sans source derivable.
    const literaux = CAPSULES.flatMap(({ id }) => {
      const m = blocDe(id).match(/durationInFrames=\{(\d+)\}/);
      return m ? [`${id}=${m[1]}`] : [];
    });
    expect(literaux, "durees en dur a remplacer par un appel calcule").toEqual(
      [],
    );
  });

  for (const { id } of CAPSULES) {
    it(`${id} : duree derivee des props, pas recopiee`, () => {
      expect(blocDe(id)).toMatch(/durationInFrames=\{capsuleV2Duration\(/);
    });
  }
});

describe("capsuleV2Schema", () => {
  it("accepte les props reelles des trois capsules", () => {
    for (const { id, props } of CAPSULES) {
      const r = capsuleV2Schema.safeParse(props);
      expect(r.success, `${id} : ${JSON.stringify(r.error?.issues)}`).toBe(true);
    }
  });

  it("rejette un kind d'overlay hors de l'enum", () => {
    const bad = {
      ...CAPSULE1_PROPS,
      overlays: [{ atSec: 1, durationSec: 2, kind: "hologramme" }],
    };
    expect(capsuleV2Schema.safeParse(bad).success).toBe(false);
  });

  it("rejette un volume de musique hors de [0,1]", () => {
    const bad = {
      ...CAPSULE1_PROPS,
      music: { src: "music/ambient-bed.wav", volume: 1.4 },
    };
    expect(capsuleV2Schema.safeParse(bad).success).toBe(false);
  });
});

describe("integrite des medias references", () => {
  /**
   * Un chemin d'asset est une chaine libre : une faute de frappe ne se voit
   * qu'au rendu, apres le bundling. Sur un pipeline automatise ou personne ne
   * relit chaque frame, la video part au praticien avec un visuel manquant.
   */
  for (const { id, props } of CAPSULES) {
    it(`${id} : tous les fichiers references existent dans public/`, () => {
      const attendus = [
        props.src,
        props.music?.src,
        ...props.overlays.flatMap((o) => [o.slideSrc, o.brollSrc]),
      ].filter((p): p is string => typeof p === "string" && p.length > 0);

      const manquants = attendus.filter((p) => !existsSync(join(PUBLIC, p)));
      expect(manquants, `${id} : fichiers absents de public/`).toEqual([]);
    });
  }
});

describe("bornes temporelles des calques", () => {
  /**
   * Un overlay pose au-dela de la fin de capsule est silencieusement invisible :
   * aucune erreur, juste l'infographie qui n'apparait jamais.
   */
  for (const { id, props } of CAPSULES) {
    it(`${id} : aucun calque ne deborde de la capsule`, () => {
      const finSec = capsuleV2Duration(props.spans) / FPS;
      const debordent = props.overlays
        .filter((o) => o.atSec + o.durationSec > finSec)
        .map((o) => `${o.kind}@${o.atSec}s+${o.durationSec}s > ${finSec}s`);
      expect(debordent, `${id} : calques hors bornes`).toEqual([]);
    });
  }

  it("le CTA, quand il existe, tient dans la capsule", () => {
    for (const { id, props } of CAPSULES) {
      if (!props.cta) continue;
      const finSec = capsuleV2Duration(props.spans) / FPS;
      expect(
        props.cta.atSec + props.cta.durationSec,
        `${id} : CTA hors bornes`,
      ).toBeLessThanOrEqual(finSec);
    }
  });
});
