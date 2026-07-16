import { AbsoluteFill, Sequence } from "remotion";
import { C } from "./heroShared";
import { HeroBackground } from "./HeroBackground";
import { S1Logo, S2Tagline } from "./HeroIntro";
import { S3Modules } from "./HeroModules";
import { S4Proof, S5CTA } from "./HeroOutro";

/**
 * HERO LOOP — DentalSynthesis (PRD v1.4)
 * 24 s @ 30 fps = 720 frames. Boucle seamless, muet (autoplay/muted/loop).
 * S1 logo (0-3s) · S2 tagline (3-8s) · S3 modules (8-18s) ·
 * S4 proof (18-22s) · S5 CTA + raccord boucle (22-24s).
 * Assemblage pur — les scènes vivent dans hero/Hero*.tsx.
 */
export const HeroLoop: React.FC<{ mobile?: boolean }> = ({ mobile }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg0 }}>
      <HeroBackground />
      <Sequence durationInFrames={90}>
        <S1Logo mobile={mobile} />
      </Sequence>
      <Sequence from={90} durationInFrames={150}>
        <S2Tagline mobile={mobile} />
      </Sequence>
      <Sequence from={240} durationInFrames={300}>
        <S3Modules mobile={mobile} />
      </Sequence>
      <Sequence from={540} durationInFrames={120}>
        <S4Proof mobile={mobile} />
      </Sequence>
      <Sequence from={660} durationInFrames={60}>
        <S5CTA mobile={mobile} />
      </Sequence>
    </AbsoluteFill>
  );
};

export const HeroLoopMobile: React.FC = () => <HeroLoop mobile />;
