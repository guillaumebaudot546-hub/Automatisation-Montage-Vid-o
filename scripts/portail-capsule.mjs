// Portail doctrine des capsules generees depuis un prompt (decision 017).
//
//   npm run portail:capsule -- <dossier-projet>
//   Sortie 0 = passe · 3 = rejet · 1 = erreur d'usage.
//
// POURQUOI UN SECOND PORTAIL.
// portail-doctrine.mjs juge un plan de montage issu d'un RUSH : coupes aux
// frontieres de phrases, couverture des sous-titres, format. Une capsule
// generee depuis un prompt n'a ni rush, ni transcription, ni spans — ces
// controles n'ont aucune prise sur elle. Jusqu'au 02/08/2026 elle passait donc
// SANS AUCUN garde-fou (guard-portail laisse passer ce qui n'a pas de plan).
//
// Ce portail juge ce qui casse reellement une capsule MUETTE :
//   1. du texte qu'on n'a pas le temps de lire — la faute n°1 ;
//   2. un titre qui deborde du cadre ;
//   3. une piste musicale sans preuve de licence — regle non negociable ;
//   4. une charte qui n'existe pas ;
//   5. un format incoherent avec le reseau vise (REGLE 5bis).
import { readFileSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { ecrireRecu } from "./guard-portail.mjs";

/* Racine deduite de l'emplacement du script, pas du dossier de travail. */
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const projet = process.argv.slice(2).find((a) => !a.startsWith("--"));
if (!projet) {
  console.error("Usage : node scripts/portail-capsule.mjs <dossier-projet>");
  process.exit(1);
}
const chemin = join(projet, "capsule.json");
if (!existsSync(chemin)) {
  console.error(`❌ ${chemin} introuvable.`);
  process.exit(1);
}
const cap = JSON.parse(readFileSync(chemin, "utf8").replace(/^﻿/, ""));

/* --- Seuils ---------------------------------------------------------------
 * Vitesse de lecture a l'ecran, mots/seconde. Un lecteur francais lit ~3,5
 * mots/s en silencieux ; sur une video il partage son attention avec le
 * mouvement et les graphiques. On rejette au-dela de 4,5 (physiquement
 * intenable) et on avertit au-dela de 3,2 (tenable mais sans marge).
 */
const S = {
  motsParSecRejet: 4.5,
  motsParSecAvertit: 3.2,
  ledeMaxCar: 62,
  kickerMaxCar: 44,
  dureeSceneMinSec: 4,
  dureeTotaleMaxSec: 420,
  scenesMax: 24,
};
const FORMAT_ATTENDU = {
  reels: "9:16", instagram: "9:16", tiktok: "9:16", shorts: "9:16",
  youtube: "16:9", site: "16:9", linkedin: "16:9", feed: "1:1",
};
const BLOCS = ["rule", "duo-profils", "marqueurs", "jauge", "etapes-score",
  "comparatif", "manifeste", "photo", "aucun"];
/** Retard avant l'apparition du sous-titre, par type de bloc (voir le builder). */
const ENTREE = {
  rule: 1.5, "duo-profils": 2.8, marqueurs: 2.9, jauge: 3.1,
  "etapes-score": 3.6, comparatif: 2.9, manifeste: 3.2, aucun: 1.5,
  // La photo n'a pas de sous-titre separe : sa legende est dans le bloc.
  photo: 0,
};

/**
 * Dimensions d'une image, lues dans son en-tete. JPEG et PNG suffisent : ce
 * sont les deux formats qui arrivent par Telegram.
 *
 * Sans cette lecture, le portail ne peut pas juger un cadrage — il ne sait pas
 * si la source est paysage. Le 09/08/2026, neuf photos en 1120x702 ont ete
 * montees en « cover » vers du 9:16 : le sujet clinique s'est retrouve rogne
 * hors cadre, avec une bande noire en bas. La RÈGLE 3 imposait « fit ».
 *
 * Rend null si le format n'est pas reconnu — on n'invente pas une dimension.
 */
function dimensions(chemin) {
  let b;
  try {
    b = readFileSync(chemin);
  } catch {
    return null;
  }
  // PNG : la largeur et la hauteur vivent dans le bloc IHDR, a offset fixe.
  if (b.length > 24 && b[0] === 0x89 && b[1] === 0x50) {
    return { l: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  }
  // JPEG : il faut parcourir les segments jusqu'au marqueur SOF.
  if (b.length > 4 && b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i < b.length - 9) {
      if (b[i] !== 0xff) { i++; continue; }
      const m = b[i + 1];
      // SOF0..SOF15, en excluant DHT (c4), JPG (c8) et DAC (cc).
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) {
        return { h: b.readUInt16BE(i + 5), l: b.readUInt16BE(i + 7) };
      }
      i += 2 + b.readUInt16BE(i + 2);
    }
  }
  return null;
}

