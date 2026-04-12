import type { ApiError } from '@kanninja/shared';

export class McpApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly apiError: ApiError,
  ) {
    super(apiError.message);
    this.name = 'McpApiError';
  }
}

let _apiKey: string;
let _apiUrl: string;

export function initApiClient(apiKey: string, apiUrl: string) {
  _apiKey = apiKey;
  _apiUrl = apiUrl;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${_apiKey}`,
  };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${_apiUrl}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => ({
      code: 'INTERNAL_ERROR',
      message: `Request failed with status ${response.status}`,
    }))) as ApiError;
    throw new McpApiError(response.status, error);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const callApi = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};
