'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from '@/lib/auth-client';
import { useApi } from '@/hooks/use-api';

// Clans are the only thing users get invited to. Boards are reached
// transitively — accept the clan invite, then visit the boards the
// clan can access. The previous dual-kind branching collapses to one
// path now that board invitations have been removed from the backend.

type ClanInvitation = {
    kind: 'clan';
    clanId: string;
    clanName: string;
    role: string;
};

export default function InvitePage() {
    const params = useParams();
    const router = useRouter();
    const token = params.token as string;
    const { data: session, isPending: sessionPending } = useSession();
    const isSignedIn = Boolean(session);
    const api = useApi();
    const [invitation, setInvitation] = useState<ClanInvitation | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [accepting, setAccepting] = useState(false);

    useEffect(() => {
        api
            .get<{ data: ClanInvitation }>(`/api/v1/clan-invitations/${token}`)
            .then((r) => setInvitation(r.data))
            .catch((e: Error) => setError(e.message))
            .finally(() => setLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    async function handleAccept() {
        if (!invitation) return;
        setError(null);
        setAccepting(true);
        try {
            await api.post(`/api/v1/clan-invitations/${token}/accept`);
            router.push(`/clans/${invitation.clanId}`);
        } catch (e) {
            setError((e as Error).message);
            setAccepting(false);
        }
    }

    if (loading || sessionPending) {
        return (
            <p
                role="status"
                aria-live="polite"
                className="text-eyebrow font-mono uppercase tracking-widest text-base-content/40"
            >
                Looking up the invitation…
            </p>
        );
    }

    if (error && !invitation) {
        return (
            <div>
                <p className="hanko-eyebrow text-eyebrow font-mono uppercase tracking-widest text-primary">
                    Invitation
                </p>
                <h1 className="mt-8 font-display text-4xl md:text-5xl font-medium tracking-tight">
                    We couldn't <span className="italic text-primary">find it.</span>
                </h1>
                <p className="mt-8 text-base leading-relaxed text-base-content/70">
                    {error}
                </p>
                <Link href="/" className="btn btn-outline btn-secondary mt-12">
                    Back home
                </Link>
            </div>
        );
    }

    return (
        <div>
            <p className="hanko-eyebrow text-eyebrow font-mono uppercase tracking-widest text-primary">
                Clan invitation
            </p>
            <h1 className="mt-8 font-display text-4xl md:text-5xl font-medium tracking-tight">
                Join the <span className="italic text-primary">clan.</span>
            </h1>
            <p className="mt-8 text-base leading-relaxed text-base-content/70">
                You've been invited to{' '}
                <strong className="text-base-content">{invitation?.clanName}</strong> as{' '}
                <strong className="text-base-content">{invitation?.role}</strong>.
            </p>

            {error && (
                <p
                    role="alert"
                    className="mt-8 text-sm text-error border-l-2 border-error pl-4"
                >
                    {error}
                </p>
            )}

            {!isSignedIn ? (
                <div className="mt-12 space-y-4">
                    <p className="text-sm text-base-content/60">
                        Sign in or start a kata to accept.
                    </p>
                    <div className="flex flex-wrap gap-4">
                        <Link
                            href={`/sign-in?redirect_url=/invite/${token}`}
                            className="btn btn-primary"
                        >
                            Sign in
                        </Link>
                        <Link
                            href={`/sign-up?redirect_url=/invite/${token}`}
                            className="btn btn-outline btn-secondary"
                        >
                            Start a kata
                        </Link>
                    </div>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={handleAccept}
                    disabled={accepting}
                    className="btn btn-primary mt-12"
                >
                    {accepting ? 'Joining…' : 'Accept and enter'}
                </button>
            )}
        </div>
    );
}
