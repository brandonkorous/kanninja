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
    /** Sent verbatim, bypassing JSON serialisation. For file uploads. */
    rawBody?: BodyInit;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { body, rawBody, ...init } = options;
    const hasBody = body !== undefined;

    const headers: Record<string, string> = {
        ...(init.headers as Record<string, string>),
    };

    if (hasBody && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_URL}${path}`, {
        ...init,
        headers,
        // The API is on a different origin (api.kanninja.com vs kanninja.com),
        // so the Better Auth session cookie only rides along with an explicit
        // credentials mode. Without this every request is anonymous.
        credentials: 'include',
        body: rawBody ?? (hasBody ? JSON.stringify(body) : undefined),
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
    get: <T>(path: string) => request<T>(path, { method: 'GET' }),

    post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),

    patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),

    put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),

    delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),

    /**
     * POSTs raw bytes with the file's own content type.
     *
     * `request` JSON-stringifies whatever it is handed, which turns a Blob
     * into the string "[object Object]". Image uploads send the bytes
     * themselves, so they need their own path through fetch.
     */
    postBinary: <T>(path: string, file: Blob) =>
        request<T>(path, {
            method: 'POST',
            headers: { 'Content-Type': file.type },
            rawBody: file,
        }),
};
