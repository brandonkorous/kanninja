'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { useBoardMembers } from '@/hooks/use-board-members';

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

function formatRelative(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return formatDate(iso);
}

export function CardMetadata({
    boardId,
    createdBy,
    createdAt,
    updatedAt,
}: {
    boardId: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}) {
    const { data: members } = useBoardMembers(boardId);
    const creator = members?.find((m) => m.userId === createdBy);

    return (
        <div className="mt-8 pt-6 border-t border-base-300">
            <p className="text-eyebrow font-mono uppercase tracking-widest text-base-content/50 mb-4">
                Metadata
            </p>
            <div className="flex flex-col gap-3 text-sm text-base-content/70">
                <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-base-300 flex items-center justify-center shrink-0 overflow-hidden">
                        {creator?.avatarUrl ? (
                            <img
                                src={creator.avatarUrl}
                                alt=""
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <FontAwesomeIcon icon={faUser} className="text-xs text-base-content/40" />
                        )}
                    </div>
                    <span>
                        Created by{' '}
                        <span className="text-base-content font-medium">
                            {creator?.displayName ?? creator?.email ?? 'Unknown'}
                        </span>
                    </span>
                </div>
                <div className="flex items-center justify-between text-xs text-base-content/50 font-mono">
                    <span>Created {formatDate(createdAt)}</span>
                    <span>Updated {formatRelative(updatedAt)}</span>
                </div>
            </div>
        </div>
    );
}
