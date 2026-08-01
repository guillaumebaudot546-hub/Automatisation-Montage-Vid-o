// Sort les polices du HTML : base64 embarque -> fichiers .woff2 a cote.
//
//   npm run fonts:extract     convertit (idempotent)
//   npm run fonts:check       signale tout base64 restant (exit 2)
//
// POURQUOI. Chaque composition HyperFrames embarquait ses 4 polices en
// base64 : 144 580 octets sur 168 232, soit 86 % du fichier. Le rendu n'en
// tirait aucun benefice, mais l'agent de montage, lui, payait ces octets a
// chaque lecture ou ecriture du fichier — environ 36 000 jetons de blob par
// passage, relus a chaque appel suivant. Mesure du 31/07/2026 : ~0,88 $ par
// passage sur un index.html, dont ~0,76 $ de fonte pure.
//
// POURQUOI CE N'EST PAS UN RETOUR EN ARRIERE. Le commentaire d'origine
// justifiait le base64 par « Chromium headless sur VPS n'a AUCUNE des polices
// Google installees ». C'est exact, et c'est precisement pour ca que les
// .woff2 sont COPIES dans chaque dossier de projet plutot que reference en
// ../../_socle/ : socle-assets.mjs applique deja ce raisonnement au logo
// (« chaque composition est rendue depuis SON dossier »). Aucun acces reseau,
// aucune police systeme requise. Le rendu doit rester identique — le verifier
// visuellement, pas seulement au code de sortie.
//
// IDEMPOTENCE. Un fichier deja converti est laisse intact et signale. Le
// script n'agit jamais deux fois sur la meme cible : c'est la lecon du sed mal
// echappe du 30/07/2026, qui avait reinjecte des @font-face en double.
import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";

const RACINE = "imcp-hyperframes";
const FONTS = join(RACINE, "_socle", "assets", "fonts");
const TEMPLATE = join(RACINE, "_socle", "teaser.template.html");
const verifie = process.argv.includes("--check");

const IGNORES = new Set(["node_modules", "renders", "snapshots", ".hyperframes"]);
const md5 = (buf) => createHash("md5").update(buf).digest("hex");

/** 'JetBrains Mono' + italic -> jetbrains-mono-italic */
const nomFichier = (famille, style) =>
  `${famille.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${style}`;

/**
 * Tous les index.html de compositions, plus le template du socle.
 * Le template n'est pas dans videos/ mais porte le meme bloc @font-face.
 */
function cibles(dir, out = []) {
  for (const nom of readdirSync(dir)) {
    if (IGNORES.has(nom)) continue;
    const p = join(dir, nom);
    if (statSync(p).isDirectory()) cibles(p, out);
    else if (nom === "index.html") out.push(p);
  }
  return out;
}

/**
 * Remplace chaque @font-face base64 par une reference relative, et renvoie
 * les polices decodees. Ne touche pas aux @font-face deja convertis.
 */
function convertir(html) {
  const polices = [];
  const sortie = html.replace(/@font-face\s*\{[^}]*\}/g, (bloc) => {
    const b64 = bloc.match(/url\(data:font\/woff2;base64,([A-Za-z0-9+/=]+)\)/);
    if (!b64) return bloc; // deja converti, ou pas une police embarquee

    const famille = bloc.match(/font-family:\s*['"]([^'"]+)['"]/)?.[1];
    const style = bloc.match(/font-style:\s*([a-z]+)/)?.[1] ?? "normal";
    if (!famille) {
      throw new Error("@font-face avec base64 mais sans font-family — abandon.");
    }

    const fichier = `${nomFichier(famille, style)}.woff2`;
    polices.push({ fichier, donnees: Buffer.from(b64[1], "base64") });
    return bloc.replace(
      /url\(data:font\/woff2;base64,[A-Za-z0-9+/=]+\)/,
      `url(./fonts/${fichier})`,
    );
  });
  return { sortie, polices };
}

const liste = [...(existsSync(TEMPLATE) ? [TEMPLATE] : []), ...cibles(RACINE)];
const restants = [];
let convertis = 0;
let deja = 0;
let octetsRetires = 0;
const ecrites = new Map();

