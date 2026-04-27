'use client';

import { useCallback, useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';

// Per-device, per-user pinned briefing highlights. Highlights are
// inherently ephemeral — every briefing run regenerates them — so
// localStorage is the right shape for "remember this until I unpin
// it or pin something newer." If cross-device sync becomes a need,
// promote to a `pinned_highlights` table.

export interface PinnedHighlight {
    id: string;
    text: string;
    pinnedAt: string;
}

const MAX_PINS = 5;

function storageKey(userId: string | undefined) {
    return userId ? `kn:pinned-highlights:${userId}` : null;
}

function readStorage(key: string | null): PinnedHighlight[] {
    if (!key || typeof window === 'undefined') return [];
    try {
        const raw = window.localStorage.getItem(key);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? (parsed as PinnedHighlight[]) : [];
    } catch {
        return [];
    }
}

export function usePinnedHighlights() {
    const { user } = useUser();
    const key = storageKey(user?.id);
    const [pins, setPins] = useState<PinnedHighlight[]>([]);

    // Hydrate on mount + when user changes. SSR-safe: empty initial state
    // matches server render, then we read from localStorage in effect.
    useEffect(() => {
        setPins(readStorage(key));
    }, [key]);

    // Cross-tab sync. If a second tab pins or unpins, keep this tab honest.
    useEffect(() => {
        if (!key || typeof window === 'undefined') return;
        const onStorage = (e: StorageEvent) => {
            if (e.key === key) setPins(readStorage(key));
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, [key]);

    const persist = useCallback(
        (next: PinnedHighlight[]) => {
            if (!key || typeof window === 'undefined') return;
            window.localStorage.setItem(key, JSON.stringify(next));
            setPins(next);
        },
        [key],
    );

    const pin = useCallback(
        (text: string) => {
            const trimmed = text.trim();
            if (!trimmed) return;
            const exists = pins.some((p) => p.text === trimmed);
            if (exists) return;
            const next: PinnedHighlight = {
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                text: trimmed,
                pinnedAt: new Date().toISOString(),
            };
            // Newest first; cap at MAX_PINS so the dashboard widget can't
            // grow unbounded.
            persist([next, ...pins].slice(0, MAX_PINS));
        },
        [pins, persist],
    );

    const unpin = useCallback(
        (id: string) => {
            persist(pins.filter((p) => p.id !== id));
        },
        [pins, persist],
    );

    const isPinned = useCallback(
        (text: string) => pins.some((p) => p.text === text.trim()),
        [pins],
    );

    return { pins, pin, unpin, isPinned, max: MAX_PINS };
}
