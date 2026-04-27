'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDojoView } from '@/hooks/use-view-preference';

/**
 * Dojo entry point — never rendered, redirects to whichever view the
 * user was last on (or the kanban board on first visit). Keeps
 * /dojo/[dojoId] as a stable, shareable URL while letting the
 * actual surface live at /dojo/[dojoId]/{board,calendar,timeline,list}.
 *
 * Reads the preference on mount (not during render) so SSR and
 * hydration agree — localStorage doesn't exist on the server.
 */
export default function DojoIndexPage() {
  const params = useParams();
  const router = useRouter();
  const boardId = params.dojoId as string;
  const { view } = useDojoView(boardId);

  useEffect(() => {
    if (!boardId) return;
    router.replace(`/dojo/${boardId}/${view ?? 'board'}`);
  }, [boardId, view, router]);

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
