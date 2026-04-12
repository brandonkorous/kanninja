import { supabase } from '../config/supabase.js';

/**
 * Broadcast realtime events to a board channel.
 * Frontend subscribes via Supabase Realtime broadcast channel and invalidates React Query caches.
 */
export const realtimeService = {
  async broadcast(boardId: string, event: string, payload: Record<string, unknown>) {
    try {
      const channel = supabase.channel(`board:${boardId}`);
      await channel.send({
        type: 'broadcast',
        event,
        payload,
      });
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
