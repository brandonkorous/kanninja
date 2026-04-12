'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { useApi } from './use-api';
import { useToast } from '@/providers/ToastProvider';
import { getToastErrorMessage } from '@/lib/toast-errors';
import type { Subscription } from '@kanninja/shared';

export function useSubscription() {
  const api = useApi();
  return useQuery({
    queryKey: ['subscription'],
    queryFn: () =>
      api.get<{ data: Subscription }>('/api/v1/subscription').then((r) => r.data),
  });
}

// Checkout and portal redirect on success, so no success toast — the
// page navigation is the feedback. Errors still toast.
export function useCreateCheckout() {
  const api = useApi();
  const toast = useToast();
  return useMutation({
    mutationFn: (input: {
      tier: 'essentials' | 'pro' | 'business' | 'enterprise';
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