/** Le cadrage qu'impose la RÈGLE 3, d'apres la source et la cible. */
function cadrageAttendu(dim, format) {
  if (!dim) return null;
  // « panneau » reserve les deux tiers hauts au media et le tiers bas a la
  // carte : il remplit sans rogner le sujet, quelles que soient les
  // proportions. Rien a imposer.
  if (format === "panneau") return null;
  const sourcePaysage = dim.l > dim.h;
  const cibleVerticale = format === "9:16";
  // Paysage vers vertical : « cover » rogne l'essentiel de la hauteur.
  if (sourcePaysage && cibleVerticale) return "fit";
  // Portrait vers horizontal : meme probleme, dans l'autre sens.
  if (!sourcePaysage && format === "16:9") return "fit";
  return null; // proportions compatibles : « cover » remplit sans sacrifier.
}

const violations = [];
const rejet = (r, m) => violations.push({ r, g: "rejet", m });
const avertit = (r, m) => violations.push({ r, g: "avertissement", m });
const mots = (s) => String(s || "").trim().split(/\s+/).filter(Boolean).length;
/** Le balisage **mot** / *mot* ne se lit pas : on le retire avant de compter. */
const net = (s) => String(s || "").replace(/\*+/g, "");

/* --- 1. Charte ------------------------------------------------------------ */
const nomCharte = cap.charte || "client-01";
if (!existsSync(join(ROOT, "src", "theme", `${nomCharte}.ts`))) {
  rejet("charte", `Charte « ${nomCharte} » introuvable (src/theme/${nomCharte}.ts). Un praticien = un theme.`);
}

/* --- 2. Musique : licence obligatoire ------------------------------------- */
if (cap.musique) {
  if (!cap.musique.licence) {
    rejet(
      "musique",
      `« ${cap.musique.fichier} » n'a pas de licence renseignee. Toute piste autre que ` +
        "le defaut synthetise exige une preuve — un nom de fichier ne prouve rien " +
        "(decision 014, incident Saint-Preux).",
    );
  }
  const f = join(projet, cap.musique.fichier || "");
  if (cap.musique.fichier && !existsSync(f)) {
    rejet("musique", `Piste absente du projet : ${cap.musique.fichier}`);
  } else if (cap.musique.fichier) {
    /* Le catalogue fait foi, pas le nom du fichier. Le 09/08/2026,
       « concerto.mp3 » s'est revele etre l'enregistrement Saint-Preux sous
       SACEM, renomme. On compare donc l'EMPREINTE de la piste du projet a
       celles des pistes interdites : un renommage ne trompe pas une empreinte. */
    try {
      const catalogue = JSON.parse(
        readFileSync(join(ROOT, "musique", "CATALOGUE.json"), "utf8").replace(/^﻿/, ""),
      );
      const e = createHash("md5").update(readFileSync(f)).digest("hex").slice(0, 16);
      const interdite = (catalogue.pistes || []).find(
        (p) => p.statut === "interdit" && p.empreinte === e,
      );
      if (interdite) {
        rejet(
          "musique",
          `« ${cap.musique.fichier} » est en realite « ${interdite.id} » (empreinte ${e}) : ` +
            `${interdite.licence.split(".")[0]}. Le renommer ne change rien aux droits.`,
        );
      }
    } catch {
      /* Pas de catalogue lisible : on ne bloque pas la production pour ca.
         La licence declaree reste exigee juste au-dessus. */
    }
  }
}

