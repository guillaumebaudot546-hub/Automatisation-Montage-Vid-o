// Tests du portail des capsules generees depuis un prompt (decision 017).
//
// Jusqu'au 02/08/2026 une capsule passait SANS AUCUN garde-fou. Ce portail est
// desormais le seul controle entre un prompt et un rendu facture — et il
// n'avait aucun test. La capsule de reference ci-dessous est celle que
// scripts/deploy-vps.sh envoie en controle de deploiement : si elle cesse de
// passer, le deploiement echouera aussi.
//
// Sortie 0 = passe · 3 = rejet · 1 = erreur d'usage.
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ICI = dirname(fileURLToPath(import.meta.url));
const RACINE = resolve(ICI, "..");
const SCRIPT = join(ICI, "portail-capsule.mjs");

/** La capsule du controle de deploiement : connue bonne en production. */
const CAPSULE_OK = {
  type: "capsule-prompt",
  charte: "client-01",
  format: "16:9",
  reseau: "youtube",
  pied: "Contrôle de déploiement",
  scenes: [
    {
      kicker: "Test",
      lede: ["Le socle répond."],
      dureeSec: 10,
      bloc: { type: "rule" },
      sub: "Vérification automatique.",
    },
  ],
};

let dossier;
beforeEach(() => {
  dossier = mkdtempSync(join(tmpdir(), "portail-capsule-"));
});
afterEach(() => {
  rmSync(dossier, { recursive: true, force: true });
});

/** Ecrit une capsule derivee de la reference, puis lance le portail. */
const juge = (patch) => {
  if (patch !== undefined) {
    writeFileSync(join(dossier, "capsule.json"), JSON.stringify(patch));
  }
  return spawnSync(process.execPath, [SCRIPT, dossier], {
    cwd: RACINE,
    encoding: "utf8",
  });
};

/** La reference, avec une seule scene remplacee. */
const avecScene = (scene) => ({
  ...CAPSULE_OK,
  scenes: [{ ...CAPSULE_OK.scenes[0], ...scene }],
});

describe("usage", () => {
  it("sort 1 quand le dossier n'a pas de capsule.json", () => {
    const r = juge();
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("introuvable");
  });

  it("sort 1 quand aucun dossier n'est donne", () => {
    const r = spawnSync(process.execPath, [SCRIPT], { cwd: RACINE, encoding: "utf8" });
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("Usage");
  });
});

describe("la capsule de reference passe", () => {
  it("sort 0 sans aucune violation", () => {
    const r = juge(CAPSULE_OK);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("Aucune violation");
  });

  it("ecrit un recu — sans lui, guard-portail refuserait le rendu", () => {
    expect(juge(CAPSULE_OK).status).toBe(0);
    expect(existsSync(join(dossier, ".portail-ok.json"))).toBe(true);
  });
});

describe("charte", () => {
  it("rejette une charte qui n'existe pas", () => {
    const r = juge({ ...CAPSULE_OK, charte: "praticien-fantome" });
    expect(r.status).toBe(3);
    expect(r.stdout).toContain("introuvable");
  });
});

describe("musique — regle non negociable", () => {
  it("rejette une piste sans preuve de licence", () => {
    const r = juge({ ...CAPSULE_OK, musique: { fichier: "beau-morceau.mp3" } });
    expect(r.status).toBe(3);
    expect(r.stdout).toContain("licence");
  });

  it("rejette une piste declaree mais absente du projet", () => {
    const r = juge({
      ...CAPSULE_OK,
      musique: { fichier: "absente.mp3", licence: "CC0 — preuve jointe" },
    });
    expect(r.status).toBe(3);
    expect(r.stdout).toContain("Piste absente");
  });
});

describe("format (REGLE 5bis)", () => {
  it("rejette un format hors doctrine", () => {
    const r = juge({ ...CAPSULE_OK, format: "4:3" });
    expect(r.status).toBe(3);
    expect(r.stdout).toContain("hors doctrine");
  });

  it("rejette un format incoherent avec le reseau", () => {
    const r = juge({ ...CAPSULE_OK, format: "16:9", reseau: "instagram reels" });
    expect(r.status).toBe(3);
    expect(r.stdout).toContain("9:16 attendu");
  });
});

