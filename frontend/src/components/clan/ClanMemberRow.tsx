'use client';

import { useState } from 'react';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faUser } from '@fortawesome/free-solid-svg-icons';
import { useRemoveClanMember, useUpdateClanMemberRole } from '@/hooks/use-clans';
import { useClanPermissions } from '@/hooks/use-permissions';
import { Select, ConfirmDialog } from '@/components/ui';

interface ClanMemberRowProps {
    clanId: string;
    member: {
        id: string;
        userId: string;
        role: string;
        joinedAt: string;
        displayName: string | null;
        email: string;
        avatarUrl: string | null;
    };
}

// One row in the clan members list. Owns its own confirm-dialog state for
// the destructive remove action — keeping it local means the parent doesn't
// need to track which member is being removed at any given time. Reads
// the admin role from the cached useClan query so any future caller
// just needs to pass clanId — no canManage prop to remember. The
// backend also enforces admin-only on these mutations, but surfacing
// gated actions as clickable-then-403 is bad UX, so we hide them.
export function ClanMemberRow({ clanId, member }: ClanMemberRowProps) {
    const { canManage } = useClanPermissions(clanId);
    const updateRole = useUpdateClanMemberRole(clanId);
    const removeMember = useRemoveClanMember(clanId);
    const [showRemoveDialog, setShowRemoveDialog] = useState(false);

    const displayName = member.displayName ?? 'Unnamed clanmate';

    const handleConfirmRemove = async () => {
        await removeMember.mutateAsync(member.id);
        setShowRemoveDialog(false);
    };

    return (
        <li className="group flex items-center gap-4 px-8 py-5 border-b border-base-300 last:border-b-0 hover:bg-base-200/40 transition-colors">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-base-300 text-base-content/70 overflow-hidden">
                {member.avatarUrl ? (
                    <Image
                        src={member.avatarUrl}
                        alt=""
                        width={40}
                        height={40}
                        className="h-10 w-10 object-cover"
                    />
                ) : (
                    <FontAwesomeIcon icon={faUser} aria-hidden="true" />
                )}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-base-content truncate">
                    {displayName}
                </p>
                <p className="text-xs text-base-content/60 truncate">
                    {member.email}
                </p>
            </div>
            {canManage ? (
                <Select
                    size="sm"
                    className="w-auto"
                    value={member.role}
                    onChange={(e) =>
                        updateRole.mutate({
                            memberId: member.id,
                            role: e.target.value as 'admin' | 'member' | 'reader',
                        })
                    }
                    aria-label={`Role for ${displayName}`}
                >
                    <option value="admin">Admin</option>
                    <option value="member">Member</option>
                    <option value="reader">Reader</option>
                </Select>
            ) : (
                <span className="text-eyebrow font-mono uppercase tracking-widest text-base-content/60">
                    {member.role}
                </span>
            )}
            {canManage && (
                <button
                    type="button"
                    className="btn btn-ghost btn-sm md:btn-xs text-base-content/40 hover:text-error focus-visible:text-error"
                    onClick={() => setShowRemoveDialog(true)}
                    aria-label={`Remove ${displayName} from clan`}
                >
                    <FontAwesomeIcon icon={faTrash} aria-hidden="true" />
                </button>
            )}

            <ConfirmDialog
                open={showRemoveDialog}
                onCancel={() => setShowRemoveDialog(false)}
                onConfirm={handleConfirmRemove}
                eyebrow="Remove clanmate"
                title="Remove this clanmate?"
                body={
                    <>
                        {displayName} will lose access to every dojo this clan can reach.
                        You can invite them back later.
                    </>
                }
                confirmLabel="Remove"
                isConfirming={removeMember.isPending}
            />
        </li>
    );
}
