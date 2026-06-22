import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { Background } from "./components/Background";
import { SfxLayer } from "./components/Sfx";
import { FilmBurn } from "./components/FilmBurn";
import { TIMINGS } from "./lib/timing";
import { Hook } from "./scenes/Hook";
import { Presentation } from "./scenes/Presentation";
import { ChaptersIntro } from "./scenes/ChaptersIntro";
import { Chapter, type ChapterProps } from "./scenes/Chapter";
import { Community } from "./scenes/Community";
import { CTA } from "./scenes/CTA";
import { Outro } from "./scenes/Outro";

const CHAPTERS: ChapterProps[] = [
  {
    number: "01",
    kicker: "Parodontologie",
    title: "Un protocole innovant au",
    highlight: "laser Erbium-Yag",
    bullets: [
      "Aides optiques et protocoles inédits dévoilés",
      "Sans seuils douloureux pour vos patients",
    ],
    data: {
      kind: "bars",
      stat: {
        eyebrow: "DONNÉE CLINIQUE",
        value: "90 %",
        caption: "de vos patients pris en charge efficacement",
      },
      bars: {
        caption: "Patients traités efficacement",
        items: [
          { label: "Protocole classique", value: 30 },
          { label: "Protocole IMCP", value: 90, highlight: true },
        ],
      },
      side: { value: "3×", label: "Plus rapide" },
    },
    media: { type: "3d", model: "laser" },
    transition: "slideRight",
  },
  {
    number: "02",
    kicker: "Chirurgie",
    title: "Microchirurgie",
    highlight: "mini-invasive",
    bullets: [
      "Tissus mous & durs : préparation parodontale et péri-implantaire",
      "Les clés pour réussir vos chirurgies en confiance",
    ],
    data: {
      kind: "curve",
      stat: {
        eyebrow: "MAÎTRISE CLINIQUE",
        value: "Mini.",
        caption: "techniques mini-invasives modernes",
      },
      curve: {
        caption: "Confiance dans le geste",
        xLeft: "Sans IMCP",
        xRight: "Avec IMCP",
      },
    },
    media: { type: "still", src: "photo-laser.jpg", caption: "Aides optiques" },
    transition: "fade",
  },
  {
    number: "03",
    kicker: "Implantologie",
    title: "Implantologie moderne",
    highlight: "& zircone",
    bullets: [
      "Biologie et ingénierie tissulaire au service de la pratique",
      "Enseignement pragmatique, étapes franchies dès la première session",
    ],
    data: {
      kind: "chips",
      stat: {
        eyebrow: "MATÉRIAUX & BIOLOGIE",
        value: "Zr",
        caption: "zircone, biologie tissulaire, ingénierie",
      },
      chips: {
        caption: "Atouts cliniques",
        items: [
          { label: "Biocompatible", sub: "Tissus apaisés" },
          { label: "Esthétique", sub: "Aucun halo gris" },
          { label: "Pérenne", sub: "Résistance long terme" },
        ],
      },
    },
    media: { type: "3d", model: "implant", cameraZ: 7 },
    transition: "slideLeft",
  },
];

// Pré-mount chaque scène 30 frames (0.5s) avant son entrée pour éliminer
// le frame-skip de chargement aux transitions.
const PREMOUNT = 30;

// Frontières de scènes pour les flashs cyan (timeline 86s)
const BOUNDARIES = [600, 1441, 1712, 2836, 3684, 4561, 5160, 5642];

export const MyComposition = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#060D18" }}>
      <Background />

      {/* Voix off : rythme naturel (atempo 1.3) */}
      <Audio src={staticFile("voiceover-natural-v3.wav")} />

      <Sequence from={TIMINGS.hook.from} durationInFrames={TIMINGS.hook.duration} premountFor={PREMOUNT}>
        <Hook />
      </Sequence>

      <Sequence from={TIMINGS.presentation.from} durationInFrames={TIMINGS.presentation.duration} premountFor={PREMOUNT}>
        <Presentation />
      </Sequence>

      <Sequence from={TIMINGS.chaptersIntro.from} durationInFrames={TIMINGS.chaptersIntro.duration} premountFor={PREMOUNT}>
        <ChaptersIntro />
      </Sequence>

      <Sequence from={TIMINGS.chapter1.from} durationInFrames={TIMINGS.chapter1.duration} premountFor={PREMOUNT}>
        <Chapter {...CHAPTERS[0]} />
      </Sequence>

      <Sequence from={TIMINGS.chapter2.from} durationInFrames={TIMINGS.chapter2.duration} premountFor={PREMOUNT}>
        <Chapter {...CHAPTERS[1]} />
      </Sequence>

      <Sequence from={TIMINGS.chapter3.from} durationInFrames={TIMINGS.chapter3.duration} premountFor={PREMOUNT}>
        <Chapter {...CHAPTERS[2]} />
      </Sequence>

      <Sequence from={TIMINGS.community.from} durationInFrames={TIMINGS.community.duration} premountFor={PREMOUNT}>
        <Community />
      </Sequence>

      <Sequence from={TIMINGS.cta.from} durationInFrames={TIMINGS.cta.duration} premountFor={PREMOUNT}>
        <CTA />
      </Sequence>

      <Sequence from={TIMINGS.outro.from} durationInFrames={TIMINGS.outro.duration} premountFor={PREMOUNT}>
        <Outro />
      </Sequence>

      {/* Flash cyan (CSS pur, zero lag) à chaque transition */}
      {BOUNDARIES.map((b, i) => (
        <Sequence key={b} from={Math.max(0, b - 8)} durationInFrames={32}>
          <FilmBurn variant={i % 2 === 0 ? 1 : 2} />
        </Sequence>
      ))}

      <SfxLayer />
    </AbsoluteFill>
  );
};
