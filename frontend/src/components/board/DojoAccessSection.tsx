'use client';

import { useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import {
    useBoardClans,
    useAttachClanToBoard,
    useUpdateBoardClanRole,
    useDetachClanFromBoard,
} from '@/hooks/use-board-clans';
import { useClans } from '@/hooks/use-clans';
import { Field, Select, ConfirmDialog } from '@/components/ui';
import { AttachedClanRow } from './AttachedClanRow';

type Role = 'viewer' | 'editor' | 'owner';

interface DojoAccessSectionProps {
    boardId: string;
    /** Creator-only: gates the attach/detach/role-change controls. */
    canManage: boolean;
}

// Access management inside the Dojo Settings dialog. Inlines the attach
// form (no nested modal) so users don't end up two dialogs deep.
export function DojoAccessSection({ boardId, canManage }: DojoAccessSectionProps) {
    const { data: attached, isLoading } = useBoardClans(boardId);
    const { data: allClans } = useClans();
    const attach = useAttachClanToBoard(boardId);
    const updateRole = useUpdateBoardClanRole(boardId);
    const detach = useDetachClanFromBoard(boardId);

    const [showAttachForm, setShowAttachForm] = useState(false);
    const [attachClanId, setAttachClanId] = useState('');
    const [attachRole, setAttachRole] = useState<Role>('editor');
    const [pendingDetach, setPendingDetach] = useState<string | null>(null);

    // Eligible = clans you ADMIN that aren't already attached.
    const eligibleClans = useMemo(() => {
        const attachedIds = new Set(attached?.map((a) => a.clanId) ?? []);
        return (allClans ?? []).filter(
            (c) => c.role === 'admin' && !attachedIds.has(c.id),
        );
    }, [allClans, attached]);

    const pendingDetachClan = attached?.find((a) => a.clanId === pendingDetach);

    const handleAttach = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!attachClanId) return;
        await attach.mutateAsync({ clanId: attachClanId, role: attachRole });
        setAttachClanId('');
        setAttachRole('editor');
        setShowAttachForm(false);
    };

    return (
        <section>
            <header className="flex items-baseline justify-between gap-4">
                <div>
                    <p className="text-eyebrow font-mono uppercase tracking-widest text-primary">
                        Access
                    </p>
                    <h3 className="mt-2 font-display text-xl font-medium tracking-tight">
                        Clans with <span className="italic text-primary">the keys.</span>
                    </h3>
                </div>
                {canManage && !showAttachForm && (
                    <button
                        type="button"
                        className="btn btn-ghost btn-sm shrink-0"
                        onClick={() => {
                            setShowAttachForm(true);
                            if (eligibleClans.length > 0) {
                                setAttachClanId(eligibleClans[0].id);
                            }
                        }}
                    >
                        <FontAwesomeIcon icon={faPlus} aria-hidden="true" className="mr-2" />
                        Attach a clan
                    </button>
                )}
            </header>

            {isLoading && (
                <p className="mt-4 text-eyebrow font-mono uppercase tracking-widest text-base-content/50">
                    Looking up access…
                </p>
            )}

            {!isLoading && attached && attached.length === 0 && !showAttachForm && (
                <p className="mt-4 text-sm text-base-content/70">
                    {canManage
                        ? 'Personal dojo — only you can see this. Attach a clan to bring others in.'
                        : 'No clans attached.'}
                </p>
            )}

            {attached && attached.length > 0 && (
                <ul className="mt-4 divide-y divide-base-300">
                    {attached.map((a) => (
                        <AttachedClanRow
                            key={a.id}
                            clan={a}
                            canManage={canManage}
                            onRoleChange={(role) =>
                                updateRole.mutate({ clanId: a.clanId, role })
                            }
                            onRequestDetach={() => setPendingDetach(a.clanId)}
                        />
                    ))}
                </ul>
            )}

            {showAttachForm && (
                <form
                    onSubmit={handleAttach}
                    className="mt-6 p-4 border border-base-300 rounded-lg bg-base-200/40 space-y-4"
                >
                    {eligibleClans.length === 0 ? (
                        <p className="text-sm text-base-content/70">
                            You don't lead any clans you could grant access from. Start a
                            clan first.
                        </p>
                    ) : (
                        <>
                            <Field label="Clan" htmlFor="dojo-attach-clan">
                                <Select
                                    id="dojo-attach-clan"
                                    value={attachClanId}
                                    onChange={(e) => setAttachClanId(e.target.value)}
                                >
                                    {eligibleClans.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                            {c.isPersonal ? ' (personal)' : ''}
                                        </option>
                                    ))}
                                </Select>
                            </Field>
                            <Field
                                label="Highest role"
                                htmlFor="dojo-attach-role"
                                hint="Each member keeps their clan tier — admins act as owners, members as editors, readers as viewers — capped at this maximum."
                            >
                                <Select
                                    id="dojo-attach-role"
                                    value={attachRole}
                                    onChange={(e) => setAttachRole(e.target.value as Role)}
                                >
                                    <option value="viewer">Viewer — at most read only</option>
                                    <option value="editor">Editor — at most edit cards</option>
                                    <option value="owner">Owner — at most full control</option>
                                </Select>
                            </Field>
                        </>
                    )}
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => setShowAttachForm(false)}
                        >
                            Cancel
                        </button>
                        {eligibleClans.length > 0 && (
                            <button
                                type="submit"
                                className="btn btn-primary btn-sm"
                                disabled={attach.isPending || !attachClanId}
                            >
                                {attach.isPending ? 'Attaching…' : 'Grant access'}
                            </button>
                        )}
                    </div>
                </form>
            )}

            <ConfirmDialog
                open={!!pendingDetach}
                onCancel={() => setPendingDetach(null)}
                onConfirm={async () => {
                    if (pendingDetach) {
                        await detach.mutateAsync(pendingDetach);
                        setPendingDetach(null);
                    }
                }}
                isConfirming={detach.isPending}
                eyebrow="Detach clan"
                title="Remove this clan?"
                body={
                    <>
                        Members of{' '}
                        <strong>{pendingDetachClan?.clanName ?? 'this clan'}</strong> will
                        lose access to this dojo. The clan itself stays put.
                    </>
                }
                confirmLabel="Detach clan"
            />
        </section>
    );
}
