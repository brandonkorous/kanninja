'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { useApi } from './use-api';
import { useToast } from '@/providers/ToastProvider';
import { getToastErrorMessage } from '@/lib/toast-errors';
import type { Subscription, SubscriptionUsage, AIQuotaStatus } from '@kanninja/shared';

export function useSubscription() {
  const api = useApi();
  return useQuery({
    queryKey: ['subscription'],
    queryFn: () =>
      api.get<{ data: Subscription }>('/api/v1/subscription').then((r) => r.data),
  });
}

/** Seat usage for the billing UI — separate query so it can refetch on
 *  invalidation (e.g. after a member is added/removed) without re-syncing
 *  the full subscription. */
export function useSubscriptionUsage() {
  const api = useApi();
  return useQuery({
    queryKey: ['subscription', 'usage'],
    queryFn: () =>
      api.get<{ data: SubscriptionUsage }>('/api/v1/subscription/usage').then((r) => r.data),
  });
}

/** AI run consumption — drives the "X / Y used" indicator and lets the UI
 *  gate AI actions when the user's at their cap. Cheap to refetch (one
 *  count query against the ai_interactions table). */
export function useAIUsage() {
  const api = useApi();
  return useQuery({
    queryKey: ['subscription', 'ai-usage'],
    queryFn: () =>
      api.get<{ data: AIQuotaStatus }>('/api/v1/subscription/ai-usage').then((r) => r.data),
  });
}

// Checkout and portal redirect on success, so no success toast — the
// page navigation is the feedback. Errors still toast.
export function useCreateCheckout() {
  const api = useApi();
  const toast = useToast();
  return useMutation({
    mutationFn: (input: {
      tier: 'clan' | 'pro' | 'business' | 'enterprise';
      interval: 'monthly' | 'yearly';
      successUrl: string;
      cancelUrl: string;
    }) =>
      api.post<{ data: { url: string } }>('/api/v1/subscription/checkout', input).then((r) => r.data),
    onError: (err) => toast.error(getToastErrorMessage(err)),
  });
}

export function useCustomerPortal() {
  const api = useApi();
  const toast = useToast();
  return useMutation({
    mutationFn: (returnUrl: string) =>
      api
        .post<{ data: { url: string } }>('/api/v1/subscription/portal', { returnUrl })
        .then((r) => r.data),
    onError: (err) => toast.error(getToastErrorMessage(err)),
  });
}
