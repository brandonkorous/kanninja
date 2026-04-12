import { useCurrentFrame, useVideoConfig, AbsoluteFill } from "remotion";
import { COLORS } from "../constants";
import { fontFamily } from "../fonts";
import { fadeIn, fadeOut, slideUp } from "../animations";

const CHAOS_ITEMS = [
  { text: "Q3 roadmap review", x: -40, y: 200, rot: -12, delay: 5 },
  { text: "Fix auth bug URGENT", x: 580, y: 420, rot: 8, delay: 10 },
  { text: "Sprint retro notes", x: 80, y: 600, rot: -5, delay: 15 },
  { text: "Deploy to staging??", x: 480, y: 800, rot: 15, delay: 8 },
  { text: "Client feedback (overdue)", x: 20, y: 980, rot: -8, delay: 20 },
  { text: "Design review blocked", x: 420, y: 1140, rot: 10, delay: 12 },
  { text: "Update dependencies", x: 140, y: 1300, rot: -15, delay: 25 },
  { text: "Team standup prep", x: 560, y: 1460, rot: 6, delay: 18 },
];

export const ProblemScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bgOpacity = fadeIn(frame, 0, 10);
  const exitOpacity = fadeOut(frame, 100, 20);

  return (
    <AbsoluteFill
      style={{ backgroundColor: COLORS.washi, opacity: bgOpacity * exitOpacity }}
    >
      {CHAOS_ITEMS.map((item, i) => {
        const itemOpacity = fadeIn(frame, item.delay, 10);
        const itemY = slideUp(frame, fps, item.delay, 40);
        const float = Math.sin((frame + i * 20) * 0.05) * 8;
        const drift = Math.cos((frame + i * 15) * 0.03) * 5;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: item.x,
              top: item.y + float,
              transform: `translateY(${itemY}px) translateX(${drift}px) rotate(${item.rot}deg)`,
              opacity: itemOpacity,
              background: COLORS.snow,
              border: `1px solid ${COLORS.mist}`,
              borderRadius: 14,
              padding: "20px 32px",
              fontFamily: fontFamily.body,
              fontSize: 28,
              color: COLORS.charcoal,
              boxShadow: `0 4px 20px rgba(14,15,18,0.06)`,
              whiteSpace: "nowrap",
            }}
          >
            {item.text}
          </div>
        );
      })}

      <div
        style={{
          position: "absolute",
          bottom: 280,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: fadeIn(frame, 40, 15),
          transform: `translateY(${slideUp(frame, fps, 40, 40)}px)`,
        }}
      >
        <div
          style={{
            fontFamily: fontFamily.display,
            fontSize: 72,
            fontWeight: 700,
            color: COLORS.sumi,
            lineHeight: 1.2,
          }}
        >
          Scattered across
        </div>
        <div
          style={{
            fontFamily: fontFamily.display,
            fontSize: 72,
            fontWeight: 700,
            fontStyle: "italic",
            color: COLORS.vermillion,
            lineHeight: 1.2,
          }}
        >
          five different tools.
        </div>
      </div>
    </AbsoluteFill>
  );
};