for (const cible of liste) {
  const avant = readFileSync(cible, "utf8");
  const { sortie, polices } = convertir(avant);

  if (polices.length === 0) {
    deja++;
    continue;
  }

  if (verifie) {
    restants.push(`${cible} — ${polices.length} police(s) encore en base64`);
    continue;
  }

  // Les polices sont identiques d'une composition a l'autre : on ecrit une
  // fois, puis on verifie que les suivantes sont bien les memes octets. Une
  // divergence signalerait deux jeux de polices en circulation — a voir avant
  // d'ecraser quoi que ce soit.
  mkdirSync(FONTS, { recursive: true });
  for (const { fichier, donnees } of polices) {
    const chemin = join(FONTS, fichier);
    const empreinte = md5(donnees);
    if (existsSync(chemin)) {
      if (md5(readFileSync(chemin)) !== empreinte) {
        console.error(
          `❌ ${fichier} existe deja avec un contenu DIFFERENT (source : ${cible}).\n` +
            "   Deux jeux de polices coexistent — trancher a la main avant de continuer.",
        );
        process.exit(1);
      }
    } else {
      writeFileSync(chemin, donnees);
      ecrites.set(fichier, donnees.length);
    }
  }

  writeFileSync(cible, sortie);
  const gain = avant.length - sortie.length;
  octetsRetires += gain;
  convertis++;
  console.log(
    `→ ${cible} — ${polices.length} police(s) sorties, ` +
      `${avant.length} → ${sortie.length} octets (−${Math.round((gain / avant.length) * 100)} %)`,
  );
}

if (verifie) {
  // GARDE-FOU CENTRAL — le seul qui compte vraiment.
  //
  // Le 31/07/2026, le journal documente un defaut invisible : les compositions
  // demandaient des polices que le VPS n'avait pas, le rendu retombait sur une
  // generique « silencieusement, sans la moindre erreur », et seul l'oeil du
  // praticien voyait que ce n'etait pas sa charte. Le base64 achetait
  // l'immunite a ce defaut au prix de 142 Ko par fichier.
  //
  // En repassant aux fichiers, on reprend ces 142 Ko — donc on DOIT rendre le
  // defaut bruyant. Une reference ./fonts/x.woff2 qui ne resout pas est un
  // echec bloquant ici, pas un fallback sans-serif decouvert a la livraison.
  for (const cible of liste) {
    // Le template n'est pas une composition : ses ./fonts/ resolvent dans le
    // projet GENERE, pas dans _socle/ (ou les polices vivent sous assets/).
    if (cible === TEMPLATE) continue;
    const html = readFileSync(cible, "utf8");
    const dossier = cible.slice(0, cible.lastIndexOf("/")) || ".";
    for (const ref of new Set(
      [...html.matchAll(/url\(\.\/([^)]+\.woff2?)\)/g)].map((m) => m[1]),
    )) {
      if (!existsSync(join(dossier, ref))) {
        restants.push(
          `${cible} → ./${ref} INTROUVABLE — le rendu tomberait en fallback sans-serif`,
        );
      }
    }
  }

  console.log(`\n${liste.length} fichier(s) inspecte(s), ${deja} deja converti(s).`);
  if (restants.length === 0) {
    console.log("✅ Aucune police en base64, toutes les references resolvent. Vert.");
    process.exit(0);
  }
  for (const r of restants) console.log(`  ${r}`);
  console.log(`\n❌ ${restants.length} probleme(s).`);
  console.log("   Polices encore en base64  → npm run fonts:extract");
  console.log("   Reference introuvable     → npm run socle:sync");
  process.exit(2);
}

if (ecrites.size > 0) {
  console.log(`\nPolices ecrites dans ${FONTS} :`);
  for (const [f, taille] of ecrites) console.log(`  ${f} — ${taille} octets`);
}
console.log(
  `\n${liste.length} fichier(s) : ${convertis} converti(s), ${deja} deja conforme(s).` +
    (octetsRetires > 0 ? ` ${octetsRetires} octets retires du HTML.` : ""),
);
console.log(
  "\n⚠️  Lancer ensuite npm run socle:sync pour copier fonts/ dans chaque projet,\n" +
    "   puis verifier VISUELLEMENT un rendu : une police manquante tombe en\n" +
    "   fallback sans-serif sans provoquer la moindre erreur.",
);
