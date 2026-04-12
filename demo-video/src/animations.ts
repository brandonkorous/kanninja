import { interpolate, spring, Easing } from "remotion";

// Smooth spring config for organic motion
export const SPRING_CONFIG = {
  damping: 200,
  stiffness: 100,
  mass: 0.5,
};

export const SPRING_SNAPPY = {
  damping: 100,
  stiffness: 200,
  mass: 0.4,
};

// Fade in with optional delay
export function fadeIn(frame: number, start: number, duration = 15): number {
  return interpolate(frame, [start, start + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
}

// Fade out
export function fadeOut(frame: number, start: number, duration = 12): number {
  return interpolate(frame, [start, start + duration], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.cubic),
  });
}

// Slide up from below
export function slideUp(
  frame: number,
  fps: number,
  delay = 0,
  distance = 80
): number {
  const s = spring({ frame: frame - delay, fps, config: SPRING_CONFIG });
  return interpolate(s, [0, 1], [distance, 0]);
}

// Slide in from right
export function slideRight(
  frame: number,
  fps: number,
  delay = 0,
  distance = 120
): number {
  const s = spring({ frame: frame - delay, fps, config: SPRING_CONFIG });
  return interpolate(s, [0, 1], [distance, 0]);
}

// Scale up from center
export function scaleIn(
  frame: number,
  fps: number,
  delay = 0
): number {
  const s = spring({ frame: frame - delay, fps, config: SPRING_SNAPPY });
  return interpolate(s, [0, 1], [0.7, 1]);
}

// Typewriter reveal (returns number of chars to show)
export function typewriter(
  frame: number,
  start: number,
  text: string,
  speed = 1.5
): number {
  return Math.min(
    Math.floor((frame - start) * speed),
    text.length
  );
}

// Smooth zoom for screenshots
export function smoothZoom(
  frame: number,
  start: number,
  duration: number,
  from = 1,
  to = 1.15
): number {
  return interpolate(frame, [start, start + duration], [from, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
}

// Wipe transition progress (0 to 1)
export function wipeProgress(
  frame: number,
  start: number,
  duration = 15
): number {
  return interpolate(frame, [start, start + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
}
