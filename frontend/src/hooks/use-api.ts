'use client';

import { useMemo } from 'react';
import { api } from '@/lib/api-client';

/**
 * The API client, for use in components.
 *
 * Authentication is the session cookie — `api-client.ts` sends
 * `credentials: 'include'` on every request and the cookie is scoped to the
 * shared parent domain, so there is no token to fetch and inject. This hook
 * now exists purely to keep call sites stable (and to give us one place to
 * hang per-request concerns later).
 */
export function useApi() {
  return useMemo(
    () => ({
      get: api.get,
      post: api.post,
      patch: api.patch,
      put: api.put,
      delete: api.delete,
    }),
    [],
  );
}
