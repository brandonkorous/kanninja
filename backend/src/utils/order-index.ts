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

/**
 * Generate an index strictly before the given one, or `null` when the key
 * space below `before` is exhausted (i.e. `before` is all 'a's, the floor
 * of this alphabet). Callers that must succeed — inserting at the head of
 * a list — handle `null` by renormalizing the whole list; see
 * `cardRepo.headIndexFor`.
 *
 * Walks left-to-right and halves the first decrementable character,
 * keeping the shared prefix. 'an' yields 'ag', not another 'an' — the
 * previous implementation only inspected `before[0]`, so every key with
 * an 'a' prefix mapped back onto itself and head-inserts silently
 * collided.
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
