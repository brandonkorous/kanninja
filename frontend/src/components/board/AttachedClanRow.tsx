'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsersRectangle, faXmark } from '@fortawesome/free-solid-svg-icons';
import { Select } from '@/components/ui';
import type { AttachedClan } from '@/hooks/use-board-clans';

type Role = 'viewer' | 'editor' | 'owner';

interface AttachedClanRowProps {
    clan: AttachedClan;
    canManage: boolean;
    onRoleChange: (role: Role) => void;
    onRequestDetach: () => void;
}

// One row in the "Clans with the keys" list. Pulled out of
// DojoAccessSection so the parent stays under the 200-line cap and
// the row markup can be reused if a similar list shows up elsewhere.
export function AttachedClanRow({
    clan,
    canManage,
    onRoleChange,
    onRequestDetach,
}: AttachedClanRowProps) {
    return (
        <li className="flex items-center gap-4 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-base-200 text-base-content/60">
                <FontAwesomeIcon icon={faUsersRectangle} aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-base-content truncate">
                    {clan.clanName}
                    {clan.isPersonal && (
                        <span className="ml-2 text-eyebrow font-mono uppercase tracking-widest text-primary/70">
                            personal
                        </span>
                    )}
                </p>
            </div>
            {canManage ? (
                <Select
                    size="sm"
                    className="w-auto"
                    value={clan.role}
                    onChange={(e) => onRoleChange(e.target.value as Role)}
                    aria-label={`Role for ${clan.clanName}`}
                >
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                    <option value="owner">Owner</option>
                </Select>
            ) : (
                <span className="text-eyebrow font-mono uppercase tracking-widest text-base-content/60">
                    {clan.role}
                </span>
            )}
            {canManage && (
                <button
                    type="button"
                    className="btn btn-ghost btn-sm md:btn-xs text-base-content/40 hover:text-error"
                    onClick={onRequestDetach}
                    aria-label={`Detach ${clan.clanName}`}
                >
                    <FontAwesomeIcon icon={faXmark} aria-hidden="true" />
                </button>
            )}
        </li>
    );
}
