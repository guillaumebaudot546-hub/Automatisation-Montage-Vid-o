// Genere une composition HyperFrames a partir d'un capsule.json.
//
//   npm run capsule:build <dossier-projet>     genere index.html
//   npm run capsule:check <dossier-projet>     verifie qu'il n'a pas derive
//
// POURQUOI CE SCRIPT EXISTE (decision 017).
// Une capsule generee depuis un prompt n'a pas de rush : ni transcription, ni
// spans, ni sous-titres. `plan.json` et son portail ne s'y appliquent pas. Sans
// contrat propre, l'agent ecrivait le HTML a la main — 12 Ko par vidoo, relus a
// chaque appel du modele : le poste le plus cher mesure le 31/07 (decision 016).
//
// Ici l'IA ne produit qu'un capsule.json de 2 Ko. Le code produit le HTML.
// C'est la decision 005 appliquee a la lettre : l'IA decide QUOI, le code
// decide COMMENT.
//
// LA CHARTE N'EST JAMAIS ECRITE ICI : elle est lue dans src/theme/<charte>.ts,
// source unique (REGLE 4bis). Ajouter un praticien = ajouter un theme, pas
// toucher a ce fichier.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { charte } from "./charte.mjs";

/* La racine du depot se deduit de l'emplacement de CE fichier (scripts/ y est
   toujours), jamais du dossier de travail : Hermes lance ses commandes depuis
   le dossier de la video, pas depuis la racine. */
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const RACINE = join(ROOT, "imcp-hyperframes");
const TEMPLATE = join(RACINE, "_socle", "capsule.template.html");
const verifie = process.argv.includes("--check");
const projet = process.argv.slice(2).find((a) => !a.startsWith("--"));

if (!projet) {
  console.error("Usage : node scripts/capsule-build.mjs <dossier-projet> [--check]");
  process.exit(1);
}

const lire = (p) => readFileSync(p, "utf8").replace(/^﻿/, "");

/**
 * Balisage restreint du sous-titre, tel que la doctrine le definit
 * (REGLE 2 : « mots-cles de CHAQUE sous-titre en cyan fluo, balisage **mot** »).
 * Volontairement pauvre : l'agent ne peut pas injecter de HTML arbitraire.
 */
const echappe = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const balise = (s) =>
  echappe(s)
    .replace(/\*\*([^*]+)\*\*/g, '<span class="kw">$1</span>')
    .replace(/\*([^*]+)\*/g, '<span class="em">$1</span>');

const ID = (i) => `s${i + 1}`;
const deuxChiffres = (n) => String(n).padStart(2, "0");

/**
 * Largeur de police du .lede : Cormorant 600 en pave .l { overflow:hidden } —
 * une ligne trop large n'est pas renvoyee, elle est tronquee net (bug du
 * 09/08 : « Microchirurgie », 14 caracteres, tenait sous ledeMaxCar=62 mais
 * debordait quand meme). Compter les caracteres ne suffit pas : un mot court
 * et large ("Microchirurgie") deborde alors qu'un mot long et etroit
 * ("Illinois-il-est-fini") tiendrait. Il faut estimer la largeur en pixels.
 *
 * Table de chasse en 1/1000 em, calquee sur Times-Roman (metrique standard
 * la plus proche d'un serif classique, publiquement documentee) — la lettre
 * compte, pas la police exacte. x1.35 : Times regular → Cormorant semibold
 * (600) est nettement plus large, mesure sur « Microchirurgie » (le mot qui a
 * debordé) recalé pour depasser la largeur utile a 94px. Une estimation ne
 * sera jamais pixel-parfaite ; en cas de doute mieux vaut rendre trop petit
 * (cosmetique) qu'omettre un depassement (le texte est coupe, illisible).
 */
const CHASSE = {
  a: 444, b: 500, c: 444, d: 500, e: 444, f: 333, g: 500, h: 500, i: 278,
  j: 278, k: 500, l: 278, m: 778, n: 500, o: 500, p: 500, q: 500, r: 333,
  s: 389, t: 278, u: 500, v: 500, w: 722, x: 500, y: 500, z: 444,
  " ": 250, "-": 333, "'": 180, ".": 250, ",": 250, ":": 278, ";": 278,
};
const chasseLettre = (c) => {
  const majuscule = c !== c.toLowerCase();
  const bas = c.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return (CHASSE[bas] ?? 500) * (majuscule ? 1.5 : 1);
};
const largeurEstimee = (texte, taillePx) =>
  [...String(texte)].reduce((s, c) => s + chasseLettre(c), 0) / 1000 * taillePx * 1.35;

