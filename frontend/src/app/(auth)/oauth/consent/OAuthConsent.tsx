'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import {
  useAuthorizationRequest,
  useConsent,
} from '@/hooks/use-oauth-consent';

const SCOPE_LABELS: Record<string, { title: string; detail: string }> = {
  'read:boards': {
    title: 'Read your dojos and katas.',
    detail: 'See boards, columns, and tasks you can already see in kanNINJA.',
  },
  'write:tasks': {
    title: 'Create, update, and move katas.',
    detail: 'Add, edit, complete, assign, comment — everything you can do on a board.',
  },
  'ai:capabilities': {
    title: 'Use AI features on your behalf.',
    detail: 'Drafting, summarising, suggesting next steps. Pro plan and up.',
  },
  'team:read': {
    title: 'Read your clan members and roles.',
    detail: 'Who is in which clan and what they can do. Team plan and up.',
  },
  'integrations:read': {
    title: 'See your connected integrations.',
    detail: 'Read-only view of which external services you have connected.',
  },
};

export function OAuthConsent() {
  const params = useSearchParams();
  const { isLoaded } = useAuth();
  const reqId = params.get('req_id');
  const [error, setError] = useState<string | null>(null);

  const requestQuery = useAuthorizationRequest(reqId);
  const consent = useConsent(reqId ?? '');

  if (!reqId) {
    return (
      <Missing message="No authorization request ID was provided." />
    );
  }
  if (!isLoaded || requestQuery.isPending) {
    return (
      <p
        role="status"
        aria-live="polite"
        className="text-eyebrow font-mono uppercase tracking-widest text-base-content/40"
      >
        Looking up the request…
      </p>
    );
  }
  if (requestQuery.isError || !requestQuery.data) {
    return (
      <Missing message="That request expired or was already used. Try again from your agent." />
    );
  }

  const data = requestQuery.data;

  async function decide(action: 'allow' | 'deny') {
    setError(null);
    try {
      const url = await consent.mutateAsync(action);
      window.location.href = url;
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div>
      <p className="hanko-eyebrow text-eyebrow font-mono uppercase tracking-widest text-primary">
        Authorize agent
      </p>
      <h1 className="mt-8 font-display text-4xl md:text-5xl font-medium tracking-tight">
        <span className="text-base-content">{data.client.client_name}</span>{' '}
        <span className="italic text-primary">wants in.</span>
      </h1>
      <p className="mt-8 text-base leading-relaxed text-base-content/70">
        It's asking to act on your kanNINJA account from inside your agent.
        Same access you have. Nothing else.
      </p>

      <ul className="mt-12 space-y-6 max-w-md">
        {data.scopes.map((s) => {
          const label = SCOPE_LABELS[s] ?? {
            title: s,
            detail: '',
          };
          return (
            <li key={s} className="border-l-2 border-primary/30 pl-5">
              <p className="font-display text-lg font-medium tracking-tight">
                {label.title}
              </p>
              {label.detail && (
                <p className="mt-1 text-sm text-base-content/60">{label.detail}</p>
              )}
            </li>
          );
        })}
      </ul>

      <p className="mt-12 max-w-md text-sm text-base-content/50 italic">
        You can revoke access from settings any time. The agent immediately
        loses the ability to read or change anything.
      </p>

      {error && (
        <p
          role="alert"
          className="mt-8 text-sm text-error border-l-2 border-error pl-4 max-w-md"
        >
          {error}
        </p>
      )}

      <div className="mt-12 flex flex-wrap gap-4">
        <button
          type="button"
          onClick={() => decide('allow')}
          disabled={consent.isPending}
          className="btn btn-primary focus-visible:shadow-focus"
        >
          {consent.isPending ? 'Returning to your agent…' : 'Allow'}
        </button>
        <button
          type="button"
          onClick={() => decide('deny')}
          disabled={consent.isPending}
          className="btn btn-outline btn-secondary focus-visible:shadow-focus"
        >
          Deny
        </button>
      </div>
    </div>
  );
}

function Missing({ message }: { message: string }) {
  return (
    <div>
      <p className="hanko-eyebrow text-eyebrow font-mono uppercase tracking-widest text-primary">
        Authorize agent
      </p>
      <h1 className="mt-8 font-display text-4xl md:text-5xl font-medium tracking-tight">
        We couldn't <span className="italic text-primary">find it.</span>
      </h1>
      <p className="mt-8 text-base leading-relaxed text-base-content/70">
        {message}
      </p>
      <Link href="/" className="btn btn-outline btn-secondary mt-12">
        Back home
      </Link>
    </div>
  );
}
