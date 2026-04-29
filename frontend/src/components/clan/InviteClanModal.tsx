'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useInviteClanMember, useClanSeatUsage } from '@/hooks/use-clans';
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
    // Only fetch seat usage while the modal is open — saves a round trip on
    // every clan page load.
    const { data: usage } = useClanSeatUsage(clanId, open);
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<Role>('member');
    const [token, setToken] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const dialogRef = useRef<HTMLDialogElement>(null);
    const titleId = useId();

    // Show a warning when the next seat will hit a hard cap or trigger overage.
    // Caveat: an invite to someone already in another of the owner's clans
    // doesn't actually consume a new seat — but we don't know that until the
    // invitee accepts (we don't have their profile id yet). Best guess from
    // the email alone is "this might cost extra," which is the right thing
    // to surface to the admin.
    const seatWarning = (() => {
        if (!usage) return null;
        const { seatsUsed, seatsIncluded, seatOveragePriceMonthly } = usage;
        if (seatsIncluded === null) return null; // Enterprise — custom
        if (seatsUsed < seatsIncluded) return null; // under cap, no warning
        if (seatOveragePriceMonthly === null) {
            return { kind: 'cap' as const };
        }
        return { kind: 'overage' as const, price: seatOveragePriceMonthly };
    })();

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
                        {seatWarning?.kind === 'overage' && (
                            <div
                                role="status"
                                className="rounded-md bg-base-200/60 border border-base-300 px-4 py-3"
                            >
                                <p className="text-eyebrow font-mono uppercase tracking-widest text-base-content/60">
                                    Heads up
                                </p>
                                <p className="mt-2 text-sm text-base-content/80">
                                    You&rsquo;re at your included seat count. This invite
                                    will add{' '}
                                    <span className="font-mono">${seatWarning.price}/mo</span>{' '}
                                    to the next bill if accepted by someone new.
                                </p>
                            </div>
                        )}
                        {seatWarning?.kind === 'cap' && (
                            <div
                                role="alert"
                                className="rounded-md bg-base-200/60 border border-base-300 px-4 py-3"
                            >
                                <p className="text-eyebrow font-mono uppercase tracking-widest text-primary">
                                    At seat limit
                                </p>
                                <p className="mt-2 text-sm text-base-content/80">
                                    Your tier is at its included seat count. The invite
                                    will be rejected on accept unless you{' '}
                                    <a
                                        href="/pricing"
                                        className="text-primary underline-offset-2 hover:underline focus-visible:shadow-focus rounded-sm"
                                    >
                                        upgrade
                                    </a>
                                    .
                                </p>
                            </div>
                        )}
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