describe("structure", () => {
  it("rejette une capsule sans scene", () => {
    const r = juge({ ...CAPSULE_OK, scenes: [] });
    expect(r.status).toBe(3);
    expect(r.stdout).toContain("Aucune scene");
  });

  it("rejette un bloc hors vocabulaire", () => {
    const r = juge(avecScene({ bloc: { type: "carrousel-3d" } }));
    expect(r.status).toBe(3);
    expect(r.stdout).toContain("hors vocabulaire");
  });

  it("rejette une scene plus courte que le minimum", () => {
    const r = juge(avecScene({ dureeSec: 2 }));
    expect(r.status).toBe(3);
    expect(r.stdout).toContain("minimum 4 s");
  });

  it("avertit seulement quand le pied de page manque", () => {
    const sans = { ...CAPSULE_OK };
    delete sans.pied;
    const r = juge(sans);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("attribution");
  });
});

describe("lisibilite — le controle central d'une video muette", () => {
  it("rejette du texte qu'on n'a pas le temps de lire", () => {
    const r = juge(
      avecScene({
        dureeSec: 5,
        sub: "Voici beaucoup trop de mots pour le temps imparti a cette scene " +
          "et personne ne pourra jamais lire tout cela avant la coupure suivante.",
      }),
    );
    expect(r.status).toBe(3);
    expect(r.stdout).toContain("Illisible");
  });

  it("rejette une scene entierement mangee par son animation d'entree", () => {
    const r = juge(avecScene({ dureeSec: 3, bloc: { type: "etapes-score" } }));
    expect(r.status).toBe(3);
    expect(r.stdout).toContain("animation d'entree");
  });

  it("avertit sur une scene lisible mais sans marge", () => {
    const r = juge(
      avecScene({ dureeSec: 5, sub: "Un rythme tenable mais serre pour la lecture ici." }),
    );
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("sans marge");
  });

  it("ne compte pas le balisage **gras** comme du texte a lire", () => {
    const r = juge(avecScene({ sub: "**Vérification** automatique." }));
    expect(r.status).toBe(0);
  });
});

describe("debordement", () => {
  it("rejette une ligne de titre qui passera a la ligne", () => {
    const r = juge(
      avecScene({
        lede: ["Une ligne de titre beaucoup trop longue qui va casser le masque d'animation."],
        dureeSec: 20,
      }),
    );
    expect(r.status).toBe(3);
    expect(r.stdout).toContain("cassera le masque");
  });

  it("avertit seulement sur un sur-titre trop long", () => {
    const r = juge(
      avecScene({ kicker: "UN SUR-TITRE VRAIMENT TRES LONG POUR DES MAJUSCULES", dureeSec: 20 }),
    );
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("deborde");
  });
});

// Le bloc photo est ne d'un trou de couverture : le 09/08/2026, une galerie de
// photos a produit une video hors doctrine — police systeme, carton gris, aucune
// animation — parce qu'AUCUN bloc ne portait d'image. Le portail n'avait rien a
// juger, donc il a laisse passer vingt fois de suite. Ces tests verrouillent le
// chemin conforme.
describe("bloc photo", () => {
  const scenePhoto = (data) => ({
    kicker: "Étape 2",
    lede: [],
    dureeSec: 6,
    bloc: { type: "photo", data },
  });

  it("accepte une photo dont le fichier existe", () => {
    writeFileSync(join(dossier, "p01.jpg"), "faux-jpeg");
    const r = juge(avecScene(scenePhoto({ fichier: "p01.jpg", cadrage: "cover", tag: "Étape 2", texte: "Greffe." })));
    expect(r.status).toBe(0);
  });

  it("REJETTE une image introuvable — sinon le cadre sort vide apres six minutes de rendu", () => {
    const r = juge(avecScene(scenePhoto({ fichier: "absente.jpg", tag: "x", texte: "y" })));
    expect(r.status).toBe(3);
    expect(r.stdout).toContain("introuvable");
  });

  it("REJETTE un bloc photo sans fichier", () => {
    const r = juge(avecScene(scenePhoto({ tag: "x", texte: "y" })));
    expect(r.status).toBe(3);
    expect(r.stdout).toContain("sans « fichier »");
  });

  it("REJETTE un cadrage hors vocabulaire — etirer l'image est interdit", () => {
    writeFileSync(join(dossier, "p01.jpg"), "faux-jpeg");
    const r = juge(avecScene(scenePhoto({ fichier: "p01.jpg", cadrage: "fill", tag: "x", texte: "y" })));
    expect(r.status).toBe(3);
    expect(r.stdout).toContain("RÈGLE 5bis");
  });

  it("avertit sur une photo sans legende, sans bloquer", () => {
    writeFileSync(join(dossier, "p01.jpg"), "faux-jpeg");
    const r = juge(avecScene(scenePhoto({ fichier: "p01.jpg", cadrage: "cover" })));
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("ne saura pas ce qu'il regarde");
  });
});

