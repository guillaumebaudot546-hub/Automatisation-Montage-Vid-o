// Socle partage des teasers — RÈGLE 4 de la doctrine appliquee.
//
// Avant : 6 teasers de 144 lignes dont 126 identiques. Changer le chrome
// demandait 6 modifications, ou l'oubli de 5.
// Maintenant : un template (_socle/teaser.template.html) + un fichier de
// donnees par teaser (teaser.json). index.html est GENERE.
//
//   npm run teasers:build    regenere les index.html
//   npm run teasers:check    verifie qu'aucun index.html n'a derive (exit 2)
//
// TROIS FACONS DE MODIFIER UN MONTAGE, de la plus legere a la plus lourde :
//
//  1. Changer le CONTENU d'un teaser (textes des cartes, timings, module,
//     titre de fin, sous-titres) -> editer son teaser.json, puis build.
//     Les autres teasers ne bougent pas.
//
//  2. Changer le LOOK de tous les teasers (CSS, animation, structure)
//     -> editer _socle/teaser.template.html, puis build. Une seule fois,
//     les 6 suivent.
//
//  3. Un teaser doit diverger STRUCTURELLEMENT des autres -> mettre
//     "eject": true dans son teaser.json. Il sort du socle, garde son
//     index.html tel quel, et plus aucun build ne l'ecrase. Reversible :
//     repasser eject a false et relancer build.
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const RACINE = "imcp-hyperframes/videos";
const TEMPLATE = "imcp-hyperframes/_socle/teaser.template.html";
const verifieSeulement = process.argv.includes("--check");

/**
 * Les cartes sont un NOMBRE VARIABLE : le premier socle en figeait trois, ce
 * qui excluait d'office tout teaser qui n'en a pas exactement trois.
 */
const blocCartes = (cartes, nl) =>
  cartes
    .map(
      (c, i) =>
        `      <div id="k${i + 1}" class="slot clip" data-start="${c.at}" data-duration="${c.dur}" data-track-index="3">${nl}` +
        `        <div class="wrap"><div class="glow" data-layout-allow-overflow></div>${nl}` +
        `          <div class="card">${c.contenu}<div class="sweep" data-layout-allow-overflow></div></div>${nl}` +
        `        </div>${nl}` +
        `      </div>`,
    )
    .join(nl);

const rend = (template, d) => {
  let h = template;
  // Le depot est en CRLF sur Windows : generer en LF casserait l'identite
  // octet pour octet avec les fichiers livres. On suit le template.
  const nl = template.includes("\r\n") ? "\r\n" : "\n";
  h = h.split("{{CARTES}}").join(blocCartes(d.cartes, nl));
  h = h.split("{{ROOT_DUR}}").join(d.rootDur);
  h = h.split("{{CUES}}").join(d.cues);
  h = h.split("{{K}}").join(d.k);
  h = h.split("{{MODULE}}").join(d.module);
  h = h.split("{{END_TITLE}}").join(d.endTitle);
  // La carte de fin peut chevaucher la video (elle demarre avant VID).
  h = h.split("{{END_AT}}").join(d.endAt ?? d.vid);
  // Animation propre a un teaser, sans le sortir du socle. Ligne entiere
  // supprimee quand il n'y en a pas, pour ne pas laisser de ligne vide.
  h = d.extras
    ? h.replace(/^[ \t]*\{\{EXTRAS\}\}$/m, d.extras)
    : h.replace(/^[ \t]*\{\{EXTRAS\}\}\r?\n/m, "");
  // VID en dernier : il apparait dans presque tous les data-duration.
  return h.split("{{VID}}").join(d.vid);
};

if (!existsSync(TEMPLATE)) {
  console.error(`❌ Template introuvable : ${TEMPLATE}`);
  process.exit(1);
}
const template = readFileSync(TEMPLATE, "utf8");

const projets = readdirSync(RACINE).filter((d) =>
  existsSync(join(RACINE, d, "teaser.json")),
);

if (projets.length === 0) {
  console.log("Aucun teaser rattache au socle (aucun teaser.json trouve).");
  process.exit(0);
}

let derives = 0;
let ecrits = 0;
let ejectes = 0;

for (const projet of projets) {
  const donnees = JSON.parse(
    readFileSync(join(RACINE, projet, "teaser.json"), "utf8").replace(/^﻿/, ""),
  );
  const cible = join(RACINE, projet, "index.html");

  if (donnees.eject) {
    console.log(`⊘ ${projet} — ejecte du socle, laisse intact`);
    ejectes++;
    continue;
  }

  const attendu = rend(template, donnees);
  const actuel = existsSync(cible) ? readFileSync(cible, "utf8") : null;

  if (actuel === attendu) {
    console.log(`= ${projet} — conforme au socle`);
    continue;
  }

  if (verifieSeulement) {
    console.log(
      `≠ ${projet} — index.html a derive du socle` +
        (actuel === null ? " (absent)" : ""),
    );
    derives++;
  } else {
    writeFileSync(cible, attendu);
    console.log(`→ ${projet} — regenere`);
    ecrits++;
  }
}

console.log(
  `\n${projets.length} teaser(s) : ${ejectes} ejecte(s), ` +
    (verifieSeulement ? `${derives} derive(s).` : `${ecrits} regenere(s).`),
);

if (verifieSeulement && derives > 0) {
  console.log(
    "\n❌ Un index.html a ete edite a la main alors qu'il est genere.\n" +
      "   Soit reporter le changement dans teaser.json ou dans le template,\n" +
      "   puis npm run teasers:build.\n" +
      "   Soit assumer la divergence : \"eject\": true dans son teaser.json.",
  );
  process.exit(2);
}
