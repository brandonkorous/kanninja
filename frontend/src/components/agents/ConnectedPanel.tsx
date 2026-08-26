'use client';

import { useOAuthGrants, useRevokeOAuthGrant } from '@/hooks/use-oauth-grants';
import type { OAuthGrant } from '@/hooks/use-oauth-grants';

const SCOPE_SHORT: Record<string, string> = {
    'read:boards': 'Read boards',
    'write:tasks': 'Edit tasks',
    'team:read': 'Read clans',
    'integrations:read': 'See integrations',
    // Legacy — granted nothing since built-in AI was removed. Still shown so
    // an older grant reads honestly instead of surfacing a raw scope string.
    'ai:capabilities': 'Unused (legacy)',
};

function formatScopes(scopes: string[]): string {
    return scopes.map((s) => SCOPE_SHORT[s] ?? s).join(' · ');
}

function formatAuthorized(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

function GrantRow({ grant }: { grant: OAuthGrant }) {
    const revoke = useRevokeOAuthGrant();
    return (
        <li className="border-t border-base-300 first:border-t-0 py-5 flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
                <p className="font-display text-lg font-medium tracking-tight">
                    {grant.client_name}
                </p>
                <p className="mt-1 text-xs font-mono text-base-content/50 uppercase tracking-wider">
                    {formatScopes(grant.scopes)}
                </p>
                <p className="mt-1 text-xs text-base-content/40">
                    Authorized {formatAuthorized(grant.authorized_at)}
                </p>
            </div>
            <button
                type="button"
                className="btn btn-outline btn-secondary btn-sm shrink-0 focus-visible:shadow-focus"
                onClick={() => revoke.mutate(grant.client_id)}
                disabled={revoke.isPending}
            >
                {revoke.isPending ? 'Disconnecting…' : 'Disconnect'}
            </button>
        </li>
    );
}

export function ConnectedPanel({ onConnect }: { onConnect: () => void }) {
    const { data: grants, isLoading, error, refetch, isFetching } = useOAuthGrants();

    return (
        <div className="bg-base-100 rounded-lg shadow-e1 p-8">
            <div className="flex items-baseline justify-between gap-4 flex-wrap">
                <h2 className="font-display text-2xl font-medium tracking-tight">
                    Who holds a key.
                </h2>
                <button
                    type="button"
                    className="btn btn-ghost btn-sm text-base-content/60 hover:text-primary"
                    onClick={() => refetch()}
                    disabled={isFetching}
                >
                    {isFetching ? 'Checking…' : 'Refresh'}
                </button>
            </div>
            <p className="mt-3 text-sm text-base-content/70 max-w-xl">
                Every agent you have approved, and what it can reach. Disconnect one
                and its tokens stop working on the next call.
            </p>

            <div className="mt-8">
                {isLoading && (
                    <p className="text-sm text-base-content/50">Looking for your agents…</p>
                )}

                {error && (
                    <p className="text-sm text-base-content/70">
                        We couldn&apos;t read your connections. Try refreshing.
                    </p>
                )}

                {grants && grants.length === 0 && (
                    <div className="py-4">
                        <p className="text-sm text-base-content/70">
                            No agent connected yet. Wire one up and it shows here.
                        </p>
                        <button
                            type="button"
                            onClick={onConnect}
                            className="mt-4 text-eyebrow font-mono uppercase tracking-widest text-primary hover:underline focus-visible:shadow-focus"
                        >
                            Connect an agent →
                        </button>
                    </div>
                )}

                {grants && grants.length > 0 && (
                    <ul>
                        {grants.map((grant) => (
                            <GrantRow key={grant.client_id} grant={grant} />
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
