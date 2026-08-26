'use client';

import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/lib/auth-client';
import { api } from '@/lib/api-client';

export interface PresenceUser {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
}

export type RealtimeStatus = 'connecting' | 'live' | 'disconnected';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const PING_INTERVAL_MS = 25_000;
const MAX_RECONNECT_DELAY_MS = 30_000;

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
 *
 * Transport is a WebSocket to our own API (was Supabase Realtime). A browser
 * can't set headers on a WS handshake, so the connection is authorised by a
 * short-lived ticket fetched over normal authenticated HTTP first.
 */
export function useRealtimeBoard(boardId: string) {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const user = session?.user;
  const [presenceUsers, setPresenceUsers] = useState<PresenceUser[]>([]);
  const [status, setStatus] = useState<RealtimeStatus>('connecting');

  // Kept in refs so the reconnect loop doesn't re-run the whole effect.
  const socketRef = useRef<WebSocket | null>(null);
  const attemptRef = useRef(0);

  useEffect(() => {
    if (!boardId || !user) return;

    let cancelled = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    let pingTimer: ReturnType<typeof setInterval> | undefined;

    // Both the board cache (for kanban) and the scheduled-cards cache (for
    // calendar/timeline/list views) are invalidated — same key family across
    // all view types so a single broadcast updates every surface watching
    // this board's data, including clan-level views open in another tab.
    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: ['boards', boardId] });
      queryClient.invalidateQueries({ queryKey: ['scheduled-cards'] });
    };

    async function connect() {
      if (cancelled) return;
      setStatus(attemptRef.current === 0 ? 'connecting' : 'disconnected');

      let ticket: string;
      try {
        const res = await api.post<{ data: { ticket: string } }>(
          `/api/v1/boards/${boardId}/realtime-ticket`,
        );
        ticket = res.data.ticket;
      } catch {
        scheduleReconnect();
        return;
      }
      if (cancelled) return;

      const wsUrl = new URL('/api/v1/realtime', API_URL);
      wsUrl.protocol = wsUrl.protocol === 'https:' ? 'wss:' : 'ws:';
      wsUrl.searchParams.set('ticket', ticket);

      const socket = new WebSocket(wsUrl.toString());
      socketRef.current = socket;

      socket.onopen = () => {
        if (cancelled) return;
        attemptRef.current = 0;
        setStatus('live');
        pingTimer = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) socket.send('ping');
        }, PING_INTERVAL_MS);
      };

      socket.onmessage = (message) => {
        if (message.data === 'pong') return;
        let parsed: { type?: string; users?: PresenceUser[] };
        try {
          parsed = JSON.parse(message.data as string);
        } catch {
          return;
        }

        if (parsed.type === 'presence') {
          // Drop the current user so the UI shows only "others in the dojo".
          setPresenceUsers((parsed.users ?? []).filter((p) => p.userId !== user!.id));
        } else if (parsed.type === 'event') {
          invalidate();
        }
      };

      socket.onclose = () => {
        if (pingTimer) clearInterval(pingTimer);
        if (cancelled) return;
        setStatus('disconnected');
        setPresenceUsers([]);
        scheduleReconnect();
      };

      // `onclose` always follows `onerror`, so reconnect is handled there.
      socket.onerror = () => socket.close();
    }

    function scheduleReconnect() {
      if (cancelled) return;
      // Exponential backoff with jitter — without the jitter, a pod restart
      // reconnects every client in the same instant.
      const delay = Math.min(1000 * 2 ** attemptRef.current, MAX_RECONNECT_DELAY_MS);
      attemptRef.current += 1;
      reconnectTimer = setTimeout(connect, delay + Math.random() * 1000);
    }

    void connect();

    return () => {
      cancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (pingTimer) clearInterval(pingTimer);
      socketRef.current?.close();
      socketRef.current = null;
      attemptRef.current = 0;
    };
  }, [boardId, user, queryClient]);

  return { presenceUsers, status };
}
