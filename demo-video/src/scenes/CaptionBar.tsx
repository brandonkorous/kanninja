import { useCurrentFrame } from "remotion";
import { COLORS } from "../constants";
import { fontFamily } from "../fonts";
import { fadeIn, fadeOut } from "../animations";

export const CaptionBar: React.FC<{
  text: string;
  startFrame?: number;
  endFrame?: number;
  style?: "light" | "dark";
}> = ({ text, startFrame = 0, endFrame = 60, style = "dark" }) => {
  const frame = useCurrentFrame();

  const opacity =
    fadeIn(frame, startFrame, 8) * fadeOut(frame, endFrame - 10, 10);

  if (opacity <= 0) return null;

  const isDark = style === "dark";

  return (
    <div
      style={{
        position: "absolute",
        bottom: 180,
        left: 48,
        right: 48,
        display: "flex",
        justifyContent: "center",
        opacity,
        zIndex: 100,
      }}
    >
      <div
        style={{
          background: isDark
            ? `rgba(14,15,18,0.85)`
            : `rgba(248,244,236,0.9)`,
          backdropFilter: "blur(12px)",
          borderRadius: 16,
          padding: "20px 40px",
          maxWidth: 940,
        }}
      >
        <span
          style={{
            fontFamily: fontFamily.body,
            fontSize: 32,
            fontWeight: 500,
            color: isDark ? COLORS.snow : COLORS.sumi,
            lineHeight: 1.4,
            textAlign: "center",
          }}
        >
          {text}
        </span>
      </div>
    </div>
  );
};
