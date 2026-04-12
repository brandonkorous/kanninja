import { loadFont as loadFraunces } from "@remotion/google-fonts/Fraunces";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadJetBrains } from "@remotion/google-fonts/JetBrainsMono";

const fraunces = loadFraunces();
const inter = loadInter();
const jetbrains = loadJetBrains();

export const fontFamily = {
  display: fraunces.fontFamily,
  body: inter.fontFamily,
  mono: jetbrains.fontFamily,
} as const;
