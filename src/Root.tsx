import "./index.css";
import { Composition } from "remotion";
import { MyComposition } from "./Composition";
import { FPS, TOTAL_FRAMES } from "./lib/timing";
import { HeroLoop, HeroLoopMobile } from "./hero/HeroLoop";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MyComp"
        component={MyComposition}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={2560}
        height={1440}
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
    </>
  );
};
