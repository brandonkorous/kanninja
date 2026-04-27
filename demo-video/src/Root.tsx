import { Composition } from "remotion";
import { DemoVideo } from "./DemoVideo";
import {
  VIDEO_WIDTH,
  VIDEO_HEIGHT,
  VIDEO_FPS,
  TOTAL_DURATION,
} from "./constants";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Full pitch film — 9:16 portrait for TikTok/Reels/Shorts.
          Landing/features hero + kata loops are real product captures
          via scripts/capture-hero.mjs (CDP), not Remotion compositions. */}
      <Composition
        id="DemoVideo"
        component={DemoVideo}
        durationInFrames={TOTAL_DURATION}
        fps={VIDEO_FPS}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
      />
    </>
  );
};
