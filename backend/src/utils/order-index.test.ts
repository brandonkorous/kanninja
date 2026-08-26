import { describe, it, expect } from 'vitest';
import {
  generateInitialIndex,
  generateIndexAfter,
  generateIndexBefore,
  generateIndexBetween,
  generateNIndices,
} from './order-index.js';

describe('order-index', () => {
  describe('generateInitialIndex', () => {
    it('returns a single midpoint character', () => {
      const idx = generateInitialIndex();
      expect(idx).toBe('n');
      expect(idx.length).toBe(1);
    });
  });

  describe('generateIndexAfter', () => {
    it('appends the midpoint character', () => {
      expect(generateIndexAfter('n')).toBe('nn');
      expect(generateIndexAfter('a')).toBe('an');
    });

    it('works on multi-character indices', () => {
      expect(generateIndexAfter('nn')).toBe('nnn');
    });
  });

  describe('generateIndexBefore', () => {
    it('returns a character before the given one when there is room', () => {
      const before = generateIndexBefore('n');
      expect(before < 'n').toBe(true);
    });

    it('keeps the shared prefix and halves the first decrementable char', () => {
      // Regression: the old implementation only looked at before[0], so
      // every 'a'-prefixed key mapped back onto itself and head-inserts
      // collided instead of ordering.
      expect(generateIndexBefore('an')).toBe('ag');
      expect(generateIndexBefore('ag')).toBe('ad');
    });

    it('stays strictly decreasing across repeated head inserts', () => {
      let key: string | null = 'n';
      let previous = key;
      for (let i = 0; i < 4; i++) {
        key = generateIndexBefore(previous);
        expect(key).not.toBeNull();
        expect(key! < previous).toBe(true);
        previous = key!;
      }
    });

    it('returns null when the key space below is exhausted', () => {
      expect(generateIndexBefore('a')).toBeNull();
      expect(generateIndexBefore('aaa')).toBeNull();
    });
  });

  describe('generateIndexBetween', () => {
    it('returns a value between two indices', () => {
      const mid = generateIndexBetween('a', 'z');
      expect(mid > 'a').toBe(true);
      expect(mid < 'z').toBe(true);
    });

    it('handles adjacent characters by going deeper', () => {
      const mid = generateIndexBetween('a', 'b');
      expect(mid > 'a').toBe(true);
      expect(mid < 'b').toBe(true);
    });

    it('handles same-prefix indices', () => {
      const mid = generateIndexBetween('na', 'nz');
      expect(mid > 'na').toBe(true);
      expect(mid < 'nz').toBe(true);
    });

    it('handles prefix relationship', () => {
      const mid = generateIndexBetween('n', 'nz');
      expect(mid > 'n').toBe(true);
      expect(mid < 'nz').toBe(true);
    });
  });

  describe('generateNIndices', () => {
    it('returns empty array for count 0', () => {
      expect(generateNIndices(0)).toEqual([]);
    });

    it('returns N unique sorted indices', () => {
      const indices = generateNIndices(5);
      expect(indices).toHaveLength(5);

      // All unique
      expect(new Set(indices).size).toBe(5);

      // Sorted ascending
      for (let i = 1; i < indices.length; i++) {
        expect(indices[i] > indices[i - 1]).toBe(true);
      }
    });

    it('handles large counts without duplicates', () => {
      const indices = generateNIndices(25);
      expect(indices).toHaveLength(25);
      expect(new Set(indices).size).toBe(25);
    });

    it('handles count of 1', () => {
      const indices = generateNIndices(1);
      expect(indices).toHaveLength(1);
      expect(typeof indices[0]).toBe('string');
    });
  });
});
