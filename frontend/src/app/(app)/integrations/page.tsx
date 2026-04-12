'use client';

import {
  useIntegrationConnections,
  useIntegrationEvents,
} from '@/hooks/use-integrations';
import { ProviderGrid } from '@/components/integrations/ProviderGrid';
import { ActivityFeed } from '@/components/integrations/ActivityFeed';

export default function IntegrationsPage() {
  const { data: connections } = useIntegrationConnections();
  const { data: events } = useIntegrationEvents();
  const activeCount = connections?.filter((c) => c.status === 'active').length ?? 0;

  // Map events to the shape ActivityFeed expects
  const feedEvents = (events ?? []).map((e) => ({
    id: e.id,
    provider: e.providerId ?? 'unknown',
    direction: e.direction,
    eventType: e.eventType,
    status: e.status,
    timestamp: e.createdAt,
  }));

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-12">
        <p className="text-eyebrow font-mono uppercase tracking-widest text-primary">
          Integrations
        </p>
        <h1 className="mt-6 font-display text-4xl md:text-5xl font-medium tracking-tight">
          Your{' '}
          <span className="italic text-primary">connections.</span>
        </h1>
        <p className="mt-4 text-base text-base-content/60 max-w-xl">
          Connect kanNINJA to the tools your team already uses.
          Sync cards, get notifications, and keep everything in one place.
        </p>
        {activeCount > 0 && (
          <p className="mt-2 font-mono text-sm text-base-content/40">
            {activeCount} active {activeCount === 1 ? 'connection' : 'connections'}
          </p>
        )}
      </div>

      {/* Provider grid */}
      <ProviderGrid />

      {/* Activity feed */}
      {activeCount > 0 && (
        <div className="mt-16">
          <h2 className="font-display text-lg font-semibold mb-4">
            Recent activity
          </h2>
          <div className="card bg-base-100 border border-base-300 shadow-e1">
            <div className="card-body p-4">
              <ActivityFeed events={feedEvents} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
