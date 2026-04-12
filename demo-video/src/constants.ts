// Video dimensions — 9:16 portrait for TikTok/Reels/Shorts
export const VIDEO_WIDTH = 1080;
export const VIDEO_HEIGHT = 1920;
export const VIDEO_FPS = 30;

// Hanko brand colors
export const COLORS = {
  vermillion: "#E0432F",
  sumiRed: "#B5301F",
  coral: "#F19684",
  wash: "#FBE9E5",
  snow: "#FBFAF6",
  washi: "#F8F4EC",
  mist: "#EFEAE0",
  ash: "#D6D2C5",
  stone: "#A8A59A",
  slate: "#6B6A65",
  charcoal: "#46464A",
  onyx: "#2A2B33",
  ink: "#181920",
  sumi: "#0E0F12",
  bamboo: "#3F8F5C",
  indigo: "#3D5C8A",
} as const;

// Scene durations in frames (at 30fps)
export const SCENES = {
  hook: 90,        // 3s — attention grab
  problem: 120,    // 4s — pain point
  reveal: 90,      // 3s — brand reveal
  features: 450,   // 15s — feature showcase (5 features × 3s)
  cta: 120,        // 4s — call to action
} as const;

export const TOTAL_DURATION = Object.values(SCENES).reduce((a, b) => a + b, 0);
