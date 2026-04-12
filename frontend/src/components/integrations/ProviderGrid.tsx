'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useIntegrationProviders,
  useIntegrationConnections,
  useConnectIntegration,
  useDisconnectIntegration,
  usePauseIntegration,
  useSyncIntegration,
} from '@/hooks/use-integrations';
import { useToast } from '@/providers/ToastProvider';
import { ProviderCard } from './ProviderCard';
import { ConfigModal } from './ConfigModal';
import type { IntegrationConnection } from '@/hooks/use-integrations';

const CATEGORY_LABELS: Record<string, string> = {
  all: 'All',
  calendar: 'Calendar',
  messaging: 'Messaging',
  devtools: 'Dev Tools',
  email: 'Email',
  knowledge: 'Knowledge',
  'pm-import': 'Import',
  automation: 'Automation',
  design: 'Design',
  files: 'Files',
  media: 'Media',
  'time-tracking': 'Time Tracking',
  support: 'Support',
  crm: 'CRM',
};

export function ProviderGrid() {
  const qc = useQueryClient();
  const toast = useToast();
  const { data: providers, isLoading } = useIntegrationProviders();
  const { data: connections } = useIntegrationConnections();
  const connect = useConnectIntegration();
  const disconnect = useDisconnectIntegration();
  const pause = usePauseIntegration();
  const sync = useSyncIntegration();
  const [configuring, setConfiguring] = useState<IntegrationConnection | null>(null);
  const [category, setCategory] = useState('all');

  // Listen for OAuth popup callback
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== 'integration-callback') return;
      qc.invalidateQueries({ queryKey: ['integration-connections'] });
      if (event.data.success) toast.success('Integration connected!');
      else if (event.data.error) toast.error(`Connection failed: ${event.data.error}`);
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [qc, toast]);

  const categories = useMemo(() => {
    if (!providers) return ['all'];
    const cats = new Set(providers.map((p) => p.category));
    return ['all', ...cats];
  }, [providers]);

  const filtered = useMemo(() => {
    if (!providers) return [];
    if (category === 'all') return providers;
    return providers.filter((p) => p.category === category);
  }, [providers, category]);

  // Sort: connected first, then available, then locked
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aConn = connections?.find((c) => c.providerId === a.id);
      const bConn = connections?.find((c) => c.providerId === b.id);
      if (aConn && !bConn) return -1;
      if (!aConn && bConn) return 1;
      if (a.available && !b.available) return -1;
      if (!a.available && b.available) return 1;
      return 0;
    });
  }, [filtered, connections]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-8 w-20 rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-52 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Category tabs */}
      {categories.length > 2 && (
        <div
          role="tablist"
          aria-label="Integration categories"
          className="border-b border-base-300 flex gap-0 mb-8"
        >
          {categories.map((cat) => {
            const isActive = category === cat;
            return (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setCategory(cat)}
                className={`px-4 py-3 text-sm font-mono transition-colors border-b-2 -mb-px shrink-0 ${
                  isActive
                    ? 'border-primary text-base-content font-medium'
                    : 'border-transparent text-base-content/50 hover:text-base-content'
                }`}
              >
                {CATEGORY_LABELS[cat] ?? cat}
              </button>
            );
          })}
        </div>
      )}

      {/* Grid */}
      {sorted.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-base-content/40 text-sm">
            No integrations in this category yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sorted.map((provider) => {
            const connection = connections?.find((c) => c.providerId === provider.id);
            return (
              <ProviderCard
                key={provider.id}
                provider={provider}
                connection={connection}
                onConnect={() => connect.mutate(provider.id)}
                onDisconnect={(id) => disconnect.mutate(id)}
                onPause={(id) => pause.mutate(id)}
                onSync={(id) => sync.mutate(id)}
                onConfigure={(id) => {
                  const conn = connections?.find((c) => c.id === id);
                  if (conn) setConfiguring(conn);
                }}
                isConnecting={connect.isPending}
              />
            );
          })}
        </div>
      )}

      {configuring && (
        <ConfigModal
          connection={configuring}
          onClose={() => setConfiguring(null)}
        />
      )}
    </>
  );
}
