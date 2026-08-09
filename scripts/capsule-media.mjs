// Prepare les medias VIDEO d'une capsule au format de sortie.
//
//   npm run capsule:media <dossier-projet>
//
// POURQUOI CE SCRIPT EXISTE (incident du 09/08/2026).
//
// Un plan anime arrive en 1176x780 paysage. La video de sortie est en 1080x1920
// vertical. Il faut donc le remettre au format — et c'est la que deux tentatives
// ont echoue :
//
//   1. poser le clip dans la scene et le placer en CSS : HyperFrames possede la
//      lecture des medias et impose son propre placement, un `inset` n'y survit
//      pas. Le clip revenait plein cadre, la mise en page « panneau » perdue ;
//   2. le sortir en clip de premier niveau ET le placer en CSS : meme resultat,
//      pour la meme raison.
//
// Ce qui a marche : ne rien demander au moteur. Le clip arrive DEJA au format
// final, fond compris. HyperFrames n'a plus qu'a le poser plein cadre — ce
// qu'il fait tres bien.
//
// Cette mise au format a d'abord ete faite a la main, en ffmpeg, dans le
// terminal. C'etait le vrai defaut : une etape indispensable que Hermes ne
// pouvait pas reproduire, parce qu'elle n'existait dans aucun script. Elle
// existe ici. Elle tourne AVANT le portail, pour que le portail valide le
// contrat reellement rendu.
//
// Le script est idempotent : un media deja au bon format est laisse tel quel.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, extname, basename } from "node:path";
import { spawnSync } from "node:child_process";
import { charte } from "./charte.mjs";

const projet = process.argv.slice(2).find((a) => !a.startsWith("--"));
if (!projet) {
  console.error("Usage : node scripts/capsule-media.mjs <dossier-projet>");
  process.exit(1);
}
const contrat = join(projet, "capsule.json");
if (!existsSync(contrat)) {
  console.error(`❌ ${contrat} introuvable.`);
  process.exit(1);
}
const cap = JSON.parse(readFileSync(contrat, "utf8").replace(/^﻿/, ""));

const FORMATS = { "16:9": [1920, 1080], "9:16": [1080, 1920], "1:1": [1080, 1080] };
const [W, H] = FORMATS[cap.format] || [];
if (!W) {
  console.error(`❌ Format « ${cap.format} » inconnu (16:9, 9:16, 1:1).`);
  process.exit(1);
}

/* La bande basse de la mise en page « panneau », en fraction de la hauteur.
   Doit rester egale au `inset:0 0 34% 0` de .ph-wrap.panneau dans le socle :
   si les deux divergent, le fond peint par ffmpeg ne tombe plus sous la carte. */
const PANNEAU_BAS = 0.34;

const estVideo = (f) => /\.(mp4|mov|webm)$/i.test(f || "");
const outil = (nom) => spawnSync(nom, ["-version"], { encoding: "utf8" }).status === 0;

if (!outil("ffmpeg") || !outil("ffprobe")) {
  console.error("❌ ffmpeg / ffprobe absents — impossible de preparer les plans video.");
  console.error("   Installer : sudo apt-get install -y ffmpeg");
  process.exit(1);
}

/** Duree d'un media, en secondes, ou null. */
function duree(chemin) {
  const r = spawnSync("ffprobe", [
    "-v", "error", "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1", chemin,
  ], { encoding: "utf8" });
  const d = Number.parseFloat((r.stdout || "").trim());
  return Number.isFinite(d) ? d : null;
}

/** Dimensions du premier flux video, ou null. */
function dimensions(chemin) {
  const r = spawnSync("ffprobe", [
    "-v", "error", "-select_streams", "v:0",
    "-show_entries", "stream=width,height",
    "-of", "csv=p=0:s=x", chemin,
  ], { encoding: "utf8" });
  const m = (r.stdout || "").trim().match(/^(\d+)x(\d+)/);
  return m ? { l: Number(m[1]), h: Number(m[2]) } : null;
}

