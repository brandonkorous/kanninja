'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faGear } from '@fortawesome/free-solid-svg-icons';
import { useBoard, useUpdateBoard } from '@/hooks/use-boards';
import { useDojoPermissions } from '@/hooks/use-permissions';
import { useRealtimeBoard } from '@/hooks/use-realtime-board';
import { useDojoView, type DojoView } from '@/hooks/use-view-preference';
import { BoardPresence } from '@/components/realtime/BoardPresence';
import { DojoSettingsDialog } from '@/components/board/DojoSettingsDialog';
import { InlineEditTitle } from '@/components/ui';
import { ViewSwitcher } from '@/components/views/ViewSwitcher';
import { usePathname } from 'next/navigation';

/**
 * Shared layout for the dojo's four views (board, calendar, timeline,
 * list). Owns the chrome — back arrow, editable title, role badge,
 * presence avatars, settings gear, and the view-switcher tab strip
 * — so each leaf view can focus on rendering its content. Lives
 * inside a `(views)` route group so the kata detail page (deep-link
 * for a single card) doesn't inherit it.
 *
 * The layout also remembers which view the user landed on so the
 * `/dojo/[dojoId]` redirect can return them here next time.
 */
export default function DojoViewsLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const boardId = params.dojoId as string;
  const pathname = usePathname();
  const { data: board, isLoading, error } = useBoard(boardId);
  const updateBoard = useUpdateBoard(boardId);
  const { presenceUsers, status: realtimeStatus } = useRealtimeBoard(boardId);
  const { canEdit } = useDojoPermissions(boardId);
  const { setView } = useDojoView(boardId);

  const [showSettings, setShowSettings] = useState(false);

  // Track the active view so we can resurface it on the next visit
  // to /dojo/[dojoId]. Pulled out of pathname so we don't need to
  // thread the segment through every leaf page.
  useEffect(() => {
    if (!pathname) return;
    const segments = pathname.split('/').filter(Boolean);
    const last = segments[segments.length - 1];
    if (['board', 'calendar', 'timeline', 'list'].includes(last)) {
      setView(last as DojoView);
    }
  }, [pathname, setView]);

  if (isLoading) {
    return (
      <p
        role="status"
        aria-live="polite"
        className="text-eyebrow font-mono uppercase tracking-widest text-base-content/40"
      >
        Opening the dojo…
      </p>
    );
  }

  if (error || !board) {
    return (
      <div role="alert" className="bg-base-100 rounded-lg shadow-e1 p-8 max-w-xl">
        <p className="text-eyebrow font-mono uppercase tracking-widest text-error">Sealed</p>
        <h2 className="mt-4 font-display text-2xl font-medium tracking-tight">
          This dojo is <span className="italic text-primary">sealed.</span>
        </h2>
        <p className="mt-3 text-sm text-base-content/60">
          You may not have access, or the dojo no longer exists.
        </p>
        <Link href="/dashboard" className="btn btn-outline btn-secondary mt-8">
          Back to your dojos
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between gap-4 mb-4">
        <div className="min-w-0 flex-1 flex items-center gap-3">
          <Link
            href="/dashboard"
            aria-label="Back to dojos"
            className="btn btn-ghost btn-sm btn-square text-base-content/50 hover:text-base-content shrink-0"
          >
            <FontAwesomeIcon icon={faArrowLeft} aria-hidden="true" />
          </Link>
          <InlineEditTitle
            value={board.title}
            canEdit={canEdit}
            entityLabel="dojo title"
            size="md"
            onSave={(title) => updateBoard.mutateAsync({ title })}
          />
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <span className="hidden sm:inline text-eyebrow font-mono uppercase tracking-widest text-base-content/40">
            {board.currentUserRole}
          </span>
          <BoardPresence users={presenceUsers} status={realtimeStatus} />
          <button
            type="button"
            aria-label="Dojo settings"
            aria-haspopup="dialog"
            className="btn btn-ghost btn-sm btn-square text-base-content/50 hover:text-base-content"
            onClick={() => setShowSettings(true)}
          >
            <FontAwesomeIcon icon={faGear} aria-hidden="true" />
          </button>
        </div>
      </header>

      <ViewSwitcher basePath={`/dojo/${boardId}`} scope="dojo" />

      <div className="flex-1 overflow-hidden mt-6">{children}</div>

      <DojoSettingsDialog
        boardId={boardId}
        boardTitle={board.title}
        boardDescription={board.description}
        boardColor={board.color}
        isCreator={board.isCreator}
        open={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
}
