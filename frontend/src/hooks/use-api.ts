'use client';

import { useAuth } from '@clerk/nextjs';
import { useCallback } from 'react';
import { api } from '@/lib/api-client';

/**
 * Hook that wraps the API client with automatic Clerk token injection.
 * Use this in components instead of importing `api` directly.
 */
export function useApi() {
  const { getToken } = useAuth();

  const get = useCallback(
    async <T>(path: string) => {
      const token = await getToken();
      return api.get<T>(path, token);
    },
    [getToken],
  );

  const post = useCallback(
    async <T>(path: string, body?: unknown) => {
      const token = await getToken();
      return api.post<T>(path, body, token);
    },
    [getToken],
  );

  const patch = useCallback(
    async <T>(path: string, body?: unknown) => {
      const token = await getToken();
      return api.patch<T>(path, body, token);
    },
    [getToken],
  );

  const put = useCallback(
    async <T>(path: string, body?: unknown) => {
      const token = await getToken();
      return api.put<T>(path, body, token);
    },
    [getToken],
  );

  const del = useCallback(
    async <T>(path: string) => {
      const token = await getToken();
      return api.delete<T>(path, token);
    },
    [getToken],
  );

  return { get, post, patch, put, delete: del };
}
