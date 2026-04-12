import { useCurrentFrame, AbsoluteFill, interpolate, Easing } from "remotion";
import { COLORS } from "../constants";

// Full-screen wipe transition overlay
export const TransitionWipe: React.FC<{
  color?: string;
  direction?: "left" | "right" | "up";
}> = ({ color = COLORS.vermillion, direction = "left" }) => {
  const frame = useCurrentFrame();

  // Wipe in then wipe out (total 20 frames)
  const wipeIn = interpolate(frame, [0, 10], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });

  const wipeOut = interpolate(frame, [10, 20], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });

  const getClipPath = () => {
    if (direction === "up") {
      return {
        enter: `inset(${100 - wipeIn}% 0 0 0)`,
        exit: `inset(0 0 ${wipeOut}% 0)`,
      };
    }
    if (direction === "right") {
      return {
        enter: `inset(0 ${100 - wipeIn}% 0 0)`,
        exit: `inset(0 0 0 ${wipeOut}%)`,
      };
    }
    // default: left
    return {
      enter: `inset(0 0 0 ${100 - wipeIn}%)`,
      exit: `inset(0 ${wipeOut}% 0 0)`,
    };
  };

  const clip = getClipPath();

  return (
    <AbsoluteFill
      style={{
        backgroundColor: color,
        clipPath: frame < 10 ? clip.enter : clip.exit,
      }}
    />
  );
};
