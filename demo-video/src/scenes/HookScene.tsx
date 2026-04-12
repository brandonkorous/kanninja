import { useCurrentFrame, useVideoConfig, AbsoluteFill } from "remotion";
import { COLORS } from "../constants";
import { fontFamily } from "../fonts";
import { fadeIn, slideUp, scaleIn } from "../animations";

export const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const line1Opacity = fadeIn(frame, 0, 12);
  const line1Y = slideUp(frame, fps, 0, 60);

  const line2Opacity = fadeIn(frame, 18, 12);
  const line2Y = slideUp(frame, fps, 18, 60);

  const line3Opacity = fadeIn(frame, 40, 12);
  const line3Scale = scaleIn(frame, fps, 40);

  // Flash effect at the end
  const flashOpacity =
    frame > 75 ? fadeIn(frame, 75, 8) * (1 - fadeIn(frame, 80, 10)) : 0;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.sumi,
        justifyContent: "center",
        alignItems: "center",
        padding: 80,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at 50% 40%, ${COLORS.onyx} 0%, ${COLORS.sumi} 70%)`,
        }}
      />

      <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
        <div
          style={{
            fontFamily: fontFamily.mono,
            fontSize: 28,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: COLORS.vermillion,
            opacity: line1Opacity,
            transform: `translateY(${line1Y}px)`,
            marginBottom: 48,
          }}
        >
          Sound familiar?
        </div>

        <div
          style={{
            fontFamily: fontFamily.display,
            fontSize: 96,
            fontWeight: 700,
            color: COLORS.snow,
            lineHeight: 1.1,
            opacity: line2Opacity,
            transform: `translateY(${line2Y}px)`,
          }}
        >
          Your tasks are
        </div>

        <div
          style={{
            fontFamily: fontFamily.display,
            fontSize: 120,
            fontWeight: 700,
            fontStyle: "italic",
            color: COLORS.vermillion,
            lineHeight: 1.1,
            marginTop: 12,
            opacity: line3Opacity,
            transform: `scale(${line3Scale})`,
          }}
        >
          screaming.
        </div>
      </div>

      <AbsoluteFill
        style={{
          backgroundColor: COLORS.vermillion,
          opacity: flashOpacity * 0.3,
        }}
      />
    </AbsoluteFill>
  );
};