/* --- 2bis. Voix off : le fichier doit exister, la langue doit etre dite ----
 * Une voix absente ne se voit qu'au rendu — six minutes pour decouvrir une
 * video muette. Et une langue non declaree, c'est la version anglaise qui part
 * avec les textes francais a l'ecran : le defaut le plus couteux a rattraper,
 * puisqu'il ne se voit qu'a la relecture par le praticien. */
if (cap.voix) {
  if (!cap.voix.fichier) {
    rejet("voix", "Bloc « voix » sans « fichier ».");
  } else if (!existsSync(join(projet, cap.voix.fichier))) {
    rejet("voix", `Voix off absente du projet : ${cap.voix.fichier}`);
  }
  if (!cap.voix.langue) {
    rejet(
      "voix",
      "Voix off sans « langue ». Elle doit etre declaree (fr, en, ...) : c'est " +
        "ce qui permet de verifier que les textes a l'ecran sont dans la meme " +
        "langue que le propos.",
    );
  } else if (!/^fr/i.test(cap.voix.langue)) {
    /* Mots-outils francais : ils n'apparaissent pas dans un texte anglais, la
       detection ne se trompe donc quasiment jamais. On ne juge PAS la qualite
       de la traduction — seulement qu'on n'a pas oublie de traduire l'ecran
       apres avoir change la langue de la voix. */
    const OUTILS = /\b(le|la|les|des|une|un|avec|pour|dans|par|sur|est|sont|du|aux?|ses|son|cette|nos|notre)\b/i;
    const ecran = (cap.scenes || []).flatMap((sc) => [
      ...(sc.lede || []), sc.sub || "", sc.kicker || "",
      sc.bloc?.data?.tag || "", sc.bloc?.data?.texte || "",
    ]);
    const fautifs = [...ecran, ...(cap.voix.sousTitres || []).map((c) => c.t)]
      .filter((t) => OUTILS.test(net(t)));
    if (fautifs.length) {
      rejet(
        "langue",
        `Voix declaree « ${cap.voix.langue} » mais ${fautifs.length} texte(s) a ` +
          `l'ecran sont restes en francais — ex. « ${net(fautifs[0])} ». ` +
          "Le spectateur entendrait une langue et en lirait une autre.",
      );
    }
  }

  /* Sous-titres : ils doivent tenir DANS la voix et etre lisibles.
     Un repere pose hors de la voix affiche un texte que personne n'entend ;
     un repere trop court passe avant d'avoir ete lu. La majorite des vues se
     font sans le son : un sous-titre rate coute plus qu'une image ratee. */
  // Duree totale recalculee ici : la constante `duree` du fichier n'est definie
  // que plus bas, et l'utiliser avant sa declaration ferait planter le portail.
  const dureeVideo = (cap.scenes || []).reduce((a, s) => a + (s.dureeSec || 0), 0);
  for (const [j, c] of (cap.voix.sousTitres || []).entries()) {
    const n = j + 1;
    if (typeof c.s !== "number" || typeof c.e !== "number" || !c.t) {
      rejet("sous-titre", `Sous-titre ${n} : il faut « s », « e » et « t ».`);
      continue;
    }
    if (c.e <= c.s) {
      rejet("sous-titre", `Sous-titre ${n} : fin (${c.e}s) avant ou egale au debut (${c.s}s).`);
      continue;
    }
    const debut = (cap.voix.debutSec ?? 0) + c.s;
    const fin = (cap.voix.debutSec ?? 0) + c.e;
    if (fin > dureeVideo + 0.5) {
      rejet(
        "sous-titre",
        `Sous-titre ${n} : se termine a ${fin.toFixed(1)}s alors que la video ` +
          `dure ${dureeVideo}s — il serait coupe.`,
      );
    }
    if (cap.voix.dureeSec && c.e > cap.voix.dureeSec + 0.5) {
      rejet(
        "sous-titre",
        `Sous-titre ${n} : cale a ${c.e.toFixed(1)}s alors que la voix ne dure ` +
          `que ${cap.voix.dureeSec}s — il s'afficherait sur du silence.`,
      );
    }
    const vitesse = mots(c.t) / (c.e - c.s);
    if (vitesse > S.motsParSecRejet) {
      rejet(
        "sous-titre",
        `Sous-titre ${n} : ${mots(c.t)} mots en ${(c.e - c.s).toFixed(1)}s = ` +
          `${vitesse.toFixed(1)} mots/s — illisible (max ${S.motsParSecRejet}).`,
      );
    }
  }
}

