'use client';

import { useBoard } from './use-boards';
import { useClan } from './use-clans';

// Permission hooks. The whole point: any component that needs to gate an
// edit affordance can call one of these instead of taking a `canEdit` prop
// from its parent. The role data already lives in the `useBoard` /
// `useClan` React Query cache, so this is essentially free — no extra
// fetches, no provider, no prop drilling. Per Hanko editing-patterns.md:
// edit affordances must not render for users without permission, so
// every kanban / clan surface should consult one of these.
//
// Why a hook and not a context: contexts force a provider at the top of
// the tree, which is one more thing for the dojo page to remember. The
// query cache is already global, so a hook over the cache is the
// simpler primitive.

export type DojoRole = 'owner' | 'editor' | 'viewer';
export type ClanRole = 'admin' | 'member' | 'reader';

export interface DojoPermissions {
  /** True for owner / editor. False while loading or for viewers. */
  canEdit: boolean;
  /** True only for owner. Reserved for destructive / settings actions. */
  canManage: boolean;
  /** Raw role string, or undefined if the board hasn't loaded yet. */
  role: DojoRole | undefined;
}

export function useDojoPermissions(boardId: string): DojoPermissions {
  const { data: board } = useBoard(boardId);
  const role = board?.currentUserRole as DojoRole | undefined;
  return {
    canEdit: role === 'owner' || role === 'editor',
    canManage: role === 'owner',
    role,
  };
}

export interface ClanPermissions {
  /** True only for admins. Member / reader cannot edit anything. */
  canManage: boolean;
  /** Raw role string, or undefined if the clan hasn't loaded yet. */
  role: ClanRole | undefined;
}

export function useClanPermissions(clanId: string): ClanPermissions {
  const { data: clan } = useClan(clanId);
  const role = clan?.currentUserRole as ClanRole | undefined;
  return {
    canManage: role === 'admin',
    role,
  };
}
