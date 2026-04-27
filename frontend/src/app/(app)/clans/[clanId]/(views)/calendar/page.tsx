'use client';

import { useParams } from 'next/navigation';
import { useClanScheduledCards } from '@/hooks/use-scheduled-cards';

export default function ClanCalendarPage() {
  const params = useParams();
  const clanId = params.clanId as string;
  const { data, isLoading } = useClanScheduledCards(clanId, { unscheduled: true });

  return (
    <div className="bg-base-100 rounded-lg shadow-e1 p-12 text-center">
      <p className="text-eyebrow font-mono uppercase tracking-widest text-primary">Coming next</p>
      <h2 className="mt-4 font-display text-3xl font-medium tracking-tight">
        Clan calendar <span className="italic text-primary">in training.</span>
      </h2>
      <p className="mt-3 text-base-content/60">
        {isLoading
          ? 'Counting kata across your dojos…'
          : `${data?.scheduled.length ?? 0} scheduled · ${data?.unscheduled.length ?? 0} unscheduled.`}
      </p>
    </div>
  );
}
