import { NextResponse, type NextRequest } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

// Protected routes are explicit. Anything not listed here is public —
// marketing pages, sign-in/up, invites, and webhooks all stay open by
// default. Add a route here when it ships under (app).
const PROTECTED_PREFIXES = [
    '/dashboard',
    '/dojo',
    '/clans',
    '/agents',
    '/templates',
    '/analytics',
    '/notifications',
    '/profile',
    '/settings',
    '/integrations',
    '/oauth/consent',
];

/**
 * This is an *optimistic* gate: it only checks that a session cookie is
 * present, never that it's valid. Middleware runs on the edge with no access
 * to the API's database, and calling the backend on every navigation would put
 * a network round trip in front of every page.
 *
 * The authoritative check is server-side in `app/(app)/layout.tsx`, and every
 * API route re-verifies independently. A forged cookie gets past this
 * redirect and precisely no further.
 */
export default function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const isProtected = PROTECTED_PREFIXES.some(
        (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );
    if (!isProtected) return NextResponse.next();

    const sessionCookie = getSessionCookie(request);
    if (sessionCookie) return NextResponse.next();

    const signInUrl = new URL('/sign-in', request.url);
    // Preserve where they were headed so sign-in can return them there.
    signInUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(signInUrl);
}

export const config = {
    matcher: [
        // Skip Next.js internals and static files
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};
