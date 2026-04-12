'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowDown,
  faArrowUp,
  faCircleCheck,
  faCircleXmark,
} from '@fortawesome/free-solid-svg-icons';

interface ActivityEvent {
  id: string;
  provider: string;
  direction: string;
  eventType: string;
  status: string;
  timestamp: string;
}

interface ActivityFeedProps {
  events: ActivityEvent[];
}

export function ActivityFeed({ events }: ActivityFeedProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-base-content/30 text-sm">
          No activity yet. Connect a service to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {events.map((event) => (
        <div
          key={event.id}
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-base-200/50 transition-colors"
        >
          {/* Direction icon */}
          <FontAwesomeIcon
            icon={event.direction === 'inbound' ? faArrowDown : faArrowUp}
            className={`text-[10px] ${
              event.direction === 'inbound' ? 'text-info' : 'text-primary'
            }`}
          />

          {/* Provider + event type */}
          <div className="flex-1 min-w-0">
            <span className="text-sm">
              <span className="font-medium">{event.provider}</span>
              <span className="text-base-content/50 mx-1.5">&middot;</span>
              <span className="text-base-content/60">{event.eventType}</span>
            </span>
          </div>

          {/* Status */}
          <FontAwesomeIcon
            icon={event.status === 'success' ? faCircleCheck : faCircleXmark}
            className={`text-xs ${
              event.status === 'success' ? 'text-success' : 'text-error'
            }`}
          />

          {/* Time */}
          <span className="font-mono text-[11px] text-base-content/30 shrink-0">
            {formatTime(event.timestamp)}
          </span>
        </div>
      ))}
    </div>
  );
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'now';
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
