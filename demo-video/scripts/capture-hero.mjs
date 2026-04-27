// Captures the hero loop directly from the real Agile Sprint board.
// Connects via CDP to the already-authenticated MCP-driven Chromium so we
// don't have to fight Clerk's login flow with a fresh Playwright instance.
//
//   cd v2/demo-video && node scripts/capture-hero.mjs
//
// Output: captures/hero-frames-<ts>/ (JPEG sequence) → ffmpeg → hero.{webm,mp4,jpg}

import { chromium } from "playwright";
import { mkdirSync, writeFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const CAPTURES_DIR = join(ROOT, "captures");
const CDP_URL = process.env.CDP_URL || "http://localhost:52199";
const BOARD_URL_FRAGMENT = "/dojo/be219a4f-bf94-4c0a-9f98-a99689dcd824/board";

mkdirSync(CAPTURES_DIR, { recursive: true });

// Drag a card into the body of a column. Idempotent — if the card is already
// in the column, the drop just re-orders. Used both to RESTORE state (silent,
// pre-recording) and for the recorded hero drags.
async function dragCardToColumn(page, cardName, columnName, { steps = 80 } = {}) {
  const card = page.getByRole("button", { name: `Open kata: ${cardName}` });
  const column = page.getByRole("button", { name: `Edit list title: ${columnName}` });
  await card.waitFor({ state: "visible", timeout: 10000 });
  await column.waitFor({ state: "visible", timeout: 10000 });
  const cardBox = await card.boundingBox();
  const colBox = await column.boundingBox();
  if (!cardBox || !colBox) {
    throw new Error(`Could not locate "${cardName}" or "${columnName}"`);
  }
  const startX = cardBox.x + cardBox.width / 2;
  const startY = cardBox.y + cardBox.height / 2;
  const endX = colBox.x + 100;
  const endY = colBox.y + 220;

  await page.mouse.move(startX, startY);
  await page.waitForTimeout(120);
  await page.mouse.down();
  await page.waitForTimeout(100);
  await page.mouse.move(endX, endY, { steps });
  await page.waitForTimeout(150);
  await page.mouse.up();
  await page.waitForTimeout(450); // let dnd-kit settle
}

console.log("[capture] Connecting to MCP browser at", CDP_URL);
const browser = await chromium.connectOverCDP(CDP_URL);

const contexts = browser.contexts();
if (!contexts.length) throw new Error("No CDP contexts found");
const context = contexts[0];

let page = context.pages().find((p) => p.url().includes(BOARD_URL_FRAGMENT));
if (!page) {
  page = context.pages()[0] ?? (await context.newPage());
  console.log("[capture] No board page found — navigating");
  await page.goto(`http://localhost:3000${BOARD_URL_FRAGMENT}`, {
    waitUntil: "networkidle",
  });
}
await page.bringToFront();
await page.setViewportSize({ width: 1920, height: 1080 });

// Reload to reset any horizontal board scroll left over from prior runs.
// Without this, column header coordinates can be off by one column and
// drop targets land in the wrong column.
await page.reload({ waitUntil: "networkidle" });

await page
  .getByRole("button", { name: "Open kata: Ship the auth refactor" })
  .waitFor({ state: "visible", timeout: 15000 });

// Sidebar must be OPEN — the kanNINJA wordmark lives there. If a previous run
// collapsed it, expand it before capture.
const expand = page.getByRole("button", { name: /expand sidebar/i });
if (await expand.isVisible().catch(() => false)) {
  await expand.click();
  await page.waitForTimeout(450);
}

// ── RESTORE (not recorded) ────────────────────────────────────────────────
// Put cards back to their starting columns so the capture is reproducible.
// Both drags land in columns NOT at the right edge — dropping into Done would
// trigger dnd-kit's auto-scroll and shift the whole composition mid-loop.
await dragCardToColumn(page, "Ship the auth refactor", "To Do");
await dragCardToColumn(page, "Polish dashboard transitions", "In Progress");

// Pre-roll — settled static frame
await page.waitForTimeout(500);

// ── RECORD ────────────────────────────────────────────────────────────────
const session = await context.newCDPSession(page);
const framesDir = join(CAPTURES_DIR, `hero-frames-${Date.now()}`);
mkdirSync(framesDir, { recursive: true });
let frameIdx = 0;

session.on("Page.screencastFrame", async (params) => {
  const i = String(frameIdx++).padStart(5, "0");
  writeFileSync(join(framesDir, `${i}.jpg`), Buffer.from(params.data, "base64"));
  session
    .send("Page.screencastFrameAck", { sessionId: params.sessionId })
    .catch(() => {});
});

await session.send("Page.startScreencast", {
  format: "jpeg",
  quality: 90,
  everyNthFrame: 1,
});

// Drag 1 — start a new piece of work
await dragCardToColumn(page, "Ship the auth refactor", "In Progress", { steps: 85 });

// Brief beat between drags
await page.waitForTimeout(220);

// Drag 2 — advance an in-progress card to review (rich card with desc + avatar)
await dragCardToColumn(page, "Polish dashboard transitions", "Review", { steps: 85 });

// Hold end state
await page.waitForTimeout(900);

await session.send("Page.stopScreencast").catch(() => {});
await session.detach().catch(() => {});

const frameCount = readdirSync(framesDir).length;
console.log(`[capture] Saved ${frameCount} frames →`, framesDir);

await browser.close().catch(() => {});

console.log(framesDir);
