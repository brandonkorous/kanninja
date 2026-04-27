import { env } from './config/env.js';

/**
 * Service-to-service client for hitting backend's internal /api/v1/oauth/*
 * endpoints. All calls authenticate with MCP_S2S_TOKEN — the backend rejects
 * anything else.
 */
export async function s2sCall<T>(
  path: string,
  init?: { method?: string; body?: unknown },
): Promise<{ ok: true; data: T } | { ok: false; status: number; error: unknown }> {
  const response = await fetch(`${env.KANNINJA_API_URL}${path}`, {
    method: init?.method ?? 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.MCP_S2S_TOKEN}`,
    },
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    return { ok: false, status: response.status, error };
  }
  if (response.status === 204) return { ok: true, data: undefined as T };
  return { ok: true, data: (await response.json()) as T };
}
