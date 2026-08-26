'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy, faCheck } from '@fortawesome/free-solid-svg-icons';
import { MCP_REMOTE_URL } from '@/lib/seo';

type Method = 'remote' | 'stdio';

const REMOTE_SNIPPET = `{
  "mcpServers": {
    "kanninja": {
      "url": "${MCP_REMOTE_URL}"
    }
  }
}`;

const STDIO_SNIPPET = `{
  "mcpServers": {
    "kanninja": {
      "command": "npx",
      "args": ["-y", "kanninja-mcp"],
      "env": { "KANNINJA_API_KEY": "ninja_live_..." }
    }
  }
}`;

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    return (
        <button
            type="button"
            className="btn btn-ghost btn-sm text-base-content/60 hover:text-primary"
            onClick={async () => {
                await navigator.clipboard.writeText(text);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }}
        >
            <FontAwesomeIcon icon={copied ? faCheck : faCopy} aria-hidden="true" />
            <span className="ml-1.5">{copied ? 'Copied' : 'Copy'}</span>
        </button>
    );
}

export function ConnectPanel() {
    const [method, setMethod] = useState<Method>('remote');
    const snippet = method === 'remote' ? REMOTE_SNIPPET : STDIO_SNIPPET;

    return (
        <div className="bg-base-100 rounded-lg shadow-e1 p-8">
            <h2 className="font-display text-2xl font-medium tracking-tight">
                Two ways in.
            </h2>
            <p className="mt-3 text-sm text-base-content/70 max-w-xl">
                Hosted is the short path — your client walks you through a sign-in
                and nothing lands on your machine. Local is for clients that only
                speak stdio, or for anyone who would rather hold their own key.
            </p>

            <div role="tablist" className="mt-8 flex gap-2">
                <button
                    role="tab"
                    type="button"
                    aria-selected={method === 'remote'}
                    onClick={() => setMethod('remote')}
                    className={
                        method === 'remote'
                            ? 'btn btn-secondary btn-sm'
                            : 'btn btn-outline btn-secondary btn-sm'
                    }
                >
                    Hosted
                </button>
                <button
                    role="tab"
                    type="button"
                    aria-selected={method === 'stdio'}
                    onClick={() => setMethod('stdio')}
                    className={
                        method === 'stdio'
                            ? 'btn btn-secondary btn-sm'
                            : 'btn btn-outline btn-secondary btn-sm'
                    }
                >
                    Local
                </button>
            </div>

            <div className="mt-6">
                <div className="flex items-center justify-between gap-4 mb-2">
                    <p className="text-eyebrow font-mono uppercase tracking-widest text-base-content/40">
                        {method === 'remote' ? 'Sign in with kanNINJA' : 'Bring your own key'}
                    </p>
                    <CopyButton text={snippet} />
                </div>
                <pre className="bg-base-200 rounded-md p-4 overflow-x-auto text-xs font-mono leading-relaxed">
                    {snippet}
                </pre>
                {method === 'remote' ? (
                    <p className="mt-4 text-sm text-base-content/70">
                        Your client registers itself and opens a consent screen. Approve
                        it once. Nothing to paste, no key to rotate.
                    </p>
                ) : (
                    <p className="mt-4 text-sm text-base-content/70">
                        Mint a key in{' '}
                        <Link href="/settings" className="text-primary hover:underline">
                            Settings
                        </Link>
                        , drop it in, restart your client. The key carries your
                        permissions and nobody else&apos;s.
                    </p>
                )}
            </div>

            <div className="mt-10 pt-8 border-t border-base-300/60">
                <p className="text-eyebrow font-mono uppercase tracking-widest text-base-content/40">
                    Known to work
                </p>
                <p className="mt-4 text-sm text-base-content/70">
                    Claude Code, Claude.ai, Cursor, ChatGPT desktop, Zed, Windsurf,
                    Continue.dev. Anything that speaks MCP finds the same 42 tools.
                </p>
            </div>
        </div>
    );
}
