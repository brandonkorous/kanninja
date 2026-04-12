import { useCurrentFrame, useVideoConfig, AbsoluteFill } from "remotion";
import { COLORS } from "../constants";
import { fontFamily } from "../fonts";
import { fadeIn, slideUp, scaleIn } from "../animations";

export const CTAScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const tagOpacity = fadeIn(frame, 5, 12);
  const tagY = slideUp(frame, fps, 5, 40);
  const headlineOpacity = fadeIn(frame, 15, 15);
  const headlineY = slideUp(frame, fps, 15, 50);
  const btnOpacity = fadeIn(frame, 40, 15);
  const btnScale = scaleIn(frame, fps, 40);
  const urlOpacity = fadeIn(frame, 55, 15);

  const pulse = Math.sin(frame * 0.12) * 0.15 + 0.85;

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
          background: `radial-gradient(ellipse at 50% 60%, ${COLORS.onyx} 0%, ${COLORS.sumi} 60%)`,
        }}
      />

      <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
        <div
          style={{
            fontFamily: fontFamily.mono,
            fontSize: 26,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: COLORS.vermillion,
            opacity: tagOpacity,
            transform: `translateY(${tagY}px)`,
            marginBottom: 48,
          }}
        >
          Free forever to start
        </div>

        <div
          style={{
            opacity: headlineOpacity,
            transform: `translateY(${headlineY}px)`,
          }}
        >
          <div
            style={{
              fontFamily: fontFamily.display,
              fontSize: 88,
              fontWeight: 700,
              color: COLORS.snow,
              lineHeight: 1.15,
            }}
          >
            Turn chaos
          </div>
          <div
            style={{
              fontFamily: fontFamily.display,
              fontSize: 96,
              fontWeight: 700,
              fontStyle: "italic",
              color: COLORS.vermillion,
              lineHeight: 1.15,
              marginTop: 8,
            }}
          >
            into kata.
          </div>
        </div>

        <div
          style={{
            marginTop: 64,
            opacity: btnOpacity,
            transform: `scale(${btnScale})`,
          }}
        >
          <div
            style={{
              display: "inline-block",
              backgroundColor: COLORS.vermillion,
              color: COLORS.snow,
              fontFamily: fontFamily.body,
              fontSize: 30,
              fontWeight: 600,
              padding: "24px 56px",
              borderRadius: 16,
              boxShadow: `0 0 ${40 * pulse}px rgba(224,67,47,${0.4 * pulse})`,
              letterSpacing: "0.02em",
            }}
          >
            Start free — no card needed
          </div>
        </div>

        <div
          style={{
            fontFamily: fontFamily.mono,
            fontSize: 28,
            color: COLORS.stone,
            marginTop: 40,
            opacity: urlOpacity,
            letterSpacing: "0.05em",
          }}
        >
          kanninja.com
        </div>
      </div>
    </AbsoluteFill>
  );
};
