'use client';

import { useParams } from 'next/navigation';
import { TimelineView } from '@/components/views/timeline/TimelineView';

export default function DojoTimelinePage() {
  const params = useParams();
  const boardId = params.dojoId as string;

  return (
    <div className="h-full">
      <TimelineView boardId={boardId} />
    </div>
  );
}
