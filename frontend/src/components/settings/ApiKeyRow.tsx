'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useRevokeApiKey } from '@/hooks/use-api-keys';
import type { ApiKey } from '@kanninja/shared';

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function ApiKeyRow({ apiKey }: { apiKey: ApiKey }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const revoke = useRevokeApiKey();
  const isRevoked = !!apiKey.revokedAt;

  return (
    <li
      className={`flex items-center gap-4 py-5 border-b border-base-300 last:border-b-0 ${
        isRevoked ? 'opacity-50' : ''
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <code className="text-xs font-mono bg-base-200 px-2 py-0.5 rounded">
            {apiKey.keyPrefix}••••
          </code>
          {isRevoked && (
            <span className="badge badge-error badge-sm badge-outline">Revoked</span>
          )}
        </div>
        <p className="text-sm font-medium mt-1">{apiKey.displayName}</p>
      </div>

      <div className="text-right shrink-0">
        <p className="text-xs text-base-content/50 font-mono">
          {isRevoked ? 'Revoked' : `Used ${timeAgo(apiKey.lastUsedAt)}`}
        </p>
        <p className="text-xs text-base-content/40 font-mono mt-0.5">
          Created {new Date(apiKey.createdAt).toLocaleDateString()}
        </p>
      </div>

      {!isRevoked && (
        <>
          <button
            type="button"
            className="btn btn-ghost btn-xs text-base-content/40 hover:text-error"
            onClick={() => setConfirmOpen(true)}
            aria-label={`Revoke key ${apiKey.displayName}`}
          >
            <FontAwesomeIcon icon={faTrash} />
          </button>

          <ConfirmDialog
            open={confirmOpen}
            onCancel={() => setConfirmOpen(false)}
            onConfirm={() => revoke.mutate(apiKey.id, { onSuccess: () => setConfirmOpen(false) })}
            eyebrow="Revoke key"
            title={`Revoke "${apiKey.displayName}"?`}
            body="Any agent using this key will immediately lose access. This cannot be undone."
            confirmLabel="Revoke"
            isConfirming={revoke.isPending}
          />
        </>
      )}
    </li>
  );
}
