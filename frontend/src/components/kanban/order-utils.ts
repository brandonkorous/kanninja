/** Client-side fractional indexing — mirrors backend logic */
const CHARS = 'abcdefghijklmnopqrstuvwxyz';
const MID = Math.floor(CHARS.length / 2);

export function generateIndexAfter(after: string): string {
  return after + CHARS[MID];
}

/**
 * Index strictly before `before`, or `null` when the space below it is
 * exhausted ('a' is this alphabet's floor). Mirrors the backend's
 * `generateIndexBefore` — including the null contract, so both sides agree
 * on when a list needs respacing.
 */
export function generateIndexBefore(before: string): string | null {
  for (let i = 0; i < before.length; i++) {
    const idx = CHARS.indexOf(before[i]);
    if (idx > 0) {
      return before.slice(0, i) + CHARS[Math.floor(idx / 2)];
    }
  }
  return null;
}

export function generateIndexBetween(before: string, after: string): string {
  const minLen = Math.min(before.length, after.length);

  for (let i = 0; i < minLen; i++) {
    const bIdx = CHARS.indexOf(before[i]);
    const aIdx = CHARS.indexOf(after[i]);

    if (aIdx - bIdx > 1) {
      return before.slice(0, i) + CHARS[Math.floor((bIdx + aIdx) / 2)];
    }

    if (aIdx - bIdx === 1) {
      return before.slice(0, i + 1) + CHARS[MID];
    }
  }

  return before + CHARS[MID];
}

/**
 * Index for a card dropped between `prev` and `next` (either may be null
 * at the ends of a list). Returns `null` only for a head drop whose key
 * space is exhausted — callers should fall back to the server-resolved
 * `position: 'top'` rather than invent a colliding index.
 */
export function indexForSlot(prev: string | null, next: string | null): string | null {
  if (prev && next) return generateIndexBetween(prev, next);
  if (prev) return generateIndexAfter(prev);
  if (next) return generateIndexBefore(next);
  return CHARS[MID];
}