/* --- Blocs : un type = un rendu + une entree animee ------------------------ */

/**
 * Carte de legende d'un bloc photo — identique qu'elle porte une image ou une
 * video. Elle reprend le numero de scene : sur un plan photo le sur-titre
 * flottant est supprime (illisible sur l'image, cf. .ph-carte .num), et le
 * numero doit rester quelque part.
 */
const legendeDe = (id, d, n) =>
  d.tag || d.texte
    ? `        <div id="${id}pc" class="ph-carte">\n` +
      (d.tag
        ? `          <span class="tag"><span class="num">${deuxChiffres(n)}</span>` +
          `${echappe(d.tag)}</span>\n`
        : "") +
      (d.texte ? `          <span class="txt">${balise(d.texte)}</span>\n` : "") +
      `        </div>\n`
    : "";

const BLOCS = {
  rule: {
    html: (id) => `        <i id="${id}r" class="rule"></i>\n`,
    tl: () => "",
    opts: () => ({ rule: true }),
  },

  "duo-profils": {
    html: (id, d) =>
      `        <div class="cols">\n` +
      `          <div id="${id}c1" class="col m1">\n` +
      `            <span class="tag">${echappe(d.gauche.tag)}</span>\n` +
      `            <span class="body">${balise(d.gauche.texte)}</span>\n` +
      `          </div>\n` +
      `          <div id="${id}c2" class="col m2">\n` +
      `            <span class="tag">${echappe(d.droite.tag)}</span>\n` +
      `            <span class="body">${balise(d.droite.texte)}</span>\n` +
      `          </div>\n` +
      `        </div>\n`,
    tl: (id, d, at) =>
      `      tl.fromTo("#${id}c1", { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.62, ease: E }, ${(at + 1).toFixed(2)});\n` +
      `      tl.fromTo("#${id}c2", { opacity: 0, x: 30 }, { opacity: 1, x: 0, duration: 0.62, ease: E }, ${(at + 1.28).toFixed(2)});\n`,
    opts: () => ({ subAt: 2.2 }),
  },

  marqueurs: {
    html: (id, d) =>
      `        <div class="marks">\n` +
      d.map((m) => `          <span class="mark ${id}m">${echappe(m)}</span>`).join("\n") +
      `\n        </div>\n`,
    tl: (id, d, at) =>
      `      tl.fromTo(".${id}m", { opacity: 0, y: 18, scale: 0.9 },\n` +
      `        { opacity: 1, y: 0, scale: 1, duration: 0.42, stagger: 0.085, ease: "back.out(2)" }, ${(at + 0.9).toFixed(2)});\n`,
    opts: () => ({ subAt: 2.3 }),
  },

  jauge: {
    html: (id, d) =>
      `        <div id="${id}g" class="gauge">\n          ` +
      d.zones.map((z) => `<span class="g-${z.ton}" style="width:${z.pct}%"></span>`).join("") +
      `\n        </div>\n` +
      `        <i id="${id}cur" class="cursor"></i>\n` +
      `        <div id="${id}l" class="glabels">\n          ` +
      d.zones.map((z) => `<span style="width:${z.pct}%">${echappe(z.label)}</span>`).join("") +
      `\n        </div>\n`,
    tl: (id, d, at) =>
      `      tl.fromTo("#${id}g", { opacity: 0, scaleX: 0.1 },\n` +
      `        { opacity: 1, scaleX: 1, duration: 0.85, ease: E, transformOrigin: "left center" }, ${(at + 0.8).toFixed(2)});\n` +
      `      tl.fromTo("#${id}l", { opacity: 0 }, { opacity: 1, duration: 0.5, ease: E }, ${(at + 1.5).toFixed(2)});\n` +
      `      tl.fromTo("#${id}cur", { opacity: 0, x: 0 },\n` +
      `        { opacity: 1, x: ${Math.round((d.curseurPct / 100) * 1420)}, duration: 1.5, ease: "power2.inOut" }, ${(at + 1.8).toFixed(2)});\n`,
    opts: () => ({ subAt: 2.5 }),
  },

  "etapes-score": {
    html: (id, d) =>
      `        <div class="steps">\n` +
      d.etapes
        .map(
          (e, i) =>
            `          <div class="step ${id}s"><span class="t">${deuxChiffres(i + 1)} · ${echappe(e.titre)}</span><span class="d">${echappe(e.texte)}</span></div>`,
        )
        .join("\n") +
      `\n        </div>\n` +
      `        <div class="score"><span id="${id}n" class="n">0</span><span id="${id}u" class="u">${echappe(d.score.libelle)}</span></div>\n`,
    tl: (id, d, at) =>
      `      tl.fromTo(".${id}s", { opacity: 0, y: 22, scaleY: 0.94 },\n` +
      `        { opacity: 1, y: 0, scaleY: 1, duration: 0.5, stagger: 0.17, ease: E }, ${(at + 0.9).toFixed(2)});\n` +
      `      tl.fromTo("#${id}n", { opacity: 0 }, { opacity: 1, duration: 0.4, ease: E }, ${(at + 2.1).toFixed(2)});\n` +
      `      tl.fromTo("#${id}u", { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5, ease: E }, ${(at + 2.5).toFixed(2)});\n` +
      `      compteur("#${id}n", ${d.score.valeur}, ${(at + 2.1).toFixed(2)}, 1.5);\n`,
    opts: () => ({ sub: false }),
  },

  comparatif: {
    html: (id, d) =>
      `        <div class="duo">\n` +
      `          <div id="${id}c1" class="card bad"><span class="h">${echappe(d.gauche.titre)}</span><span id="${id}v1" class="v">0</span><span class="d">${echappe(d.gauche.note)}</span></div>\n` +
      `          <div id="${id}c2" class="card ok"><span class="h">${echappe(d.droite.titre)}</span><span id="${id}v2" class="v">0</span><span class="d">${echappe(d.droite.note)}</span></div>\n` +
      `        </div>\n`,
    tl: (id, d, at) =>
      `      tl.fromTo("#${id}c1", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.55, ease: E }, ${(at + 0.9).toFixed(2)});\n` +
      `      tl.fromTo("#${id}c2", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.55, ease: E }, ${(at + 1.3).toFixed(2)});\n` +
      `      compteur("#${id}v1", ${d.gauche.valeur}, ${(at + 1.2).toFixed(2)}, 0.9);\n` +
      `      compteur("#${id}v2", ${d.droite.valeur}, ${(at + 1.6).toFixed(2)}, 1.1);\n`,
    opts: () => ({ subAt: 2.3 }),
  },

  manifeste: {
    html: (id, d) =>
      `        <div class="lines">\n` +
      d.lignes.map((l) => `          <span class="line ${id}l">${echappe(l)}</span>`).join("\n") +
      `\n        </div>\n`,
    tl: (id, d, at) =>
      `      tl.fromTo(".${id}l", { opacity: 0, x: -22 },\n` +
      `        { opacity: 1, x: 0, duration: 0.55, stagger: 0.3, ease: E }, ${(at + 0.7).toFixed(2)});\n`,
    opts: () => ({ lede: false, subAt: 2.6 }),
  },

  /* Photo plein cadre.
   *
   * POURQUOI CE BLOC EXISTE. Le 09/08/2026, une galerie de photos a produit une
   * video en ffmpeg brut : police DejaVu du systeme, rectangle gris en guise de
   * carton, zoompan pour toute animation. Elle etait hors doctrine sans que rien
   * ne le signale — le portail n'avait aucun contrat a juger, parce qu'AUCUN des
   * huit blocs ne portait d'image. Le chemin conforme n'existait pas : l'agent a
   * pris le seul qu'on lui avait laisse.
   *
   * data = { fichier, cadrage?: "cover"|"fit"|"panneau", tag?, texte? }
   *
   * « fichier » accepte une image OU une video. Un plan anime (Higgsfield,
   * ou n'importe quel .mp4) se pose exactement comme une photo : meme cadrage,
   * meme carte de legende, meme place dans le contrat. Le socle ne fait pas de
   * difference, donc la doctrine non plus.
   */
  photo: {
    html: (id, d, n) => {
      const fit = d.cadrage === "fit";
      const panneau = d.cadrage === "panneau";
      // Une VIDEO ne se pose pas ici : HyperFrames possede la lecture des
      // medias, et un <video> imbrique dans une scene n'est jamais mis en
      // marche — il reste noir. Elle sort en clip de premier niveau, via
      // `pistes` ci-dessous. Seuls le voile et la carte restent dans la scene.
      if (/\.(mp4|mov|webm)$/i.test(d.fichier || "")) {
        return (
          `        <span class="ph-voile${panneau ? " panneau" : ""}"></span>\n` +
          legendeDe(id, d, n)
        );
      }
      // En « fit », l'image entiere tient dans le cadre et le vide se remplit
      // d'une copie floutee d'elle-meme — jamais d'un aplat, qui ferait trou.
      const flou = fit
        ? `          <img class="ph-flou" src="${echappe(d.fichier)}" alt="" />\n`
        : "";
      const classes = `ph${fit ? " fit" : ""}${panneau ? " panneau" : ""}`;
      // data-layout-allow-overflow : le debordement est VOULU. La respiration de
      // camera (scale 1.02 -> 1.07) fait forcement depasser l'image de son cadre,
      // qui la rogne — c'est le principe meme du mouvement. Sans cette marque,
      // `hyperframes check` le signale a chaque scene et noie les vrais defauts.
      return (
        `        <span class="ph-wrap${panneau ? " panneau" : ""}" data-layout-allow-overflow>\n` +
        flou +
        `          <img id="${id}p" class="${classes}" src="${echappe(d.fichier)}" alt="" />\n` +
        `        </span>\n` +
        `        <span class="ph-voile${panneau ? " panneau" : ""}"></span>\n` +
        legendeDe(id, d, n)
      );
    },

    /**
     * Clip de premier niveau pour un media video.
     *
     * Le contrat HyperFrames : un <video> doit etre un clip a lui seul, avec
     * data-start / data-duration / data-media-start / data-track-index, place
     * en frere des scenes (voir capsule-3204, la composition de reference).
     * Imbrique, il ne joue pas.
     *
     * Piste 7 : au-dessus des fonds (0-4) et de la scene (5). PAS la piste 6 —
     * elle porte deja #foot (le pied de page, 0 a DUREE) dans le socle ; un
     * clip video y chevauchait #foot et le check le rejetait
     * (overlapping_clips_same_track, trouve le 09/08 en revalidant ce fichier).
     * Le voile et la carte restent DANS la scene et repassent devant par
     * l'ordre du DOM.
     */
    pistes: (id, d, at, duree) => {
      if (!/\.(mp4|mov|webm)$/i.test(d.fichier || "")) return "";
      const panneau = d.cadrage === "panneau";
      return (
        `      <video id="${id}p" class="clip ph${panneau ? " panneau" : ""}"` +
        ` src="${echappe(d.fichier)}" muted playsinline\n` +
        `             data-start="${at}" data-duration="${duree}" data-media-start="0"` +
        ` data-track-index="7"></video>\n`
      );
    },
    // Camera qui respire, pas zoom qui recadre : 1.02 -> 1.07 sur toute la
    // scene (RÈGLE 4ter). Au-dela, on rogne le sujet sans l'avoir voulu.
    //
    // Un media DEJA anime ne recoit pas cette respiration : il porte la sienne,
    // et deux mouvements superposes donnent un flottement desagreable.
    tl: (id, d, at, duree) => {
      const fin = (duree ?? 5).toFixed(2);
      const estVideo = /\.(mp4|mov|webm)$/i.test(d.fichier || "");
      let s = estVideo
        ? ""
        : `      tl.fromTo("#${id}p", { scale: 1.02 }, { scale: 1.07, duration: ${fin}, ease: "none" }, ${at.toFixed(2)});\n`;
      if (d.tag || d.texte) {
        s +=
          `      tl.fromTo("#${id}pc", { opacity: 0, y: 26 },\n` +
          `        { opacity: 1, y: 0, duration: 0.55, ease: E }, ${(at + 0.5).toFixed(2)});\n`;
      }
      return s;
    },
    // La photo remplace le titre : un lede de 94px par-dessus une image
    // clinique la rendrait illisible, et la legende dit deja ce qu'il faut.
    //
    // kicker:false quand la carte porte un tag — le sur-titre flottant disait
    // alors EXACTEMENT le meme mot que le tag, deux fois a l'ecran, et le
    // faisait par-dessus la photo a 1,2:1 de contraste. La carte le dit mieux.
    opts: (d) => ({
      lede: false,
      sub: false,
      plein: true,
      kicker: !(d && d.tag),
    }),
  },

  aucun: { html: () => "", tl: () => "", opts: () => ({}) },
};

