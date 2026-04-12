'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useInviteClanMember } from '@/hooks/use-clans';
import { Field, Input, Select } from '@/components/ui';

type Role = 'admin' | 'member' | 'reader';

// Uses the native <dialog> showModal() API so the browser provides focus
// trap, Escape-to-cancel, body scroll lock, top-layer rendering, and focus
// return to the trigger.
export function InviteClanModal({
    clanId,
    open,
    onClose,
}: {
    clanId: string;
    open: boolean;
    onClose: () => void;
}) {
    const invite = useInviteClanMember(clanId);
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<Role>('member');
    const [token, setToken] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const dialogRef = useRef<HTMLDialogElement>(null);
    const titleId = useId();

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        if (open && !dialog.open) {
            dialog.showModal();
        } else if (!open && dialog.open) {
            dialog.close();
        }
    }, [open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;
        setError(null);
        try {
            const res = await invite.mutateAsync({ email: email.trim(), role });
            setToken((res as { data: { inviteToken: string } }).data.inviteToken);
            setEmail('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something on our end.');
        }
    };

    const handleClose = () => {
        if (invite.isPending) return;
        setToken(null);
        setError(null);
        onClose();
    };

    return (
        <dialog
            ref={dialogRef}
            className="modal"
            aria-labelledby={titleId}
            onClose={() => {
                setToken(null);
                setError(null);
                onClose();
            }}
            onCancel={(e) => {
                if (invite.isPending) e.preventDefault();
            }}
        >
            <div className="modal-box bg-base-100 rounded-xl shadow-e4 max-w-md p-8">
                <p className="text-eyebrow font-mono uppercase tracking-widest text-primary">
                    Invite
                </p>
                <h3
                    id={titleId}
                    className="mt-4 font-display text-3xl font-medium tracking-tight"
                >
                    Send an <span className="italic text-primary">invite.</span>
                </h3>

                {token ? (
                    <div className="mt-6 space-y-4">
                        <p className="text-sm text-base-content/70">
                            The invite is ready. Share this link with your clanmate.
                        </p>
                        <code className="block bg-base-200 border border-base-300 rounded-md p-4 text-xs font-mono break-all">
                            {typeof window !== 'undefined'
                                ? `${window.location.origin}/invite/${token}`
                                : `/invite/${token}`}
                        </code>
                        <div className="flex justify-end gap-4 pt-2">
                            <button
                                type="button"
                                className="btn btn-ghost"
                                onClick={() => setToken(null)}
                            >
                                Send another
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleClose}
                            >
                                Done
                            </button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                        <Field label="Email" htmlFor="invite-email" error={error ?? undefined}>
                            <Input
                                id="invite-email"
                                type="email"
                                placeholder="clanmate@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoFocus
                                required
                            />
                        </Field>
                        <Field label="Role" htmlFor="invite-role">
                            <Select
                                id="invite-role"
                                value={role}
                                onChange={(e) => setRole(e.target.value as Role)}
                            >
                                <option value="reader">Reader — can look around</option>
                                <option value="member">Member — can train</option>
                                <option value="admin">Admin — can lead</option>
                            </Select>
                        </Field>
                        <div className="flex items-center justify-end gap-4 pt-2">
                            <button
                                type="button"
                                className="btn btn-ghost"
                                onClick={handleClose}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={invite.isPending || !email.trim()}
                            >
                                {invite.isPending ? 'Sending…' : 'Send invite'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
            <form method="dialog" className="modal-backdrop">
                <button
                    type="submit"
                    aria-label="Close"
                    disabled={invite.isPending}
                >
                    close
                </button>
            </form>
        </dialog>
    );
}
