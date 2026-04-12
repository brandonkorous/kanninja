import {
  useCurrentFrame,
  useVideoConfig,
  AbsoluteFill,
  Img,
  Sequence,
  staticFile,
} from "remotion";
import { COLORS } from "../constants";
import { fontFamily } from "../fonts";
import { fadeIn, slideUp, smoothZoom, fadeOut } from "../animations";

interface FeatureSlide {
  eyebrow: string;
  title: string;
  italicWord: string;
  description: string;
  screenshot: string;
}

const FEATURES: FeatureSlide[] = [
  {
    eyebrow: "Your workspace",
    title: "Dojos, not",
    italicWord: "boards.",
    description:
      "Organize work into focused training spaces. Each dojo is a practice ground.",
    screenshot: "captures/04-dashboard.png",
  },
  {
    eyebrow: "Drag. Drop. Flow.",
    title: "The kanban that",
    italicWord: "disappears.",
    description:
      "Cards, lists, checklists, labels, time tracking. Everything you need, nothing you don't.",
    screenshot: "captures/05-kanban-board.png",
  },
  {
    eyebrow: "AI-powered",
    title: "A second pair of",
    italicWord: "eyes.",
    description:
      "12 AI techniques that parse, prioritize, and predict — so you can focus.",
    screenshot: "captures/06-ai-hub.png",
  },
  {
    eyebrow: "Measure mastery",
    title: "Numbers that don't",
    italicWord: "lie.",
    description:
      "Velocity, burndown, cycle time. See where you're improving.",
    screenshot: "captures/07-analytics.png",
  },
  {
    eyebrow: "Built for teams",
    title: "Every feature,",
    italicWord: "grouped in kata.",
    description: "From free to enterprise. Five tiers, every line transparent.",
    screenshot: "captures/03-pricing.png",
  },
];

const SLIDE_DURATION = 90;

const FeatureSlideComponent: React.FC<{ feature: FeatureSlide }> = ({
  feature,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const eyebrowOpacity = fadeIn(frame, 0, 10);
  const eyebrowY = slideUp(frame, fps, 0, 30);
  const titleOpacity = fadeIn(frame, 8, 12);
  const titleY = slideUp(frame, fps, 8, 40);
  const descOpacity = fadeIn(frame, 20, 12);
  const descY = slideUp(frame, fps, 20, 30);
  const screenshotOpacity = fadeIn(frame, 15, 15);
  const screenshotY = slideUp(frame, fps, 15, 60);
  const screenshotScale = smoothZoom(frame, 15, 70, 1, 1.05);
  const exitOpacity = fadeOut(frame, 75, 15);

  return (
    <AbsoluteFill
      style={{ backgroundColor: COLORS.washi, opacity: exitOpacity }}
    >
      <div style={{ padding: "120px 72px 40px" }}>
        <div
          style={{
            fontFamily: fontFamily.mono,
            fontSize: 24,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: COLORS.vermillion,
            opacity: eyebrowOpacity,
            transform: `translateY(${eyebrowY}px)`,
            marginBottom: 24,
          }}
        >
          {feature.eyebrow}
        </div>

        <div
          style={{
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
          }}
        >
          <span
            style={{
              fontFamily: fontFamily.display,
              fontSize: 72,
              fontWeight: 700,
              color: COLORS.sumi,
              lineHeight: 1.15,
            }}
          >
            {feature.title}{" "}
          </span>
          <span
            style={{
              fontFamily: fontFamily.display,
              fontSize: 72,
              fontWeight: 700,
              fontStyle: "italic",
              color: COLORS.vermillion,
              lineHeight: 1.15,
            }}
          >
            {feature.italicWord}
          </span>
        </div>

        <div
          style={{
            fontFamily: fontFamily.body,
            fontSize: 30,
            color: COLORS.slate,
            lineHeight: 1.5,
            marginTop: 24,
            maxWidth: 900,
            opacity: descOpacity,
            transform: `translateY(${descY}px)`,
          }}
        >
          {feature.description}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          padding: "24px 48px",
          overflow: "hidden",
          opacity: screenshotOpacity,
          transform: `translateY(${screenshotY}px)`,
        }}
      >
        <div
          style={{
            borderRadius: 24,
            overflow: "hidden",
            boxShadow: `0 12px 60px rgba(14,15,18,0.12)`,
            border: `1px solid ${COLORS.mist}`,
            transform: `scale(${screenshotScale})`,
            transformOrigin: "top center",
          }}
        >
          <Img
            src={staticFile(feature.screenshot)}
            style={{ width: 960, height: "auto", display: "block" }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const FeatureShowcase: React.FC = () => {
  return (
    <AbsoluteFill>
      {FEATURES.map((feature, i) => (
        <Sequence
          key={i}
          from={i * SLIDE_DURATION}
          durationInFrames={SLIDE_DURATION}
        >
          <FeatureSlideComponent feature={feature} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