/**
 * Chaine de filtres ffmpeg pour un cadrage donne.
 *
 * « panneau » : le media occupe la zone haute, le reste est peint au navy de la
 * charte — la carte de legende viendra s'y poser. C'est le cadrage qui a
 * resolu le dilemme entre `cover` (qui rogne le sujet clinique) et `fit` (qui
 * laisse l'image minuscule dans un cadre vertical).
 */
function filtre(cadrage, navy) {
  if (cadrage === "panneau") {
    const zone = H - Math.round(H * PANNEAU_BAS);
    return `scale=${W}:${zone}:force_original_aspect_ratio=increase,` +
           `crop=${W}:${zone},pad=${W}:${H}:0:0:color=${navy}`;
  }
  if (cadrage === "fit") {
    return `scale=${W}:${H}:force_original_aspect_ratio=decrease,` +
           `pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=${navy}`;
  }
  // cover, et defaut : remplir le cadre quitte a rogner les bords.
  return `scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H}`;
}

const navy = charte(cap.charte || "client-01").navy950 || "#060d18";
let prepares = 0;
let inchanges = 0;

for (const sc of cap.scenes || []) {
  const d = sc.bloc?.data;
  if (sc.bloc?.type !== "photo" || !estVideo(d?.fichier)) continue;

  const source = join(projet, d.fichier);
  if (!existsSync(source)) {
    console.error(`❌ Plan video introuvable : ${d.fichier}`);
    process.exit(1);
  }

  const dim = dimensions(source);
  if (dim && dim.l === W && dim.h === H) {
    inchanges++;
    continue; // deja au format : on ne re-encode pas pour rien.
  }

  const cadrage = d.cadrage || "cover";
  const sortie = `${basename(d.fichier, extname(d.fichier))}-${W}x${H}.mp4`;
  const cible = join(projet, sortie);

  console.log(`  ${d.fichier} (${dim ? `${dim.l}x${dim.h}` : "?"}) → ${sortie} [${cadrage}]`);
  const r = spawnSync("ffmpeg", [
    "-y", "-loglevel", "error",
    "-i", source,
    "-vf", filtre(cadrage, navy),
    // -an : le son des plans est ecarte. Les pistes audio de la capsule sont la
    // musique et la voix off, declarees au contrat ; un son de plan qui
    // remonterait par surprise ne serait ni voulu ni valide.
    "-an",
    "-c:v", "libx264", "-preset", "medium", "-crf", "18",
    "-pix_fmt", "yuv420p", "-movflags", "+faststart",
    cible,
  ], { encoding: "utf8" });
  if (r.status !== 0) {
    console.error(`❌ ffmpeg a echoue sur ${d.fichier} :\n${r.stderr}`);
    process.exit(1);
  }
  d.fichier = sortie;
  prepares++;
}

/* La voix off n'est pas retouchee — seulement mesuree. Sans sa duree reelle au
   contrat, le socle lui reserve tout le reste de la video : le moteur ramene
   ensuite le creneau a la longueur du son et le signale a chaque controle
   (clip_media_fit). Mesurer ici evite ce bruit, et rend le contrat lisible :
   on voit combien de temps quelqu'un parle sans ouvrir le fichier. */
let voixMesuree = false;
if (cap.voix?.fichier) {
  const chemin = join(projet, cap.voix.fichier);
  if (!existsSync(chemin)) {
    console.error(`❌ Voix off introuvable : ${cap.voix.fichier}`);
    process.exit(1);
  }
  const d = duree(chemin);
  if (d) {
    const arrondie = Math.round(d * 100) / 100;
    if (cap.voix.dureeSec !== arrondie) {
      cap.voix.dureeSec = arrondie;
      voixMesuree = true;
      console.log(`  voix ${cap.voix.fichier} → ${arrondie}s mesurees`);
    }
  }
}

if (prepares || voixMesuree) {
  writeFileSync(contrat, `${JSON.stringify(cap, null, 2)}\n`, "utf8");
  if (prepares) console.log(`→ ${prepares} plan(s) mis au format ${W}x${H}, contrat mis a jour.`);
  else console.log("→ contrat mis a jour.");
  console.log(`   Etape suivante : npm run portail:capsule -- ${projet}`);
} else {
  console.log(`= aucun media a preparer (${inchanges} plan(s) deja au format ${W}x${H}).`);
}
