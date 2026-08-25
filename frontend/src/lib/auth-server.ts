import 'server-only';
import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export interface ServerSessionUser {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
    emailVerified: boolean;
}

/**
 * Reads the session from the API, server-side.
 *
 * Better Auth runs on the backend, not in Next, so there is no local database
 * to consult — this forwards the request's cookies to `/api/auth/get-session`
 * and trusts the answer. That's one internal round trip per protected page
 * render, which is why the middleware does the cheap optimistic cookie check
 * first and only this call is authoritative.
 *
 * Returns null for any failure, including the API being down. A page that
 * can't confirm a session must treat the visitor as signed out.
 */
export async function getServerSession(): Promise<{ user: ServerSessionUser } | null> {
    const cookieHeader = (await cookies()).toString();
    if (!cookieHeader) return null;

    try {
        const response = await fetch(`${API_URL}/api/auth/get-session`, {
            headers: { cookie: cookieHeader },
            // Session state must never be cached across requests or users.
            cache: 'no-store',
        });

        if (!response.ok) return null;

        const session = (await response.json()) as { user?: ServerSessionUser } | null;
        return session?.user ? { user: session.user } : null;
    } catch {
        return null;
    }
}