/* --- Voix off ------------------------------------------------------------- */
describe("voix off", () => {
  const avecVoix = (voix, scenes) => ({
    ...CAPSULE_OK,
    voix,
    ...(scenes ? { scenes } : {}),
  });

  it("laisse passer une voix declaree dont le fichier existe", () => {
    writeFileSync(join(dossier, "vo.mp3"), "faux-mp3");
    const r = juge(avecVoix({ fichier: "vo.mp3", langue: "fr" }));
    expect(r.status).toBe(0);
  });

  it("REJETTE une voix dont le fichier manque — sinon la video sort muette", () => {
    const r = juge(avecVoix({ fichier: "absent.mp3", langue: "fr" }));
    expect(r.status).toBe(3);
    expect(r.stdout).toContain("absent.mp3");
  });

  it("REJETTE une voix sans langue declaree", () => {
    writeFileSync(join(dossier, "vo.mp3"), "faux-mp3");
    const r = juge(avecVoix({ fichier: "vo.mp3" }));
    expect(r.status).toBe(3);
    expect(r.stdout).toContain("langue");
  });

  it("REJETTE une voix anglaise laissee avec des textes francais a l'ecran", () => {
    // Le defaut le plus couteux : il ne se voit qu'a la relecture du praticien.
    writeFileSync(join(dossier, "vo.mp3"), "faux-mp3");
    const r = juge(
      avecVoix({ fichier: "vo.mp3", langue: "en" }, [
        { ...CAPSULE_OK.scenes[0], lede: ["Le socle répond."] },
      ]),
    );
    expect(r.status).toBe(3);
    expect(r.stdout).toContain("restes en francais");
  });

  it("laisse passer une voix anglaise avec des textes anglais", () => {
    writeFileSync(join(dossier, "vo.mp3"), "faux-mp3");
    const r = juge(
      avecVoix({ fichier: "vo.mp3", langue: "en" }, [
        {
          kicker: "Test",
          lede: ["The socle answers."],
          dureeSec: 10,
          bloc: { type: "rule" },
          sub: "Automated verification.",
        },
      ]),
    );
    expect(r.status).toBe(0);
  });
});

/* --- Sous-titres cales sur la voix ----------------------------------------- */
describe("sous-titres de la voix off", () => {
  const avecST = (sousTitres) => ({
    ...CAPSULE_OK,
    voix: { fichier: "vo.mp3", langue: "en", debutSec: 0, dureeSec: 8, sousTitres },
    scenes: [{ kicker: "Test", lede: ["The socle answers."], dureeSec: 10,
      bloc: { type: "rule" }, sub: "Automated verification." }],
  });

  it("laisse passer des reperes coherents", () => {
    writeFileSync(join(dossier, "vo.mp3"), "faux-mp3");
    expect(juge(avecST([{ s: 0, e: 3, t: "A blue margin." }])).status).toBe(0);
  });

  it("REJETTE un repere qui deborde de la video", () => {
    writeFileSync(join(dossier, "vo.mp3"), "faux-mp3");
    const r = juge(avecST([{ s: 0, e: 40, t: "Too late." }]));
    expect(r.status).toBe(3);
    expect(r.stdout).toContain("coupe");
  });

  it("REJETTE un repere pose sur du silence apres la voix", () => {
    writeFileSync(join(dossier, "vo.mp3"), "faux-mp3");
    const r = juge(avecST([{ s: 8.6, e: 9.5, t: "Nobody speaks here." }]));
    expect(r.status).toBe(3);
    expect(r.stdout).toContain("silence");
  });

  it("REJETTE un sous-titre illisible — trop de mots en trop peu de temps", () => {
    writeFileSync(join(dossier, "vo.mp3"), "faux-mp3");
    const r = juge(avecST([{ s: 0, e: 1, t: "one two three four five six seven eight" }]));
    expect(r.status).toBe(3);
    expect(r.stdout).toContain("illisible");
  });

  it("REJETTE une fin avant le debut", () => {
    writeFileSync(join(dossier, "vo.mp3"), "faux-mp3");
    const r = juge(avecST([{ s: 5, e: 2, t: "Backwards." }]));
    expect(r.status).toBe(3);
  });

  it("attrape un sous-titre reste en francais sous une voix anglaise", () => {
    writeFileSync(join(dossier, "vo.mp3"), "faux-mp3");
    const r = juge(avecST([{ s: 0, e: 3, t: "La gencive est saine." }]));
    expect(r.status).toBe(3);
    expect(r.stdout).toContain("restes en francais");
  });
});
