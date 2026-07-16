import {
  AbsoluteFill,
  Audio,
  Loop,
  OffthreadVideo,
  Sequence,
  staticFile,
  useCurrentFrame,
  interpolate,
} from "remotion";
import { z } from "zod";
import { FilmBurn } from "../components/FilmBurn";
import { TitleCard, LowerThird, Watermark, EndCredits } from "./BaudotChrome";

/**
 * ClinicalWrap — template vidéo Dr Baudot (DA landing page, cf. TEMPLATE.md).
 * Structure : sting logo (4,5 s) → carton-titre (3,5 s) → contenu intégral
 * (Ken Burns léger + watermark + lower-third) → générique (6 s).
 * Audio : musique de fond mixée (fondus, ducking sous piste source),
 * riser sur le carton, swooshs aux frontières.
 */

export const FPS = 30;
const INTRO = 135;  // sting logo — entrée à 5,5 s dans le fichier source
const TITLE = 105;  // carton-titre
const OUTRO = 180;  // générique de fin (6 s)
const MUSIC_LOOP = 4.066 * 60 * FPS; // Concerto ≈ 4:04 — boucle si vidéo plus longue

export const wrapDuration = (contentFrames: number) =>
  INTRO + TITLE + contentFrames + OUTRO;

/**
 * Schéma des props — rend chaque réglage ÉDITABLE dans le panneau droit
 * du Studio Remotion (sliders/champs, aperçu temps réel, « Save defaults »).
 */
export const clinicalSchema = z.object({
  src: z.string().describe("Fichier vidéo dans public/"),
  contentFrames: z.number().int().min(1).describe("Durée source en frames @30fps"),
  eyebrow: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  hasAudio: z.boolean().optional().describe("Garder la piste audio de la source"),
  musicSrc: z.string().optional().describe("Musique de fond (public/)"),
  // --- Réglages audio manuels (Studio) ---
  musicDelaySec: z.number().min(0).max(60).step(0.5).optional()
    .describe("Déclenchement de la musique (s après le début)"),
  musicOffsetSec: z.number().min(0).max(240).step(0.5).optional()
    .describe("Point de départ DANS le morceau (s)"),
  musicChromeVol: z.number().min(0).max(1).step(0.01).optional()
    .describe("Volume musique — habillage (intro/titre/générique)"),
  musicBedVol: z.number().min(0).max(1).step(0.01).optional()
    .describe("Volume musique — pendant le geste"),
  musicDuckVol: z.number().min(0).max(1).step(0.01).optional()
    .describe("Volume musique — si la source a du son (ducking)"),
  fadeInSec: z.number().min(0).max(10).step(0.1).optional(),
  fadeOutSec: z.number().min(0).max(10).step(0.1).optional(),
  sfxVol: z.number().min(0).max(1).step(0.01).optional()
    .describe("Volume des SFX (riser/swoosh)"),
  sourceVol: z.number().min(0).max(2).step(0.05).optional()
    .describe("Volume de la piste source (si hasAudio)"),
});

export type ClinicalWrapProps = z.infer<typeof clinicalSchema> &
  Record<string, unknown>;

