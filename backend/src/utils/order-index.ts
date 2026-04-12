/**
 * Fractional indexing for drag-and-drop reordering.
 * Generates a string key between two existing keys without needing to update other rows.
 */

const CHARS = 'abcdefghijklmnopqrstuvwxyz';
const MID = Math.floor(CHARS.length / 2);

/** Generate an initial order index */
export function generateInitialIndex(): string {
  return CHARS[MID]; // 'n'
}

/** Generate an index after the given one */
export function generateIndexAfter(after: string): string {
  return after + CHARS[MID];
}

/** Generate an index before the given one */
export function generateIndexBefore(before: string): string {
  // Find a midpoint character before the first char
  const firstCharIdx = CHARS.indexOf(before[0]);
  if (firstCharIdx > 1) {
    return CHARS[Math.floor(firstCharIdx / 2)];
  }
  return CHARS[0] + CHARS[MID];
}

/** Generate an index between two existing indices */
export function generateIndexBetween(before: string, after: string): string {
  // Find the first position where they differ
  const minLen = Math.min(before.length, after.length);

  for (let i = 0; i < minLen; i++) {
    const bIdx = CHARS.indexOf(before[i]);
    const aIdx = CHARS.indexOf(after[i]);

    if (aIdx - bIdx > 1) {
      // There's room between these characters
      return before.slice(0, i) + CHARS[Math.floor((bIdx + aIdx) / 2)];
    }

    if (aIdx - bIdx === 1) {
      // Adjacent characters — need to go deeper on the 'before' side
      return before.slice(0, i + 1) + CHARS[MID];
    }
  }

  // 'before' is a prefix of 'after' or equal length — append midpoint to 'before'
  return before + CHARS[MID];
}

/** Generate N evenly-spaced indices for initial bulk ordering */
export function generateNIndices(count: number): string[] {
  if (count === 0) return [];
  const step = Math.floor(CHARS.length / (count + 1));
  const indices: string[] = [];
  for (let i = 1; i <= count; i++) {
    const charIdx = Math.min(step * i, CHARS.length - 1);
    indices.push(CHARS[charIdx]);
  }
  // If we have duplicates due to too many items, add suffixes
  const seen = new Set<string>();
  return indices.map((idx) => {
    let result = idx;
    while (seen.has(result)) {
      result += CHARS[MID];
    }
    seen.add(result);
    return result;
  });
}
