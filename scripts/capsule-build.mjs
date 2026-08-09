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

/** Palette officielle depuis src/theme/<nom>.ts — jamais recopiee ici. */
function charte(nom) {
  const chemin = join(ROOT, "src", "theme", `${nom}.ts`);
  if (!existsSync(chemin)) {
    console.error(`❌ Charte introuvable : ${chemin}`);
    console.error("   Un praticien = un theme. Creer le fichier avant de generer.");
    process.exit(1);
  }
  const src = lire(chemin);
  const bloc = src.slice(src.indexOf("color: {"), src.indexOf("}", src.indexOf("color: {")));
  const p = {};
  for (const m of bloc.matchAll(/(\w+):\s*"(#[0-9a-fA-F]{6})"/g)) p[m[1]] = m[2].toLowerCase();
  return p;
}

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

/* --- Blocs : un type = un rendu + une entree animee ------------------------ */

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
   * data = { fichier, cadrage?: "cover"|"fit", tag?, texte? }
   */
  photo: {
    html: (id, d) => {
      const fit = d.cadrage === "fit";
      // En « fit », l'image entiere tient dans le cadre et le vide se remplit
      // d'une copie floutee d'elle-meme — jamais d'un aplat, qui ferait trou.
      const flou = fit
        ? `          <img class="ph-flou" src="${echappe(d.fichier)}" alt="" />\n`
        : "";
      const legende =
        d.tag || d.texte
          ? `        <div id="${id}pc" class="ph-carte">\n` +
            (d.tag ? `          <span class="tag">${echappe(d.tag)}</span>\n` : "") +
            (d.texte ? `          <span class="txt">${balise(d.texte)}</span>\n` : "") +
            `        </div>\n`
          : "";
      return (
        `        <span class="ph-wrap">\n` +
        flou +
        `          <img id="${id}p" class="ph${fit ? " fit" : ""}" src="${echappe(d.fichier)}" alt="" />\n` +
        `        </span>\n` +
        `        <span class="ph-voile"></span>\n` +
        legende
      );
    },
    // Camera qui respire, pas zoom qui recadre : 1.02 -> 1.07 sur toute la
    // scene (RÈGLE 4ter). Au-dela, on rogne le sujet sans l'avoir voulu.
    tl: (id, d, at, duree) => {
      const fin = (duree ?? 5).toFixed(2);
      let s =
        `      tl.fromTo("#${id}p", { scale: 1.02 }, { scale: 1.07, duration: ${fin}, ease: "none" }, ${at.toFixed(2)});\n`;
      if (d.tag || d.texte) {
        s +=
          `      tl.fromTo("#${id}pc", { opacity: 0, y: 26 },\n` +
          `        { opacity: 1, y: 0, duration: 0.55, ease: E }, ${(at + 0.5).toFixed(2)});\n`;
      }
      return s;
    },
    // La photo remplace le titre : un lede de 94px par-dessus une image
    // clinique la rendrait illisible, et la legende dit deja ce qu'il faut.
    opts: () => ({ lede: false, sub: false, plein: true }),
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
    const petit = (sc.lede || []).join(" ").length > 34 || (sc.lede || []).length === 1;

    let corps = `      <!-- ${deuxChiffres(i + 1)} -->\n`;
    corps += `      <section id="${id}" class="clip scene" data-start="${at}" data-duration="${sc.dureeSec}" data-track-index="5">\n`;
    corps += `        <i id="${id}k" class="rail"></i>\n`;
    corps += `        <em class="kicker"><span class="num">${deuxChiffres(i + 1)}</span>${echappe(sc.kicker)}</em>\n`;
    if (o.lede !== false) {
      corps += `        <strong id="${id}a" class="lede${petit ? " sm" : ""}">`;
      corps += sc.lede.map((l) => `<span class="l"><i>${balise(l)}</i></span>`).join("");
      corps += `</strong>\n`;
    }
    corps += bloc.html(id, d);
    if (o.sub !== false && sc.sub) {
      corps += `        <span id="${id}b" class="sub">${balise(sc.sub)}</span>\n`;
    }
    if (sc.signature) {
      corps += `        <span id="${id}s" class="sig">${echappe(sc.signature)}</span>\n`;
    }
    corps += `      </section>\n`;
    sections += corps + (i < cap.scenes.length - 1 ? "\n" : "");

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
  const audio = m
    ? `\n      <!-- Lit musical. Nom d'origine conserve : renommer masque la provenance\n` +
      `           (decision 014). Licence : ${m.licence || "NON FOURNIE — hors depot"}. -->\n` +
      `      <audio id="bgm" src="${echappe(m.fichier)}"\n` +
      `             data-start="0" data-duration="${duree}" data-track-index="10"\n` +
      `             data-volume="${m.volume ?? 0.68}"></audio>\n`
    : "";
  const audioTl = m
    ? `      tl.fromTo("#bgm", { volume: 0 }, { volume: ${m.volume ?? 0.68}, duration: 2.5, ease: "sine.out" }, 0);\n` +
      `      tl.to("#bgm", { volume: 0, duration: 5, ease: "sine.in" }, ${duree - 5});\n`
    : "";

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