/* --- 3. Format vs reseau (REGLE 5bis) ------------------------------------- */
if (!["16:9", "9:16", "1:1"].includes(cap.format)) {
  rejet("format", `Format « ${cap.format} » hors doctrine (16:9, 9:16, 1:1).`);
}
if (cap.reseau) {
  const cle = Object.keys(FORMAT_ATTENDU).find((k) => cap.reseau.toLowerCase().includes(k));
  if (cle && cap.format !== FORMAT_ATTENDU[cle]) {
    rejet("format", `Format ${cap.format} pour « ${cap.reseau} » : ${FORMAT_ATTENDU[cle]} attendu.`);
  }
}

/* --- 4. Structure --------------------------------------------------------- */
const scenes = cap.scenes || [];
if (scenes.length === 0) rejet("structure", "Aucune scene.");
if (scenes.length > S.scenesMax) rejet("structure", `${scenes.length} scenes (max ${S.scenesMax}).`);
if (!cap.pied) avertit("structure", "Aucun pied de page : la capsule ne porte aucune attribution.");

const duree = scenes.reduce((a, s) => a + (s.dureeSec || 0), 0);
if (duree > S.dureeTotaleMaxSec) {
  avertit("duree", `${Math.round(duree)} s au total (${(duree / 60).toFixed(1)} min) — au-dela de ${S.dureeTotaleMaxSec / 60} min sans voix, l'attention decroche.`);
}

