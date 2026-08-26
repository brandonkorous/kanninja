'use client';

import { useSession } from '@/lib/auth-client';

/**
 * Drop-in replacements for Clerk's <SignedIn> / <SignedOut>.
 *
 * Both render nothing while the session is still loading, rather than
 * flashing the signed-out state and then swapping. On the marketing header
 * that flash reads as a bug — the nav visibly changing under you a beat after
 * the page paints.
 */

export function SignedIn({ children }: { children: React.ReactNode }) {
    const { data: session, isPending } = useSession();
    if (isPending || !session) return null;
    return <>{children}</>;
}

export function SignedOut({ children }: { children: React.ReactNode }) {
    const { data: session, isPending } = useSession();
    if (isPending || session) return null;
    return <>{children}</>;
}
