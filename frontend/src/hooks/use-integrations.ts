'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from './use-api';
import { useToast } from '@/providers/ToastProvider';
import { getToastErrorMessage } from '@/lib/toast-errors';

export interface IntegrationProvider {
  id: string;
  displayName: string;
  description: string | null;
  iconUrl: string | null;
  requiredTier: string;
  category: string;
  enabled: boolean;
  available: boolean;
}

export interface IntegrationConnection {
  id: string;
  profileId: string;
  clanId: string | null;
  providerId: string;
  status: 'active' | 'paused' | 'error' | 'revoked';
  providerConfig: Record<string, unknown> | null;
  consecutiveFailures: number;
  lastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function useIntegrationProviders() {
  const api = useApi();
  return useQuery({
    queryKey: ['integration-providers'],
    queryFn: () =>
      api.get<{ data: IntegrationProvider[] }>('/api/v1/integrations/providers').then(
        (r) => r.data,
      ),
  });
}

export function useIntegrationConnections() {
  const api = useApi();
  return useQuery({
    queryKey: ['integration-connections'],
    queryFn: () =>
      api.get<{ data: IntegrationConnection[] }>('/api/v1/integrations/connections').then(
        (r) => r.data,
      ),
  });
}

export function useConnectIntegration() {
  const api = useApi();
  const toast = useToast();
  return useMutation({
    mutationFn: (providerId: string) =>
      api
        .post<{ data: { authUrl: string } }>(`/api/v1/integrations/${providerId}/connect`)
        .then((r) => r.data),
    onSuccess: ({ authUrl }) => {
      window.open(authUrl, 'integration-oauth', 'width=600,height=700');
    },
    onError: (err) => toast.error(getToastErrorMessage(err)),
  });
}

export function useDisconnectIntegration() {
  const api = useApi();
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (connectionId: string) =>
      api.delete(`/api/v1/integrations/connections/${connectionId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['integration-connections'] });
      toast.success('Disconnected.');
    },
    onError: (err) => toast.error(getToastErrorMessage(err)),
  });
}

export function usePauseIntegration() {
  const api = useApi();
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (connectionId: string) =>
      api.post(`/api/v1/integrations/connections/${connectionId}/pause`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['integration-connections'] });
    },
    onError: (err) => toast.error(getToastErrorMessage(err)),
  });
}

export function useSyncIntegration() {
  const api = useApi();
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (connectionId: string) =>
      api.post(`/api/v1/integrations/connections/${connectionId}/sync`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['integration-connections'] });
      toast.success('Sync complete.');
    },
    onError: (err) => toast.error(getToastErrorMessage(err)),
  });
}

export interface IntegrationEvent {
  id: string;
  connectionId: string;
  providerId: string;
  direction: string;
  eventType: string;
  status: string;
  errorMessage: string | null;
  createdAt: string;
}

export function useIntegrationEvents() {
  const api = useApi();
  return useQuery({
    queryKey: ['integration-events'],
    queryFn: () =>
      api.get<{ data: IntegrationEvent[] }>('/api/v1/integrations/events').then(
        (r) => r.data,
      ),
  });
}

export function useUpdateConnectionConfig() {
  const api = useApi();
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ id, config }: { id: string; config: Record<string, unknown> }) =>
      api.patch(`/api/v1/integrations/connections/${id}`, { config }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['integration-connections'] });
      toast.success('Saved.');
    },
    onError: (err) => toast.error(getToastErrorMessage(err)),
  });
}
