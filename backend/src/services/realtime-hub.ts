import type { WebSocket } from 'ws';

/**
 * In-process pub/sub for board channels.
 *
 * Deliberately tiny: five broadcast event types and a presence roster, with no
 * history, no persistence and no delivery guarantee — the same contract
 * Supabase Realtime broadcast gave us, which callers already treat as
 * best-effort.
 *
 * SCALING LIMIT — this fans out only to sockets on THIS pod. That is correct
 * at `replicas: 1` (see k8s/backend-deployment.yaml) and silently wrong above
 * it: broadcasts would reach a fraction of clients and presence rosters would
 * fragment per-pod. `publish` is the seam where a Redis pub/sub bus plugs in
 * before scaling out; nothing else needs to change.
 */

export interface PresenceIdentity {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
}

interface Member {
  socket: WebSocket;
  identity: PresenceIdentity;
}

const channels = new Map<string, Set<Member>>();

function roster(boardId: string): PresenceIdentity[] {
  const members = channels.get(boardId);
  if (!members) return [];

  // Dedupe by userId — multi-tab, HMR and strict-mode remounts all produce
  // several sockets for one person.
  const byUserId = new Map<string, PresenceIdentity>();
  for (const member of members) {
    if (!byUserId.has(member.identity.userId)) {
      byUserId.set(member.identity.userId, member.identity);
    }
  }
  return Array.from(byUserId.values());
}

function send(socket: WebSocket, message: unknown): void {
  // readyState 1 === OPEN. A socket can close between iteration and send.
  if (socket.readyState !== 1) return;
  try {
    socket.send(JSON.stringify(message));
  } catch {
    // Best-effort by contract.
  }
}

function broadcastPresence(boardId: string): void {
  const users = roster(boardId);
  const members = channels.get(boardId);
  if (!members) return;
  for (const member of members) {
    send(member.socket, { type: 'presence', users });
  }
}

export const realtimeHub = {
  join(boardId: string, socket: WebSocket, identity: PresenceIdentity): void {
    let members = channels.get(boardId);
    if (!members) {
      members = new Set();
      channels.set(boardId, members);
    }
    members.add({ socket, identity });
    broadcastPresence(boardId);
  },

  leave(boardId: string, socket: WebSocket): void {
    const members = channels.get(boardId);
    if (!members) return;

    for (const member of members) {
      if (member.socket === socket) {
        members.delete(member);
        break;
      }
    }

    if (members.size === 0) {
      channels.delete(boardId);
      return;
    }
    broadcastPresence(boardId);
  },

  /** Fan out a mutation event to everyone watching the board. */
  publish(boardId: string, event: string, payload: Record<string, unknown>): void {
    const members = channels.get(boardId);
    if (!members) return;
    for (const member of members) {
      send(member.socket, { type: 'event', event, payload });
    }
  },

  /** Test/diagnostic helper. */
  stats(): { channels: number; sockets: number } {
    let sockets = 0;
    for (const members of channels.values()) sockets += members.size;
    return { channels: channels.size, sockets };
  },
};
