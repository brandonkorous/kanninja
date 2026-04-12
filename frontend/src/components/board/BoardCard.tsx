'use client';

import { faColumns } from '@fortawesome/free-solid-svg-icons';
import { useDeleteBoard } from '@/hooks/use-boards';
import { LinkCard } from '@/components/ui';

interface BoardCardProps {
    id: string;
    title: string;
    description: string | null;
    role: string;
    updatedAt: string;
}

// Formats an updatedAt timestamp as a brief, human phrase. Uses relative
// wording for the last week, then a terse "MMM D" format beyond that. The
// voice skill prefers concrete specificity over "a while ago" vagueness.
function formatUpdated(iso: string): string {
    const then = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - then.getTime();
    const diffMin = Math.round(diffMs / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.round(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.round(diffHr / 24);
    if (diffDay < 7) return `${diffDay}d ago`;
    return then.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function BoardCard({ id, title, description, role, updatedAt }: BoardCardProps) {
    const deleteBoard = useDeleteBoard();

    return (
        <LinkCard
            href={`/dojo/${id}`}
            icon={faColumns}
            title={title}
            description={description}
            metaStart={role}
            metaEnd={formatUpdated(updatedAt)}
            ariaLabel={`Open ${title}`}
            deleteAction={
                role === 'owner'
                    ? {
                          onConfirm: async () => {
                              await deleteBoard.mutateAsync(id);
                          },
                          isConfirming: deleteBoard.isPending,
                          eyebrow: 'Delete dojo',
                          title: 'Delete this dojo?',
                          body: (
                              <>
                                  &ldquo;{title}&rdquo; and every kata it holds will be
                                  deleted. There is no undo.
                              </>
                          ),
                          confirmLabel: 'Delete dojo',
                          ariaLabel: `Delete ${title}`,
                      }
                    : undefined
            }
        />
    );
}
