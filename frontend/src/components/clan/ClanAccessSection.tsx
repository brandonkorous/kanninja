'use client';

import { useId, useState } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChessBoard, faPlus } from '@fortawesome/free-solid-svg-icons';
import { useClanBoards } from '@/hooks/use-clans';
import { useClanPermissions } from '@/hooks/use-permissions';
import { AttachDojoToClanModal } from './AttachDojoToClanModal';

interface ClanAccessSectionProps {
    clanId: string;
}

// "Dojos this clan can access" block on the clan detail page. Owns the
// Attach modal state locally so the parent page doesn't have to track
// it alongside the separate Invite modal state. Pulled out of the
// page itself to keep the route component under the 200-line cap.
// Reads admin role from useClanPermissions — the backend also enforces
// creator-only via requireBoardCreator on attach, but hiding the
// affordance for non-admins keeps the page honest.
export function ClanAccessSection({ clanId }: ClanAccessSectionProps) {
    const { canManage } = useClanPermissions(clanId);
    const { data: clanBoards } = useClanBoards(clanId);
    const [showAttach, setShowAttach] = useState(false);

    const boardCount = clanBoards?.length ?? 0;
    const headingId = useId();

    return (
        <section
            aria-labelledby={headingId}
            className="mt-12 bg-base-100 rounded-lg shadow-e1 overflow-hidden"
        >
            <div className="flex items-center justify-between px-8 py-6 border-b border-base-300 gap-4">
                <div className="min-w-0">
                    <p className="text-eyebrow font-mono uppercase tracking-widest text-primary">
                        Access
                    </p>
                    <h2
                        id={headingId}
                        className="mt-2 font-display text-2xl font-medium tracking-tight"
                    >
                        {boardCount}{' '}
                        <span className="text-base-content/60 text-lg">
                            {boardCount === 1 ? 'dojo' : 'dojos'}
                        </span>{' '}
                        with the <span className="italic text-primary">keys.</span>
                    </h2>
                </div>
                {canManage && (
                    <button
                        type="button"
                        className="btn btn-primary shrink-0"
                        aria-haspopup="dialog"
                        onClick={() => setShowAttach(true)}
                    >
                        <FontAwesomeIcon icon={faPlus} aria-hidden="true" className="mr-2" />
                        Attach a dojo
                    </button>
                )}
            </div>

            {boardCount === 0 && (
                <p className="px-8 py-10 text-sm text-base-content/70">
                    {canManage
                        ? 'No dojos yet. Attach one to grant this clan access.'
                        : 'No dojos yet.'}
                </p>
            )}

            {boardCount > 0 && (
                <ul>
                    {clanBoards!.map((b) => (
                        <li
                            key={b.id}
                            className="border-b border-base-300 last:border-b-0 hover:bg-base-200/40 transition-colors"
                        >
                            <Link
                                href={`/dojo/${b.id}`}
                                className="flex items-center gap-4 px-8 py-5 focus-visible:shadow-focus rounded-sm"
                            >
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-base-200 text-base-content/70">
                                    <FontAwesomeIcon icon={faChessBoard} aria-hidden="true" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-base-content truncate">
                                        {b.title}
                                    </p>
                                    {b.description && (
                                        <p className="text-xs text-base-content/60 truncate">
                                            {b.description}
                                        </p>
                                    )}
                                </div>
                                <span className="text-eyebrow font-mono uppercase tracking-widest text-base-content/60">
                                    {b.clanRole}
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}

            <AttachDojoToClanModal
                clanId={clanId}
                open={showAttach}
                onClose={() => setShowAttach(false)}
            />
        </section>
    );
}
