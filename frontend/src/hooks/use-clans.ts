'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from './use-api';
import { useToast } from '@/providers/ToastProvider';
import { getToastErrorMessage } from '@/lib/toast-errors';
import type { Clan, CreateClanInput, UpdateClanInput } from '@kanninja/shared';

// Re-exported as the canonical "clan + my role on it" shape — extends
// the shared Clan type which now includes `isPersonal`. Consumers like
// CreateBoardModal and ClanCard read both fields.
export interface ClanWithRole extends Clan {
  role: 'admin' | 'member' | 'reader';
}

// Single-clan fetch includes the caller's role so the detail page can
// gate admin-only controls without needing a second query.
export interface ClanWithCurrentUserRole extends Clan {
  currentUserRole: 'admin' | 'member' | 'reader';
}

interface ClanMember {
  id: string;
  userId: string;
  role: string;
  joinedAt: string;
  displayName: string | null;
  email: string;
  avatarUrl: string | null;
}

// Boards a clan has access to via its `board_clans` attachments. The
// `clanRole` field is the clan's role on the board (NOT the user's
// role within the clan).
export interface ClanBoard {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  clanRole: 'owner' | 'editor' | 'viewer';
  createdAt: string;
  updatedAt: string;
}

export function useClans() {
  const api = useApi();
  return useQuery({
    queryKey: ['clans'],
    queryFn: () => api.get<{ data: ClanWithRole[] }>('/api/v1/clans').then((r) => r.data),
  });
}

export function useClan(clanId: string) {
  const api = useApi();
  return useQuery({
    queryKey: ['clans', clanId],
    queryFn: () =>
      api
        .get<{ data: ClanWithCurrentUserRole }>(`/api/v1/clans/${clanId}`)
        .then((r) => r.data),
    enabled: !!clanId,
  });
}

export function useClanMembers(clanId: string) {
  const api = useApi();
  return useQuery({
    queryKey: ['clan-members', clanId],
    queryFn: () =>
      api.get<{ data: ClanMember[] }>(`/api/v1/clans/${clanId}/members`).then((r) => r.data),
    enabled: !!clanId,
  });
}

// List the boards this clan has been granted access to. Used by the
// clan detail page to show "dojos this clan can access" alongside
// the members list.
export function useClanBoards(clanId: string) {
  const api = useApi();
  return useQuery({
    queryKey: ['clan-boards', clanId],
    queryFn: () =>
      api.get<{ data: ClanBoard[] }>(`/api/v1/clans/${clanId}/boards`).then((r) => r.data),
    enabled: !!clanId,
  });
}

export function useCreateClan() {
  const api = useApi();
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (input: CreateClanInput) =>
      api.post<{ data: Clan }>('/api/v1/clans', input).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clans'] });
      toast.success('Clan started.');
    },
    onError: (err) => toast.error(getToastErrorMessage(err)),
  });
}

export function useUpdateClan(clanId: string) {
  const api = useApi();
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (input: UpdateClanInput) =>
      api.patch(`/api/v1/clans/${clanId}`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clans'] });
      qc.invalidateQueries({ queryKey: ['clans', clanId] });
      toast.success('Saved.');
    },
    onError: (err) => toast.error(getToastErrorMessage(err)),
  });
}

export function useDeleteClan() {
  const api = useApi();
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (clanId: string) => api.delete(`/api/v1/clans/${clanId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clans'] });
      toast.success('Clan disbanded.');
    },
    onError: (err) => toast.error(getToastErrorMessage(err)),
  });
}

export function useUpdateClanMemberRole(clanId: string) {
  const api = useApi();
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: 'admin' | 'member' | 'reader' }) =>
      api.patch(`/api/v1/clans/${clanId}/members/${memberId}`, { role }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clan-members', clanId] });
      toast.success('Role updated.');
    },
    onError: (err) => toast.error(getToastErrorMessage(err)),
  });
}

export function useRemoveClanMember(clanId: string) {
  const api = useApi();
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (memberId: string) => api.delete(`/api/v1/clans/${clanId}/members/${memberId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clan-members', clanId] });
      toast.success('Member removed.');
    },
    onError: (err) => toast.error(getToastErrorMessage(err)),
  });
}

export function useInviteClanMember(clanId: string) {
  const api = useApi();
  const toast = useToast();
  return useMutation({
    mutationFn: (input: { email: string; role: 'admin' | 'member' | 'reader' }) =>
      api.post(`/api/v1/clans/${clanId}/invitations`, input),
    onSuccess: () => toast.success('Invite ready.'),
    onError: (err) => toast.error(getToastErrorMessage(err)),
  });
}
