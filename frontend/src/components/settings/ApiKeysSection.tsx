'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { useApiKeys } from '@/hooks/use-api-keys';
import { MCP_REMOTE_URL } from '@/lib/seo';
import { ApiKeyRow } from './ApiKeyRow';
import { CreateApiKeyModal } from './CreateApiKeyModal';

export function ApiKeysSection() {
  const { data: keys, isLoading, error, refetch, isFetching } = useApiKeys();
  const [modalOpen, setModalOpen] = useState(false);

  // Sort: active keys first, revoked at the end
  const sorted = keys
    ? [...keys].sort((a, b) => {
        if (a.revokedAt && !b.revokedAt) return 1;
        if (!a.revokedAt && b.revokedAt) return -1;
        return 0;
      })
    : [];

  return (
    <section className="bg-base-100 rounded-lg shadow-e1 p-8">
      <p className="text-eyebrow font-mono uppercase tracking-widest text-primary">
        API Keys
      </p>
      <h2 className="mt-4 font-display text-2xl font-medium tracking-tight">
        Connect your <span className="italic text-primary">agents.</span>
      </h2>
      <p className="mt-3 text-sm text-base-content/60 max-w-lg">
        API keys connect terminal MCP clients — Claude Code, Cursor, Windsurf —
        to your boards. Each key is scoped to your account. For Claude.ai or
        ChatGPT, add the connector URL{' '}
        <code className="font-mono text-primary break-all">{MCP_REMOTE_URL}</code>{' '}
        instead — no key required.
      </p>

      {isLoading && (
        <p
          role="status"
          aria-live="polite"
          className="mt-8 text-eyebrow font-mono uppercase tracking-widest text-base-content/60"
        >
          Loading your keys…
        </p>
      )}

      {error && (
        <div role="alert" className="mt-8">
          <p className="text-eyebrow font-mono uppercase tracking-widest text-error">
            Something on our end
          </p>
          <h3 className="mt-3 font-display text-xl font-medium tracking-tight">
            We couldn&rsquo;t load your API keys.
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

      {keys && !error && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-mono text-base-content/50 uppercase tracking-wider">
              {keys.length} key{keys.length !== 1 ? 's' : ''}
            </p>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setModalOpen(true)}
            >
              <FontAwesomeIcon icon={faPlus} aria-hidden="true" className="mr-2" />
              Create key
            </button>
          </div>

          {sorted.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-base-content/50">
                No API keys yet. Create one to connect an MCP client.
              </p>
            </div>
          ) : (
            <ul>
              {sorted.map((k) => (
                <ApiKeyRow key={k.id} apiKey={k} />
              ))}
            </ul>
          )}
        </div>
      )}

      <CreateApiKeyModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </section>
  );
}
