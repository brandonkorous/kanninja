/**
 * Empty-column copy — a small library of phrases for idle lanes.
 *
 * Hanko voice: calm, specific, direct. Never precious. Never shouty.
 * One breath each. None exceed five words.
 *
 * Picked deterministically from the column ID so each column keeps the same
 * phrase across renders within a session (no SSR/CSR hydration mismatch),
 * but returning to the dojo tomorrow surfaces new lines — the notebook feels
 * alive without moving.
 */

export const EMPTY_COLUMN_PHRASES = [
  // Plain
  'Nothing here yet.',
  'Empty for now.',
  'Quiet.',
  'Nothing queued.',
  'Clear.',
  'Empty column.',
  // Dojo vocabulary — earned metaphor
  'Waiting for the next kata.',
  'Ready for a kata.',
  'No kata in practice.',
  'The mat is clear.',
  'Between katas.',
  // Verb-forward, slightly literary
  'Waiting.',
  'Listening.',
  'At rest.',
  'In repose.',
  // Small warmth, used sparingly
  'A clean lane.',
  'Nothing to practice — yet.',
  'The dojo is listening.',
  'Room for one more.',
  'An open stance.',
] as const;

/**
 * Deterministic phrase picker. Hashes a stable key (column ID) to an index
 * in EMPTY_COLUMN_PHRASES. Same input always returns the same phrase, so
 * server and client renders agree, and a single column keeps its voice.
 *
 * Uses a minimal FNV-1a-style string hash — not cryptographic, just stable
 * and well-distributed across 20 buckets for UUID inputs.
 */
export function pickEmptyPhrase(seed: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  // Force positive, then mod the phrase count.
  const index = (hash >>> 0) % EMPTY_COLUMN_PHRASES.length;
  return EMPTY_COLUMN_PHRASES[index];
}
