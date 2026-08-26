import { realtimeHub } from './realtime-hub.js';

/**
 * Broadcast realtime events to a board channel.
 *
 * Transport is now an in-process WebSocket hub (routes/realtime) rather than
 * Supabase Realtime. The public API and its contract are unchanged: every
 * method is best-effort and MUST NOT throw — a realtime failure must never
 * fail the mutation that triggered it.
 *
 * Still `async` so the ~20 call sites keep working untouched, even though the
 * hub is synchronous.
 */
export const realtimeService = {
  async broadcast(boardId: string, event: string, payload: Record<string, unknown>) {
    try {
      realtimeHub.publish(boardId, event, payload);
    } catch (err) {
      // Don't fail the request if broadcast fails — it's best-effort
      console.error('Realtime broadcast failed:', err);
    }
  },

  async cardCreated(boardId: string, cardId: string) {
    await this.broadcast(boardId, 'card:created', { cardId });
  },

  async cardUpdated(boardId: string, cardId: string) {
    await this.broadcast(boardId, 'card:updated', { cardId });
  },

  async cardMoved(boardId: string, cardId: string) {
    await this.broadcast(boardId, 'card:moved', { cardId });
  },

  async cardDeleted(boardId: string, cardId: string) {
    await this.broadcast(boardId, 'card:deleted', { cardId });
  },

  async listChanged(boardId: string) {
    await this.broadcast(boardId, 'list:changed', {});
  },
};
