'use client';

import { useOAuthGrants, useRevokeOAuthGrant } from '@/hooks/use-oauth-grants';
import type { OAuthGrant } from '@/hooks/use-oauth-grants';

const SCOPE_SHORT: Record<string, string> = {
  'read:boards': 'Read boards',
  'write:tasks': 'Edit tasks',
  'ai:capabilities': 'Unused (legacy)',
  'team:read': 'Read clans',
  'integrations:read': 'See integrations',
};

function formatScopes(scopes: string[]): string {
  return scopes.map((s) => SCOPE_SHORT[s] ?? s).join(' · ');
}

function formatAuthorized(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
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
        className="btn btn-outline btn-sm shrink-0 focus-visible:shadow-focus"
        onClick={() => revoke.mutate(grant.client_id)}
        disabled={revoke.isPending}
      >
        {revoke.isPending ? 'Disconnecting…' : 'Disconnect'}
      </button>
    </li>
  );
}

export function ConnectedAgentsSection() {
  const { data: grants, isLoading, error, refetch, isFetching } = useOAuthGrants();

  return (
    <section className="bg-base-100 rounded-lg shadow-e1 p-8">
      <p className="text-eyebrow font-mono uppercase tracking-widest text-primary">
        Connected agents
      </p>
      <h2 className="mt-4 font-display text-2xl font-medium tracking-tight">
        Agents in your{' '}
        <span className="italic text-primary">dojo.</span>
      </h2>
      <p className="mt-3 text-sm text-base-content/60 max-w-lg">
        Apps you authorized — Claude, ChatGPT, anything else — to act on your
        kanNINJA account. Disconnect to immediately revoke access.
      </p>

      {isLoading && (
        <p
          role="status"
          aria-live="polite"
          className="mt-8 text-eyebrow font-mono uppercase tracking-widest text-base-content/60"
        >
          Looking up your agents…
        </p>
      )}

      {error && (
        <div role="alert" className="mt-8">
          <p className="text-eyebrow font-mono uppercase tracking-widest text-error">
            Something on our end
          </p>
          <h3 className="mt-3 font-display text-xl font-medium tracking-tight">
            We couldn&rsquo;t load your connected agents.
          </h3>
          <p className="mt-3 text-sm text-base-content/70">
            {error.message || 'Try again in a moment.'}
          </p>
          <button
            type="button"
            className="btn btn-secondary mt-4"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            {isFetching ? 'Trying…' : 'Try again'}
          </button>
        </div>
      )}

      {grants && !error && (
        <div className="mt-8">
          {grants.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-base-content/50">
                No agents connected yet. Authorize one from inside ChatGPT or Claude.
              </p>
            </div>
          ) : (
            <ul>
              {grants.map((g) => (
                <GrantRow key={g.client_id} grant={g} />
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
