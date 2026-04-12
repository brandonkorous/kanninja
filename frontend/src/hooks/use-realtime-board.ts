'use client';

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useUser } from '@clerk/nextjs';
import { supabase } from '@/lib/supabase-client';

export interface PresenceUser {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
}

export type RealtimeStatus = 'connecting' | 'live' | 'disconnected';

/**
 * Subscribe to a board's realtime channel for:
 * - Broadcast events (card/list mutations) — invalidates React Query
 * - Presence (who else is viewing) — the current user is tracked so others
 *   see them, but filtered out of the returned list so the UI doesn't show
 *   "you, looking at yourself"
 *
 * Also surfaces a connection status so the UI can quietly flag when the
 * channel has dropped. Happy path shows nothing; disconnected shows an
 * eyebrow so the user isn't lied to about being live.
 */
export function useRealtimeBoard(boardId: string) {
  const queryClient = useQueryClient();
  const { user } = useUser();
  const [presenceUsers, setPresenceUsers] = useState<PresenceUser[]>([]);
  const [status, setStatus] = useState<RealtimeStatus>('connecting');

  useEffect(() => {
    if (!boardId || !user) return;

    setStatus('connecting');

    const channel = supabase.channel(`board:${boardId}`, {
      config: { presence: { key: user.id } },
    });

    // Listen to broadcast events from backend mutations
    channel
      .on('broadcast', { event: 'card:created' }, () => {
        queryClient.invalidateQueries({ queryKey: ['boards', boardId] });
      })
      .on('broadcast', { event: 'card:updated' }, () => {
        queryClient.invalidateQueries({ queryKey: ['boards', boardId] });
      })
      .on('broadcast', { event: 'card:moved' }, () => {
        queryClient.invalidateQueries({ queryKey: ['boards', boardId] });
      })
      .on('broadcast', { event: 'card:deleted' }, () => {
        queryClient.invalidateQueries({ queryKey: ['boards', boardId] });
      })
      .on('broadcast', { event: 'list:changed' }, () => {
        queryClient.invalidateQueries({ queryKey: ['boards', boardId] });
      });

    // Presence — dedupe by userId (multi-tab, HMR, strict-mode remounts)
    // and drop the current user so the UI shows only "others in the dojo".
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<PresenceUser>();
        const byUserId = new Map<string, PresenceUser>();
        for (const presence of Object.values(state).flat()) {
          if (presence.userId === user.id) continue;
          if (!byUserId.has(presence.userId)) {
            byUserId.set(presence.userId, presence);
          }
        }
        setPresenceUsers(Array.from(byUserId.values()));
      })
      .subscribe((subscriptionStatus) => {
        if (subscriptionStatus === 'SUBSCRIBED') {
          setStatus('live');
          channel.track({
            userId: user.id,
            displayName: user.fullName ?? user.firstName ?? 'Anonymous',
            avatarUrl: user.imageUrl ?? null,
          });
        } else if (
          subscriptionStatus === 'TIMED_OUT' ||
          subscriptionStatus === 'CLOSED' ||
          subscriptionStatus === 'CHANNEL_ERROR'
        ) {
          setStatus('disconnected');
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [boardId, user, queryClient]);

  return { presenceUsers, status };
}
