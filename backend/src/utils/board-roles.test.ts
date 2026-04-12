import { describe, it, expect } from 'vitest';
import { BOARD_ROLE_RANK, CLAN_TO_BOARD, effectiveRole } from './board-roles.js';

describe('board-roles', () => {
  describe('BOARD_ROLE_RANK', () => {
    it('ranks viewer < editor < owner', () => {
      expect(BOARD_ROLE_RANK.viewer).toBeLessThan(BOARD_ROLE_RANK.editor);
      expect(BOARD_ROLE_RANK.editor).toBeLessThan(BOARD_ROLE_RANK.owner);
    });
  });

  describe('CLAN_TO_BOARD mapping', () => {
    it('maps admin → owner', () => {
      expect(CLAN_TO_BOARD.admin).toBe('owner');
    });

    it('maps member → editor', () => {
      expect(CLAN_TO_BOARD.member).toBe('editor');
    });

    it('maps reader → viewer', () => {
      expect(CLAN_TO_BOARD.reader).toBe('viewer');
    });
  });

  describe('effectiveRole', () => {
    it('returns mapped role when ceiling is higher', () => {
      // admin maps to owner, ceiling is owner → owner
      expect(effectiveRole('admin', 'owner')).toBe('owner');
      // member maps to editor, ceiling is owner → editor
      expect(effectiveRole('member', 'owner')).toBe('editor');
      // reader maps to viewer, ceiling is owner → viewer
      expect(effectiveRole('reader', 'owner')).toBe('viewer');
    });

    it('caps at ceiling when mapped role is higher', () => {
      // admin maps to owner, ceiling is editor → editor
      expect(effectiveRole('admin', 'editor')).toBe('editor');
      // admin maps to owner, ceiling is viewer → viewer
      expect(effectiveRole('admin', 'viewer')).toBe('viewer');
      // member maps to editor, ceiling is viewer → viewer
      expect(effectiveRole('member', 'viewer')).toBe('viewer');
    });

    it('returns mapped role when it equals the ceiling', () => {
      // member maps to editor, ceiling is editor → editor
      expect(effectiveRole('member', 'editor')).toBe('editor');
      // reader maps to viewer, ceiling is viewer → viewer
      expect(effectiveRole('reader', 'viewer')).toBe('viewer');
    });

    // The core access control invariant: a clan reader should never
    // get editor/owner on a board, regardless of ceiling.
    it('never promotes a reader above viewer', () => {
      expect(effectiveRole('reader', 'owner')).toBe('viewer');
      expect(effectiveRole('reader', 'editor')).toBe('viewer');
      expect(effectiveRole('reader', 'viewer')).toBe('viewer');
    });
  });
});
