import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { createTestApp } from '../../test/create-test-app.js';
import { boardRoutes } from './index.js';

// Mock auth middleware — the test app already injects profileId
vi.mock('../../middleware/require-auth.js', () => ({
  requireAuth: vi.fn(async () => {}),
}));

vi.mock('../../middleware/require-board-role.js', () => ({
  requireBoardRole: vi.fn(() => async () => {}),
}));

vi.mock('../../services/board.service.js', () => ({
  boardService: {
    listBoards: vi.fn(),
    getBoard: vi.fn(),
    createBoard: vi.fn(),
    updateBoard: vi.fn(),
    deleteBoard: vi.fn(),
  },
}));

import { boardService } from '../../services/board.service.js';

const mockService = vi.mocked(boardService);

let app: Awaited<ReturnType<typeof createTestApp>>;

beforeEach(async () => {
  vi.clearAllMocks();
  app = await createTestApp(async (fastify) => {
    await fastify.register(boardRoutes);
  });
});

afterAll(async () => {
  await app?.close();
});

describe('board routes', () => {
  describe('GET /api/v1/boards', () => {
    it('returns 200 with board list', async () => {
      const boards = [{ id: 'b1', title: 'Board 1' }];
      mockService.listBoards.mockResolvedValue(boards as any);

      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/boards',
      });

      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual({ data: boards });
      expect(mockService.listBoards).toHaveBeenCalledWith('test-user-1');
    });
  });

  describe('GET /api/v1/boards/:boardId', () => {
    it('returns 200 with board data', async () => {
      const board = { id: 'b1', title: 'Board 1', lists: [] };
      mockService.getBoard.mockResolvedValue(board as any);

      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/boards/b1',
      });

      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual({ data: board });
    });
  });

  describe('POST /api/v1/boards', () => {
    it('returns 201 with created board', async () => {
      const created = { id: 'b-new', title: 'New Board' };
      mockService.createBoard.mockResolvedValue(created as any);

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/boards',
        payload: { title: 'New Board' },
      });

      expect(res.statusCode).toBe(201);
      expect(res.json()).toEqual({ data: created });
    });

    it('returns 400 for missing title', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/boards',
        payload: {},
      });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('PATCH /api/v1/boards/:boardId', () => {
    it('returns 200 with updated board', async () => {
      const updated = { id: 'b1', title: 'Updated' };
      mockService.updateBoard.mockResolvedValue(updated as any);

      const res = await app.inject({
        method: 'PATCH',
        url: '/api/v1/boards/b1',
        payload: { title: 'Updated' },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual({ data: updated });
    });
  });

  describe('DELETE /api/v1/boards/:boardId', () => {
    it('returns 204 on success', async () => {
      mockService.deleteBoard.mockResolvedValue(undefined);

      const res = await app.inject({
        method: 'DELETE',
        url: '/api/v1/boards/b1',
      });

      expect(res.statusCode).toBe(204);
    });
  });
});
