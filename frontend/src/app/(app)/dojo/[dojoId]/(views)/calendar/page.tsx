'use client';

import { useParams } from 'next/navigation';
import { useBoardScheduledCards } from '@/hooks/use-scheduled-cards';

/**
 * Calendar view — placeholder. Wires the data fetch so we can verify
 * the endpoint end-to-end during Phase 3, then Phase 5 fills in the
 * month/week grid + drag-to-reschedule.
 */
export default function DojoCalendarPage() {
  const params = useParams();
  const boardId = params.dojoId as string;
  const { data, isLoading } = useBoardScheduledCards(boardId, { unscheduled: true });

  return (
    <div className="bg-base-100 rounded-lg shadow-e1 p-12 text-center">
      <p className="text-eyebrow font-mono uppercase tracking-widest text-primary">Coming next</p>
      <h2 className="mt-4 font-display text-3xl font-medium tracking-tight">
        Calendar view <span className="italic text-primary">in training.</span>
      </h2>
      <p className="mt-3 text-base-content/60">
        {isLoading
          ? 'Counting your kata…'
          : `${data?.scheduled.length ?? 0} scheduled · ${data?.unscheduled.length ?? 0} unscheduled.`}
      </p>
    </div>
  );
}
