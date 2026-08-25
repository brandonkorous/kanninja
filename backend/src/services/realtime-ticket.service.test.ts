import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../config/env.js', () => ({
  env: { BETTER_AUTH_SECRET: 'test-secret-at-least-32-characters-long', MCP_JWT_SECRET: '' },
}));

const { issueTicket, verifyTicket } = await import('./realtime-ticket.service.js');

const claims = {
  profileId: 'profile-1',
  boardId: 'board-1',
  displayName: 'Aiko',
  avatarUrl: null,
};

beforeEach(() => vi.useRealTimers());
afterEach(() => vi.useRealTimers());

describe('realtime tickets', () => {
  it('round-trips the claims it was issued with', () => {
    const { ticket } = issueTicket(claims);
    expect(verifyTicket(ticket)).toEqual(claims);
  });

  it('issues a distinct ticket each time for identical claims', () => {
    // A nonce means two tabs opening the same board don't share a ticket.
    expect(issueTicket(claims).ticket).not.toBe(issueTicket(claims).ticket);
  });

  it('rejects a tampered payload', () => {
    // The whole point: escalating to another board must not verify.
    const { ticket } = issueTicket(claims);
    const [version, body, signature] = ticket.split('.');
    const forged = Buffer.from(
      JSON.stringify({ ...claims, boardId: 'someone-elses-board', exp: Date.now() + 60_000 }),
    ).toString('base64url');

    expect(verifyTicket(`${version}.${forged}.${signature}`)).toBeNull();
    expect(body).not.toBe(forged);
  });

  it('rejects a tampered signature', () => {
    const { ticket } = issueTicket(claims);
    const [version, body, signature] = ticket.split('.');
    const flipped = signature.slice(0, -1) + (signature.endsWith('A') ? 'B' : 'A');

    expect(verifyTicket(`${version}.${body}.${flipped}`)).toBeNull();
  });

  it('rejects an expired ticket', () => {
    const { ticket } = issueTicket(claims);
    // TTL is 60s.
    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + 61_000);

    expect(verifyTicket(ticket)).toBeNull();
  });

  it('rejects malformed and unversioned input', () => {
    for (const bad of ['', 'garbage', 'a.b', 'a.b.c.d', 'v2.abc.def']) {
      expect(verifyTicket(bad)).toBeNull();
    }
  });

  it('rejects a well-signed ticket that is missing required claims', () => {
    // Signature valid, contents useless — must not yield a usable identity.
    const { ticket } = issueTicket({ ...claims, profileId: '', boardId: '' });
    expect(verifyTicket(ticket)).toBeNull();
  });
});