export const ClinicalWrap: React.FC<ClinicalWrapProps> = ({
  src,
  contentFrames,
  eyebrow,
  title,
  subtitle,
  hasAudio,
  musicSrc = "music/concerto.mp3",
  musicDelaySec = 0,
  musicOffsetSec = 0,
  musicChromeVol = 0.26,
  musicBedVol = 0.12,
  musicDuckVol = 0.05,
  fadeInSec = 1.0,
  fadeOutSec = 0.8,
  sfxVol = 0.14,
  sourceVol = 1.0,
}) => {
  const contentFrom = INTRO + TITLE;
  const outroFrom = contentFrom + contentFrames;
  const total = outroFrom + OUTRO;
  const frame = useCurrentFrame();
  const musicFrom = Math.round(musicDelaySec * FPS);
  const musicTrim = Math.round(musicOffsetSec * FPS);

  // Fondu du contenu
  const contentFade = Math.min(
    interpolate(frame, [contentFrom, contentFrom + 20], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
    interpolate(frame, [outroFrom - 20, outroFrom], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  // Ken Burns léger sur le contenu (push-in 1.0 → 1.035, retenu — PRD §2.1)
  const kb = interpolate(frame, [contentFrom, outroFrom], [1.0, 1.035], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Musique : portée sur l'habillage, discrète sous le geste, duckée si la
  // source a sa propre piste. Tous les niveaux/temps = props Studio.
  const bedLevel = hasAudio ? musicDuckVol : musicBedVol;
  const fadeIn = Math.max(1, Math.round(fadeInSec * FPS));
  const fadeOut = Math.max(1, Math.round(fadeOutSec * FPS));
  const musicVol = interpolate(
    frame,
    [
      musicFrom,
      musicFrom + fadeIn,
      contentFrom - 20,
      contentFrom + 90,
      outroFrom - 60,
      outroFrom,
      total - fadeOut,
      total,
    ],
    [0, musicChromeVol, musicChromeVol, bedLevel, bedLevel, musicChromeVol, musicChromeVol, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "#0A1A2F" }}>
      {/* Sting logo */}
      <Sequence from={0} durationInFrames={INTRO} premountFor={30}>
        <AbsoluteFill style={{ backgroundColor: "#000" }}>
          <OffthreadVideo
            src={staticFile("intro-imcp.mp4")}
            trimBefore={165}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </AbsoluteFill>
      </Sequence>

      {/* Carton-titre */}
      <Sequence from={INTRO} durationInFrames={TITLE} premountFor={30}>
        <TitleCard eyebrow={eyebrow} title={title} subtitle={subtitle} />
      </Sequence>

      {/* Contenu clinique intégral */}
      <Sequence from={contentFrom} durationInFrames={contentFrames} premountFor={45}>
        <AbsoluteFill style={{ opacity: contentFade, backgroundColor: "#000", overflow: "hidden" }}>
          <AbsoluteFill style={{ transform: `scale(${kb})` }}>
            <OffthreadVideo
              src={staticFile(src)}
              muted={!hasAudio}
              volume={sourceVol}
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          </AbsoluteFill>
          <Watermark />
          <LowerThird title={title} />
        </AbsoluteFill>
      </Sequence>

      {/* Générique de fin */}
      <Sequence from={outroFrom} durationInFrames={OUTRO} premountFor={30}>
        <EndCredits />
      </Sequence>

      {/* Flashs cyan → remplacés par fondus champagne discrets (FilmBurn) */}
      {[INTRO, contentFrom, outroFrom].map((b, i) => (
        <Sequence key={b} from={b - 4} durationInFrames={16}>
          <FilmBurn variant={i % 2 === 0 ? 1 : 2} />
        </Sequence>
      ))}

      {/* SFX */}
      <Sequence from={Math.max(0, INTRO - 60)} durationInFrames={105}>
        <Audio src={staticFile("sfx/cinematic-riser.mp3")} volume={sfxVol} />
      </Sequence>
      {[contentFrom, outroFrom].map((b) => (
        <Sequence key={`s${b}`} from={b - 7} durationInFrames={30}>
          <Audio src={staticFile("sfx/swoosh.wav")} volume={sfxVol * 0.85} />
        </Sequence>
      ))}

      {/* Musique de fond — déclenchement + point de départ réglables */}
      <Sequence from={musicFrom}>
        <Loop durationInFrames={Math.round(MUSIC_LOOP)}>
          <Audio
            src={staticFile(musicSrc)}
            trimBefore={musicTrim}
            volume={musicVol}
          />
        </Loop>
      </Sequence>
    </AbsoluteFill>
  );
};
