import { AbsoluteFill, Sequence, Audio, staticFile } from "remotion";
import { SCENES } from "./constants";
import { HookScene } from "./scenes/HookScene";
import { ProblemScene } from "./scenes/ProblemScene";
import { RevealScene } from "./scenes/RevealScene";
import { FeatureShowcase } from "./scenes/FeatureShowcase";
import { CTAScene } from "./scenes/CTAScene";
import { TransitionWipe } from "./scenes/TransitionWipe";
import { CaptionBar } from "./scenes/CaptionBar";

const FEATURE_SLIDE = 90; // frames per feature slide

export const DemoVideo: React.FC = () => {
  const hookStart = 0;
  const problemStart = hookStart + SCENES.hook;
  const revealStart = problemStart + SCENES.problem;
  const featuresStart = revealStart + SCENES.reveal;
  const ctaStart = featuresStart + SCENES.features;

  return (
    <AbsoluteFill>
      {/* ── Scene 1: Hook ── */}
      <Sequence from={hookStart} durationInFrames={SCENES.hook}>
        <HookScene />
        <Audio src={staticFile("audio/01-hook.mp3")} volume={1} />
        <CaptionBar
          text="Your tasks are screaming. Scattered across five different tools."
          startFrame={5}
          endFrame={80}
          style="light"
        />
      </Sequence>

      {/* Transition: Hook → Problem */}
      <Sequence from={hookStart + SCENES.hook - 10} durationInFrames={20}>
        <TransitionWipe direction="left" />
      </Sequence>

      {/* ── Scene 2: Problem ── */}
      <Sequence from={problemStart} durationInFrames={SCENES.problem}>
        <ProblemScene />
        <Audio src={staticFile("audio/02-problem.mp3")} volume={1} />
        <CaptionBar
          text="Sticky notes. Spreadsheets. Slack threads. Random docs."
          startFrame={5}
          endFrame={55}
          style="dark"
        />
        <CaptionBar
          text="There has to be a better way."
          startFrame={60}
          endFrame={110}
          style="dark"
        />
      </Sequence>

      {/* Transition: Problem → Reveal */}
      <Sequence from={problemStart + SCENES.problem - 10} durationInFrames={20}>
        <TransitionWipe direction="up" />
      </Sequence>

      {/* ── Scene 3: Brand Reveal ── */}
      <Sequence from={revealStart} durationInFrames={SCENES.reveal}>
        <RevealScene />
        <Audio src={staticFile("audio/03-reveal.mp3")} volume={1} />
      </Sequence>

      {/* Transition: Reveal → Features */}
      <Sequence from={revealStart + SCENES.reveal - 10} durationInFrames={20}>
        <TransitionWipe direction="right" />
      </Sequence>

      {/* ── Scene 4: Feature Showcase ── */}
      {/* Feature 1: Dojos */}
      <Sequence from={featuresStart} durationInFrames={FEATURE_SLIDE}>
        <Audio src={staticFile("audio/04-feature-dojos.mp3")} volume={1} />
      </Sequence>
      {/* Feature 2: Kanban */}
      <Sequence from={featuresStart + FEATURE_SLIDE} durationInFrames={FEATURE_SLIDE}>
        <Audio src={staticFile("audio/05-feature-kanban.mp3")} volume={1} />
      </Sequence>
      {/* Feature 3: AI */}
      <Sequence from={featuresStart + FEATURE_SLIDE * 2} durationInFrames={FEATURE_SLIDE}>
        <Audio src={staticFile("audio/06-feature-ai.mp3")} volume={1} />
      </Sequence>
      {/* Feature 4: Analytics */}
      <Sequence from={featuresStart + FEATURE_SLIDE * 3} durationInFrames={FEATURE_SLIDE}>
        <Audio src={staticFile("audio/07-feature-analytics.mp3")} volume={1} />
      </Sequence>
      {/* Feature 5: Pricing */}
      <Sequence from={featuresStart + FEATURE_SLIDE * 4} durationInFrames={FEATURE_SLIDE}>
        <Audio src={staticFile("audio/08-feature-pricing.mp3")} volume={1} />
      </Sequence>

      {/* Visual layer for all features */}
      <Sequence from={featuresStart} durationInFrames={SCENES.features}>
        <FeatureShowcase />
      </Sequence>

      {/* Transition: Features → CTA */}
      <Sequence from={featuresStart + SCENES.features - 10} durationInFrames={20}>
        <TransitionWipe direction="up" />
      </Sequence>

      {/* ── Scene 5: CTA ── */}
      <Sequence from={ctaStart} durationInFrames={SCENES.cta}>
        <CTAScene />
        <Audio src={staticFile("audio/09-cta.mp3")} volume={1} />
      </Sequence>
    </AbsoluteFill>
  );
};