/* --- Generation ----------------------------------------------------------- */

function rend(template, cap) {
  const p = charte(cap.charte || "client-01");
  const [W, H] = { "16:9": [1920, 1080], "9:16": [1080, 1920], "1:1": [1080, 1080] }[cap.format];
  const duree = cap.scenes.reduce((a, s) => a + s.dureeSec, 0);

  let sections = "";
  let timeline = "";
  let at = 0;

  cap.scenes.forEach((sc, i) => {
    const id = ID(i);
    const bloc = BLOCS[sc.bloc?.type || "aucun"];
    if (!bloc) {
      console.error(`❌ Scene ${i + 1} : bloc « ${sc.bloc.type} » inconnu.`);
      console.error(`   Vocabulaire : ${Object.keys(BLOCS).join(", ")}`);
      process.exit(1);
    }
    const d = sc.bloc?.data;
    const o = bloc.opts(d);
    // .scene { padding:104px 150px 104px 190px } — largeur utile constante,
    // quel que soit le format (le pave .l qui deborde est coupe net, pas renvoye).
    const largeurUtile = W - 340;
    const petit =
      (sc.lede || []).join(" ").length > 34 ||
      (sc.lede || []).length === 1 ||
      (sc.lede || []).some((l) => largeurEstimee(l, 94) > largeurUtile);

    let corps = `      <!-- ${deuxChiffres(i + 1)} -->\n`;
    corps += `      <section id="${id}" class="clip scene" data-start="${at}" data-duration="${sc.dureeSec}" data-track-index="5">\n`;
    corps += `        <i id="${id}k" class="rail"></i>\n`;
    if (o.kicker !== false) {
      corps += `        <em class="kicker"><span class="num">${deuxChiffres(i + 1)}</span>${echappe(sc.kicker)}</em>\n`;
    }
    if (o.lede !== false) {
      corps += `        <strong id="${id}a" class="lede${petit ? " sm" : ""}">`;
      corps += sc.lede.map((l) => `<span class="l"><i>${balise(l)}</i></span>`).join("");
      corps += `</strong>\n`;
    }
    corps += bloc.html(id, d, i + 1);
    if (o.sub !== false && sc.sub) {
      corps += `        <span id="${id}b" class="sub">${balise(sc.sub)}</span>\n`;
    }
    if (sc.signature) {
      corps += `        <span id="${id}s" class="sig">${echappe(sc.signature)}</span>\n`;
    }
    corps += `      </section>\n`;
    // Les clips de premier niveau (video) sortent AVANT la scene : ils sont
    // ses freres, pas ses enfants — sinon HyperFrames ne les joue pas.
    const piste = bloc.pistes ? bloc.pistes(id, d, at, sc.dureeSec) : "";
    sections += piste + corps + (i < cap.scenes.length - 1 ? "\n" : "");

    const arg = JSON.stringify(o).replace(/"/g, "").replace(/:/g, ": ").replace(/,/g, ", ");
    timeline += `      scene(${at}, "${id}"${Object.keys(o).length ? `, ${arg}` : ""});\n`;
    // La duree de scene est passee en 4e argument : le bloc photo en a besoin
    // pour etaler sa respiration de camera sur toute la scene, ni plus ni moins.
    // Les autres blocs l'ignorent.
    timeline += bloc.tl(id, d, at, sc.dureeSec);
    if (sc.signature) {
      timeline += `      tl.fromTo("#${id}s", { opacity: 0, y: 18 },\n` +
        `        { opacity: 1, y: 0, duration: 0.8, ease: E }, ${(at + 3.6).toFixed(2)});\n`;
    }
    at += sc.dureeSec;
  });

  const m = cap.musique;
  const v = cap.voix;
  /* Sous une voix off, la musique redescend a un lit : « volume ~0,08, fondus
     entree/sortie » (preference du praticien, praticiens/client-01.json). Seule,
     elle porte la video et remonte. Le montage ne doit jamais faire choisir
     entre entendre le propos et entendre la musique. */
  const volMus = m?.volume ?? (v ? 0.1 : 0.68);
  const audio =
    (m
      ? `\n      <!-- Lit musical. Nom d'origine conserve : renommer masque la provenance\n` +
        `           (decision 014). Licence : ${m.licence || "NON FOURNIE — hors depot"}. -->\n` +
        `      <audio id="bgm" src="${echappe(m.fichier)}"\n` +
        `             data-start="0" data-duration="${duree}" data-track-index="10"\n` +
        `             data-volume="${volMus}"></audio>\n`
      : "") +
    (v
      ? `\n      <!-- Voix off${v.langue ? ` (${echappe(v.langue)})` : ""}. Piste propre : elle ne\n` +
        `           subit ni le fondu de la musique ni son attenuation. -->\n` +
        `      <audio id="vo" src="${echappe(v.fichier)}"\n` +
        `             data-start="${v.debutSec ?? 0}"` +
        ` data-duration="${v.dureeSec ?? duree - (v.debutSec ?? 0)}"\n` +
        `             data-media-start="0" data-track-index="11"\n` +
        `             data-volume="${v.volume ?? 1}"></audio>\n`
      : "");
  const audioTl = m
    ? `      tl.fromTo("#bgm", { volume: 0 }, { volume: ${volMus}, duration: 2.5, ease: "sine.out" }, 0);\n` +
      `      tl.to("#bgm", { volume: 0, duration: 5, ease: "sine.in" }, ${duree - 5});\n`
    : "";

  /* Sous-titres de la voix off (RÈGLE 2 : mots-cles en cyan).
     Les reperes sont exprimes DANS le fichier de voix, pas dans la video : on
     peut deplacer la voix (debutSec) sans retoucher un seul repere. */
  const cues = v?.sousTitres || [];
  const decal = v?.debutSec ?? 0;
  const sousTitres = cues.length
    ? `\n      <div id="st" class="st">\n` +
      cues
        .map((c, j) => `        <span id="st${j}" class="cue">${balise(c.t)}</span>\n`)
        .join("") +
      `      </div>\n`
    : "";
  /* Les sous-titres sont empiles au meme endroit : un seul doit etre visible a
     la fois. Le fondu de sortie doit donc etre TERMINE quand le suivant
     apparait — sinon deux textes se superposent, illisibles. Mesure du
     09/08 : 0,13 s de chevauchement entre deux repliques collees, signale par
     `hyperframes check` (content_overlap). */
  const SORTIE = 0.14;
  for (const [j, c] of cues.entries()) {
    const suivant = cues[j + 1];
    const finVisible = suivant ? Math.min(c.e, suivant.s - SORTIE) : c.e;
    const debut = decal + c.s;
    const fin = decal + Math.max(finVisible, c.s + 0.2);
    timeline +=
      `      tl.fromTo("#st${j}", { opacity: 0, y: 12 },\n` +
      `        { opacity: 1, y: 0, duration: 0.22, ease: E }, ${debut.toFixed(2)});\n` +
      `      tl.to("#st${j}", { opacity: 0, duration: ${SORTIE}, ease: "none" }, ${fin.toFixed(2)});\n`;
  }

  return template
    .split("{{DUREE}}").join(String(duree))
    .split("{{W}}").join(String(W))
    .split("{{H}}").join(String(H))
    .split("{{C_NAVY}}").join(p.navy950)
    .split("{{C_IVORY}}").join(p.ivory)
    .split("{{C_CREAM}}").join(p.cream)
    .split("{{C_SLATE}}").join(p.slate)
    .split("{{C_ACCENT}}").join(p.champagne)
    .split("{{FOOT}}").join(echappe(cap.pied))
    .split("{{SCENES}}").join(sections.replace(/\n$/, ""))
    .split("{{SOUSTITRES}}").join(sousTitres)
    .split("{{AUDIO}}").join(audio)
    .split("{{AUDIO_TL}}").join(audioTl)
    .split("{{TIMELINE}}").join(timeline);
}

const capChemin = join(projet, "capsule.json");
if (!existsSync(capChemin)) {
  console.error(`❌ ${capChemin} introuvable — ce projet n'est pas une capsule generee.`);
  process.exit(1);
}
if (!existsSync(TEMPLATE)) {
  console.error(`❌ Socle introuvable : ${TEMPLATE}`);
  process.exit(1);
}

const cap = JSON.parse(lire(capChemin));
const attendu = rend(lire(TEMPLATE), cap);
const cible = join(projet, "index.html");
const actuel = existsSync(cible) ? lire(cible) : null;

if (actuel === attendu) {
  console.log(`= ${projet} — conforme au socle capsule`);
  process.exit(0);
}
if (verifie) {
  console.log(`≠ ${projet} — index.html a derive du socle capsule${actuel === null ? " (absent)" : ""}`);
  console.log("\n❌ Un index.html genere a ete edite a la main.");
  console.log("   Reporter le changement dans capsule.json ou dans _socle/capsule.template.html,");
  console.log("   puis npm run capsule:build " + projet);
  process.exit(2);
}
writeFileSync(cible, attendu);
console.log(`→ ${projet} — index.html genere (${cap.scenes.length} scenes, ${attendu.length} octets)`);
console.log("   Etape suivante OBLIGATOIRE : npm run portail:capsule -- " + projet);
