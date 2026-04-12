'use client';

import { useState, useRef, useEffect, useId } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy, faCheck, faKey } from '@fortawesome/free-solid-svg-icons';
import { Field, Input } from '@/components/ui';
import { useCreateApiKey } from '@/hooks/use-api-keys';

function buildMcpConfig(key: string): string {
  return JSON.stringify(
    {
      mcpServers: {
        kanninja: {
          command: 'npx',
          args: ['-y', '@kanninja/mcp'],
          env: { KANNINJA_API_KEY: key },
        },
      },
    },
    null,
    2,
  );
}

interface CreateApiKeyModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateApiKeyModal({ open, onClose }: CreateApiKeyModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const create = useCreateApiKey();
  const [name, setName] = useState('');
  const [fullKey, setFullKey] = useState<string | null>(null);
  const [copied, setCopied] = useState<'key' | 'config' | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  const handleClose = () => {
    setName('');
    setFullKey(null);
    setCopied(false);
    onClose();
  };

  const handleCreate = async () => {
    const result = await create.mutateAsync(name.trim());
    setFullKey(result.fullKey);
  };

  const copyText = async (text: string, label: 'key' | 'config') => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      aria-labelledby={titleId}
      onClose={handleClose}
      onCancel={(e) => { if (create.isPending) e.preventDefault(); }}
    >
      <div className="modal-box">
        <p className="text-eyebrow font-mono uppercase tracking-widest text-primary">
          New API key
        </p>
        <h3 id={titleId} className="font-display text-2xl font-semibold leading-tight mt-2">
          {fullKey ? 'Key created.' : 'Name your key.'}
        </h3>

        {!fullKey ? (
          <div className="mt-6 space-y-6">
            <Field label="Display name" htmlFor="key-name" hint='e.g. "Claude Code — laptop"'>
              <Input
                id="key-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="What is this key for?"
                maxLength={100}
                autoFocus
              />
            </Field>
            <div className="modal-action flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" className="btn btn-ghost" onClick={handleClose} disabled={create.isPending}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCreate}
                disabled={!name.trim() || create.isPending}
              >
                <FontAwesomeIcon icon={faKey} aria-hidden="true" className="mr-2" />
                {create.isPending ? 'Creating…' : 'Create key'}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-5">
            {/* Key */}
            <div>
              <p className="text-xs font-mono text-base-content/50 uppercase tracking-wider mb-2">
                Your key
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-base-200 rounded-md px-4 py-3 font-mono text-xs break-all select-all">
                  {fullKey}
                </code>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm shrink-0"
                  onClick={() => copyText(fullKey!, 'key')}
                >
                  <FontAwesomeIcon icon={copied === 'key' ? faCheck : faCopy} />
                </button>
              </div>
              <p className="text-xs text-warning mt-2">
                Save this now — it won&rsquo;t be shown again.
              </p>
            </div>

            {/* Setup instructions */}
            <div>
              <p className="text-xs font-mono text-base-content/50 uppercase tracking-wider mb-2">
                Add to your MCP client
              </p>
              <p className="text-xs text-base-content/60 mb-3">
                Paste this into your Claude Code, Cursor, or Windsurf MCP config:
              </p>
              <div className="relative">
                <pre className="bg-base-200 rounded-md px-4 py-3 font-mono text-xs overflow-x-auto whitespace-pre">
                  {buildMcpConfig(fullKey!)}
                </pre>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs absolute top-2 right-2"
                  onClick={() => copyText(buildMcpConfig(fullKey!), 'config')}
                >
                  <FontAwesomeIcon icon={copied === 'config' ? faCheck : faCopy} />
                </button>
              </div>
            </div>

            <div className="modal-action">
              <button type="button" className="btn btn-ghost" onClick={handleClose}>
                Done
              </button>
            </div>
          </div>
        )}
      </div>

      <form method="dialog" className="modal-backdrop">
        <button type="submit" aria-label="Close" disabled={create.isPending}>close</button>
      </form>
    </dialog>
  );
}