/* --- 5. Scene par scene : lisibilite, debordement, vocabulaire ------------- */
scenes.forEach((sc, i) => {
  const n = i + 1;
  const type = sc.bloc?.type || "aucun";

  if (!BLOCS.includes(type)) {
    rejet("bloc", `Scene ${n} : bloc « ${type} » hors vocabulaire (${BLOCS.join(", ")}).`);
    return;
  }
  if (!sc.dureeSec || sc.dureeSec < S.dureeSceneMinSec) {
    rejet("duree", `Scene ${n} : ${sc.dureeSec || 0} s (minimum ${S.dureeSceneMinSec} s).`);
  }

  /* Photo : un fichier absent ne se voit qu'au rendu, sous la forme d'un cadre
     vide — six minutes de machine pour decouvrir une faute de frappe. Et un
     cadrage non declare laisse le builder choisir « cover » : sur un plan large
     ou une slide, il rognerait le sujet (RÈGLE 3). */
  if (type === "photo") {
    const d = sc.bloc?.data || {};
    if (!d.fichier) {
      rejet("photo", `Scene ${n} : bloc photo sans « fichier ».`);
    } else if (!existsSync(join(projet, d.fichier))) {
      rejet("photo", `Scene ${n} : image introuvable — ${d.fichier}`);
    }
    if (d.cadrage && !["cover", "fit", "panneau"].includes(d.cadrage)) {
      rejet("photo", `Scene ${n} : cadrage « ${d.cadrage} » inconnu (cover, fit ou panneau). Etirer l'image est interdit — RÈGLE 5bis.`);
    } else if (d.fichier && !/\.(mp4|mov|webm)$/i.test(d.fichier)) {
      // Le cadrage ne se devine pas : il se deduit des proportions. On compare
      // ce que l'agent a declare a ce que la RÈGLE 3 impose pour CETTE image.
      const dim = dimensions(join(projet, d.fichier));
      const attendu = cadrageAttendu(dim, cap.format);
      const choisi = d.cadrage || "cover";
      // « panneau » est toujours acceptable : il ne sacrifie ni le sujet ni le
      // remplissage du cadre.
      if (attendu && choisi !== attendu && choisi !== "panneau") {
        rejet(
          "cadrage",
          `Scene ${n} : ${d.fichier} fait ${dim.l}x${dim.h} ` +
            `(${dim.l > dim.h ? "paysage" : "portrait"}) pour une cible ${cap.format} — ` +
            `cadrage « ${attendu} » attendu, « ${choisi} » declare. ` +
            `En « ${choisi} », le sujet sort du cadre (RÈGLE 3).`,
        );
      }
    }
    if (!d.tag && !d.texte) {
      avertit("photo", `Scene ${n} : photo sans legende — le spectateur ne saura pas ce qu'il regarde.`);
    }
  }
  if (mots(sc.kicker) && net(sc.kicker).length > S.kickerMaxCar) {
    avertit("debordement", `Scene ${n} : sur-titre de ${net(sc.kicker).length} caracteres (max ${S.kickerMaxCar}) — il est en majuscules interlettrees, il deborde.`);
  }
  for (const l of sc.lede || []) {
    if (net(l).length > S.ledeMaxCar) {
      rejet("debordement", `Scene ${n} : ligne de titre de ${net(l).length} caracteres (max ${S.ledeMaxCar}) — elle passera a la ligne et cassera le masque d'animation.`);
    }
  }

  /* Lisibilite : tout le texte visible doit tenir dans le temps restant
     APRES l'animation d'entree. C'est le controle central d'une video muette. */
  const total =
    (sc.lede || []).reduce((a, l) => a + mots(net(l)), 0) +
    mots(net(sc.sub)) +
    blocMots(sc.bloc);
  const dispo = (sc.dureeSec || 0) - (ENTREE[type] ?? 1.5);
  if (dispo <= 0) {
    rejet("lisibilite", `Scene ${n} : l'animation d'entree (${ENTREE[type]} s) occupe toute la scene.`);
    return;
  }
  const vitesse = total / dispo;
  if (vitesse > S.motsParSecRejet) {
    rejet("lisibilite", `Scene ${n} : ${total} mots en ${dispo.toFixed(1)} s utiles = ${vitesse.toFixed(1)} mots/s. Illisible (plafond ${S.motsParSecRejet}). Rallonger la scene ou couper du texte.`);
  } else if (vitesse > S.motsParSecAvertit) {
    avertit("lisibilite", `Scene ${n} : ${total} mots en ${dispo.toFixed(1)} s = ${vitesse.toFixed(1)} mots/s — lisible mais sans marge (confort ≤ ${S.motsParSecAvertit}).`);
  }
});

/** Mots portes par le bloc lui-meme : ils se lisent aussi. */
function blocMots(b) {
  if (!b || !b.data) return 0;
  const d = b.data;
  switch (b.type) {
    case "duo-profils": return mots(net(d.gauche?.texte)) + mots(net(d.droite?.texte)) + 4;
    case "marqueurs": return (d.length || 0);
    case "jauge": return (d.zones || []).length;
    case "etapes-score": return (d.etapes || []).reduce((a, e) => a + mots(e.titre) + mots(e.texte), 0) + mots(d.score?.libelle);
    case "comparatif": return mots(net(d.gauche?.note)) + mots(net(d.droite?.note)) + 4;
    case "manifeste": return (d.lignes || []).reduce((a, l) => a + mots(l), 0);
    default: return 0;
  }
}

/* --- Verdict -------------------------------------------------------------- */
const rejets = violations.filter((v) => v.g === "rejet");
console.log(`Portail capsule — ${cap.pied || projet}`);
console.log(`  ${scenes.length} scenes · ${Math.round(duree)} s · ${cap.format} · charte ${nomCharte}\n`);

for (const v of violations) {
  console.log(`${v.g === "rejet" ? "❌ REJET" : "⚠️  note "}  [${v.r}] ${v.m}`);
}
if (rejets.length > 0) {
  console.log(`\n${rejets.length} rejet(s). Corriger capsule.json — plafond 3 essais (decision 006).`);
  process.exit(3);
}
if (violations.length === 0) console.log("✅ Aucune violation.");
else console.log("\n✅ Passe malgre les avertissements ci-dessus.");

const recu = ecrireRecu(chemin);
console.log(`   recu ecrit — empreinte ${recu.empreinte.slice(0, 12)}…`);
process.exit(0);
