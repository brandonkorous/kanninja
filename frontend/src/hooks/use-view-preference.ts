'use client';

import { useCallback, useEffect, useState } from 'react';

export type DojoView = 'board' | 'calendar' | 'timeline' | 'list';
export type ClanView = 'calendar' | 'timeline' | 'list';

const STORAGE_KEY = 'kanninja:last-view';

interface Stored {
  dojo?: Record<string, DojoView>;
  clan?: Record<string, ClanView>;
}

function read(): Stored {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Stored) : {};
  } catch {
    return {};
  }
}

function write(value: Stored): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Quota exceeded / private mode — non-fatal, the redirect just
    // falls back to the default view next time.
  }
}

/**
 * Per-dojo last-used view, persisted to localStorage. Used by the
 * `/dojo/[dojoId]` redirect page to land the user back on the same
 * view they were last on, instead of always bouncing to /board.
 *
 * Keep this lightweight — it's not synced across devices, and it
 * doesn't need to be. A cross-device preference would belong on
 * the user profile.
 */
export function useDojoView(boardId: string): {
  view: DojoView | null;
  setView: (view: DojoView) => void;
} {
  const [view, setViewState] = useState<DojoView | null>(null);

  useEffect(() => {
    setViewState(read().dojo?.[boardId] ?? null);
  }, [boardId]);

  const setView = useCallback(
    (next: DojoView) => {
      const current = read();
      write({ ...current, dojo: { ...current.dojo, [boardId]: next } });
      setViewState(next);
    },
    [boardId],
  );

  return { view, setView };
}

export function useClanView(clanId: string): {
  view: ClanView | null;
  setView: (view: ClanView) => void;
} {
  const [view, setViewState] = useState<ClanView | null>(null);

  useEffect(() => {
    setViewState(read().clan?.[clanId] ?? null);
  }, [clanId]);

  const setView = useCallback(
    (next: ClanView) => {
      const current = read();
      write({ ...current, clan: { ...current.clan, [clanId]: next } });
      setViewState(next);
    },
    [clanId],
  );

  return { view, setView };
}
