import type { ApiError } from '@kanninja/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export class ApiClientError extends Error {
    constructor(
        public readonly status: number,
        public readonly apiError: ApiError,
    ) {
        super(apiError.message);
        this.name = 'ApiClientError';
    }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
    body?: unknown;
    token?: string | null;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { body, token, ...init } = options;
    const hasBody = body !== undefined;

    const headers: Record<string, string> = {
        ...(init.headers as Record<string, string>),
    };

    if (hasBody && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${path}`, {
        ...init,
        headers,
        body: hasBody ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
        const error = (await response.json().catch(() => ({
            code: 'INTERNAL_ERROR',
            message: `Request failed with status ${response.status}`,
        }))) as ApiError;
        throw new ApiClientError(response.status, error);
    }

    if (response.status === 204) {
        return undefined as T;
    }

    return response.json() as Promise<T>;
}

export const api = {
    get: <T>(path: string, token?: string | null) => request<T>(path, { method: 'GET', token }),

    post: <T>(path: string, body?: unknown, token?: string | null) =>
        request<T>(path, { method: 'POST', body, token }),

    patch: <T>(path: string, body?: unknown, token?: string | null) =>
        request<T>(path, { method: 'PATCH', body, token }),

    put: <T>(path: string, body?: unknown, token?: string | null) =>
        request<T>(path, { method: 'PUT', body, token }),

    delete: <T>(path: string, token?: string | null) =>
        request<T>(path, { method: 'DELETE', token }),
};
