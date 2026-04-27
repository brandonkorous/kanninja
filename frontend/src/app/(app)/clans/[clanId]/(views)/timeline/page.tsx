'use client';

import { useParams } from 'next/navigation';
import { ClanTimelineView } from '@/components/views/timeline/ClanTimelineView';

export default function ClanTimelinePage() {
  const params = useParams();
  const clanId = params.clanId as string;

  return (
    <div className="h-full">
      <ClanTimelineView clanId={clanId} />
    </div>
  );
}
