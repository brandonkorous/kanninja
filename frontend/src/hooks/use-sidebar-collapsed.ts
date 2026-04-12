'use client';

import { useCallback, useEffect, useState } from 'react';

const KEY = 'kanninja:sidebar-collapsed';

// Persists the desktop sidebar collapsed/expanded preference to localStorage.
// Mirrors the next-themes pattern: server always renders the deterministic
// expanded default, then the client snaps to the persisted value after mount.
// The `mounted` flag lets the consumer suppress its width transition on the
// first paint so the snap doesn't animate.
export function useSidebarCollapsed() {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(KEY) === '1');
    } catch {
      // ignore — SSR, privacy mode, disabled storage, etc.
    }
    setMounted(true);
  }, []);

  const toggle = useCallback(() => {
    setCollapsed((c) => {
      const next = !c;
      try {
        window.localStorage.setItem(KEY, next ? '1' : '0');
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  return { collapsed, toggle, mounted };
}
