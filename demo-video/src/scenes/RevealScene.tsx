import {
  useCurrentFrame,
  useVideoConfig,
  AbsoluteFill,
  spring,
  interpolate,
} from "remotion";
import { COLORS } from "../constants";
import { fontFamily } from "../fonts";
import { fadeIn } from "../animations";

export const RevealScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const stampProgress = spring({
    frame: frame - 10,
    fps,
    config: { damping: 60, stiffness: 300, mass: 0.3 },
  });
  const stampScale = interpolate(stampProgress, [0, 0.5, 1], [3, 0.95, 1]);
  const stampOpacity = interpolate(stampProgress, [0, 0.15], [0, 1], {
    extrapolateRight: "clamp",
  });

  const ringScale = interpolate(stampProgress, [0.4, 1], [0.8, 2.5], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ringOpacity = interpolate(stampProgress, [0.4, 1], [0.4, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const kanOpacity = fadeIn(frame, 35, 12);
  const ninjaOpacity = fadeIn(frame, 40, 12);
  const taglineOpacity = fadeIn(frame, 55, 15);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.washi,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Impact ring */}
      <div
        style={{
          position: "absolute",
          width: 240,
          height: 240,
          borderRadius: "50%",
          border: `3px solid ${COLORS.vermillion}`,
          transform: `scale(${ringScale})`,
          opacity: ringOpacity,
          top: "32%",
        }}
      />

      {/* Stamp */}
      <div
        style={{
          width: 180,
          height: 180,
          backgroundColor: COLORS.vermillion,
          borderRadius: 28,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${stampScale})`,
          opacity: stampOpacity,
          boxShadow: `0 8px 40px rgba(224,67,47,0.3)`,
          marginBottom: 48,
        }}
      >
        <span
          style={{
            fontFamily: fontFamily.display,
            fontSize: 88,
            fontWeight: 800,
            color: COLORS.snow,
            fontStyle: "italic",
          }}
        >
          忍
        </span>
      </div>

      {/* Wordmark */}
      <div style={{ textAlign: "center" }}>
        <span
          style={{
            fontFamily: fontFamily.body,
            fontSize: 84,
            fontWeight: 300,
            color: COLORS.sumi,
            letterSpacing: "0.02em",
            opacity: kanOpacity,
          }}
        >
          kan
        </span>
        <span
          style={{
            fontFamily: fontFamily.body,
            fontSize: 84,
            fontWeight: 800,
            color: COLORS.sumi,
            letterSpacing: "0.02em",
            opacity: ninjaOpacity,
          }}
        >
          NINJA
        </span>
      </div>

      {/* Tagline */}
      <div
        style={{
          fontFamily: fontFamily.display,
          fontSize: 44,
          fontStyle: "italic",
          color: COLORS.vermillion,
          opacity: taglineOpacity,
          marginTop: 20,
        }}
      >
        Turn chaos into kata.
      </div>
    </AbsoluteFill>
  );
};
