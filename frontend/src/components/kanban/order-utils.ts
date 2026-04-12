/** Client-side fractional indexing — mirrors backend logic */
const CHARS = 'abcdefghijklmnopqrstuvwxyz';
const MID = Math.floor(CHARS.length / 2);

export function generateIndexAfter(after: string): string {
  return after + CHARS[MID];
}

export function generateIndexBefore(before: string): string {
  const firstCharIdx = CHARS.indexOf(before[0]);
  if (firstCharIdx > 1) {
    return CHARS[Math.floor(firstCharIdx / 2)];
  }
  return CHARS[0] + CHARS[MID];
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
