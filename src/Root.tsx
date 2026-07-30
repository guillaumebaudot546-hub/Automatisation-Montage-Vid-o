import "./index.css";
import { Composition } from "remotion";
import { MyComposition } from "./Composition";
import { FPS, TOTAL_FRAMES } from "./lib/timing";
import { HeroLoop, HeroLoopMobile } from "./hero/HeroLoop";
import { ClinicalWrap, clinicalSchema, wrapDuration, FPS as CLINICAL_FPS } from "./clinical/ClinicalWrap";
import { ClinicalHighlights, highlightsSchema, highlightsDuration } from "./clinical/ClinicalHighlights";
import { CapsuleV2, capsuleV2Schema, capsuleV2Duration } from "./capsule/CapsuleV2";
import { CAPSULE1_PROPS } from "./capsule/capsule1-props";
import { TEASER4_PROPS } from "./capsule/teaser4-props";
import { SUTURE_PROPS } from "./capsule/suture-props";

// Cas cliniques — durées sources en frames @30fps
const VESTIBULAIRE_FRAMES = 9056; // 301.87 s
const SERDAT_FRAMES = 10368; // 345.6 s

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MyComp"
        component={MyComposition}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={1920}
        height={1080}
      />
      {/* Hero card DentalSynthesis — boucle seamless 24s (PRD v1.4) */}
      <Composition
        id="HeroLoop"
        component={HeroLoop}
        durationInFrames={720}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="HeroLoopMobile"
        component={HeroLoopMobile}
        durationInFrames={720}
        fps={30}
        width={768}
        height={1080}
      />
      {/* Versions courtes 1 min — segments + sons éditables dans le Studio */}
      <Composition
        id="HighlightsVestibulaire"
        component={ClinicalHighlights}
        schema={highlightsSchema}
        fps={30}
        width={1920}
        height={1080}
        durationInFrames={1800}
        calculateMetadata={({ props }) => ({
          durationInFrames: highlightsDuration(props.segments, Boolean(props.ctaLine1)),
        })}
        defaultProps={{
          src: "clinical/vestibulaire.mp4",
          eyebrow: "Cas clinique · Chirurgie muco-gingivale",
          title: "Approfondissement vestibulaire",
          subtitle: "L'essentiel en 1 minute",
          hasAudio: false,
          segments: [
            { startSec: 16, durationSec: 10, transition: "fade" },
            { startSec: 55, durationSec: 9, transition: "zoom" },
            { startSec: 95, durationSec: 9, transition: "flash" },
            { startSec: 148, durationSec: 8, transition: "zoom" },
            { startSec: 196, durationSec: 10, transition: "flash" },
            { startSec: 282, durationSec: 8, transition: "zoom" },
          ],
          soundCues: [
            { sound: "riser", atSec: 1.0, volume: 0.14, pitch: 1 },
            { sound: "swoosh", atSec: 5.3, volume: 0.13, pitch: 1 },
            { sound: "click", atSec: 15.5, volume: 0.11, pitch: 1 },
            { sound: "swoosh", atSec: 25.5, volume: 0.12, pitch: 1.1 },
            { sound: "swoosh", atSec: 43.5, volume: 0.12, pitch: 0.95 },
            { sound: "impact", atSec: 54.0, volume: 0.13, pitch: 1 },
          ],
          captions: [
            {
              text: "Approfondissement vestibulaire : le LASER Erbium-YAG dissèque les couches tissulaires sans saignement, dégagées par son spray.",
              fromSec: 6.0,
              toSec: 15.2,
            },
            {
              text: "Un outil microchirurgical : la dissection micrométrique de chaque couche tissulaire.",
              fromSec: 15.8,
              toSec: 24.2,
            },
            {
              text: "La maîtrise des tensions tissulaires permet ensuite d'apicaliser les tissus.",
              fromSec: 24.8,
              toSec: 33.2,
            },
            {
              text: "Les couches séparées, la suture au périoste — parfaitement préservé — devient très simple.",
              fromSec: 33.8,
              toSec: 41.2,
            },
            {
              text: "Points périostés en matelassier horizontal, puis membrane PRF autogène suturée au fil 6/0, suspendue aux dents.",
              fromSec: 41.8,
              toSec: 51.2,
            },
            {
              text: "Une microchirurgie élégante assistée au LASER : résultat fiable, reproductible, suites opératoires minimes.",
              fromSec: 51.8,
              toSec: 59.2,
            },
          ],
          ctaLine1: "Maîtriser le LASER en microchirurgie",
          ctaLine2: "Contactez IMCP",
          musicOffsetSec: 0,
          musicChromeVol: 0.26,
          musicBedVol: 0.14,
          sourceVol: 1,
        }}
      />
      <Composition
        id="HighlightsSerdat"
        component={ClinicalHighlights}
        schema={highlightsSchema}
        fps={30}
        width={1920}
        height={1080}
        durationInFrames={1800}
        calculateMetadata={({ props }) => ({
          durationInFrames: highlightsDuration(props.segments),
        })}
        defaultProps={{
          src: "clinical/serdat.mov",
          eyebrow: "Cas clinique · Laser Erbium-YAG",
          title: "Retrait d'implant au laser",
          subtitle: "Protocole SERDAT — l'essentiel en 1 minute",
          hasAudio: true,
          segments: [
            { startSec: 12, durationSec: 9, transition: "fade" },
            { startSec: 65, durationSec: 10, transition: "zoom" },
            { startSec: 115, durationSec: 9, transition: "flash" },
            { startSec: 175, durationSec: 10, transition: "zoom" },
            { startSec: 295, durationSec: 10, transition: "flash" },
          ],
          soundCues: [
            { sound: "riser", atSec: 1.0, volume: 0.14, pitch: 1 },
            { sound: "swoosh", atSec: 5.3, volume: 0.13, pitch: 1 },
            { sound: "swoosh", atSec: 24.5, volume: 0.12, pitch: 1.05 },
            { sound: "impact", atSec: 53.0, volume: 0.13, pitch: 1 },
          ],
          musicOffsetSec: 0,
          musicChromeVol: 0.24,
          musicBedVol: 0.06,
          sourceVol: 1,
        }}
      />
      {/* Capsule verticale 9:16 v2 — voix continue + calques (Commande 1) */}
      <Composition
        id="CapsuleLaserErYag"
        component={CapsuleV2}
        schema={capsuleV2Schema}
        fps={30}
        width={1080}
        height={1920}
        durationInFrames={capsuleV2Duration(CAPSULE1_PROPS.spans)}
        calculateMetadata={({ props }) => ({
          durationInFrames: capsuleV2Duration(props.spans),
        })}
        defaultProps={CAPSULE1_PROPS}
      />
      {/* Capsule 1 min du cours — passage continu cohérent (moteur capsule) */}
      <Composition
        id="TeaserLaserErYag"
        component={CapsuleV2}
        schema={capsuleV2Schema}
        fps={30}
        width={1080}
        height={1920}
        durationInFrames={capsuleV2Duration(TEASER4_PROPS.spans)}
        calculateMetadata={({ props }) => ({ durationInFrames: capsuleV2Duration(props.spans) })}
        defaultProps={TEASER4_PROPS}
      />
      {/* Capsule « Fils de suture & aiguilles » — rush IMG_3181, span unique continu */}
      <Composition
        id="CapsuleSutures"
        component={CapsuleV2}
        schema={capsuleV2Schema}
        fps={30}
        width={1080}
        height={1920}
        durationInFrames={capsuleV2Duration(SUTURE_PROPS.spans)}
        calculateMetadata={({ props }) => ({ durationInFrames: capsuleV2Duration(props.spans) })}
        defaultProps={SUTURE_PROPS}
      />
      {/* Cas cliniques — environnement de marque IMCP */}
      <Composition
        id="ClinicalVestibulaire"
        component={ClinicalWrap}
        schema={clinicalSchema}
        durationInFrames={wrapDuration(VESTIBULAIRE_FRAMES)}
        fps={CLINICAL_FPS}
        width={1920}
        height={1080}
        defaultProps={{
          src: "clinical/vestibulaire.mp4",
          contentFrames: VESTIBULAIRE_FRAMES,
          eyebrow: "Cas clinique · Chirurgie muco-gingivale",
          title: "Approfondissement vestibulaire",
          subtitle: "Technique chirurgicale — pas à pas",
          hasAudio: false,
        }}
      />
      <Composition
        id="ClinicalSerdat"
        component={ClinicalWrap}
        schema={clinicalSchema}
        durationInFrames={wrapDuration(SERDAT_FRAMES)}
        fps={CLINICAL_FPS}
        width={1920}
        height={1080}
        defaultProps={{
          src: "clinical/serdat.mov",
          contentFrames: SERDAT_FRAMES,
          eyebrow: "Cas clinique · Laser Erbium-YAG",
          title: "Retrait d'implant au laser",
          subtitle: "Protocole SERDAT",
          hasAudio: true,
        }}
      />
    </>
  );
};
