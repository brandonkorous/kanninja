import { describe, it, expect, beforeAll } from 'vitest';

// The blob path is user-influenced and indexes straight into storage, so the
// validator is the whole defence. These tests exist for the rejections.
let mod: typeof import('./azure-storage.js');

beforeAll(async () => {
  process.env.PUBLIC_API_URL = 'https://api.kanninja.com';
  mod = await import('./azure-storage.js');
});

const UUID = '11111111-2222-3333-4444-555555555555';
const HASH = 'a'.repeat(64);

describe('isValidAvatarBlobPath', () => {
  it('accepts a uuid + sha256 + known extension', () => {
    for (const ext of ['jpg', 'png', 'webp', 'gif']) {
      expect(mod.isValidAvatarBlobPath(`${UUID}/${HASH}.${ext}`)).toBe(true);
    }
  });

  it.each([
    ['traversal out of the container', `${UUID}/../../etc/passwd`],
    ['traversal in the profile segment', `../${UUID}/${HASH}.jpg`],
    ['a nested extra segment', `${UUID}/nested/${HASH}.jpg`],
    ['a non-uuid owner', `not-a-uuid/${HASH}.jpg`],
    ['a short digest', `${UUID}/${'a'.repeat(63)}.jpg`],
    ['a non-hex digest', `${UUID}/${'z'.repeat(64)}.jpg`],
    ['an unexpected extension', `${UUID}/${HASH}.svg`],
    ['no extension', `${UUID}/${HASH}`],
    ['an empty path', ''],
  ])('rejects %s', (_label, path) => {
    expect(mod.isValidAvatarBlobPath(path)).toBe(false);
  });
});

describe('avatar URLs', () => {
  it('round-trips a path through the public URL', () => {
    const path = `${UUID}/${HASH}.png`;
    expect(mod.avatarPathFromUrl(mod.avatarPublicUrl(path))).toBe(path);
  });

  it('returns null for a Clerk URL, so the migration knows it is not ours', () => {
    expect(mod.avatarPathFromUrl('https://img.clerk.com/eyJ0eXBlIjoicHJveHkifQ')).toBeNull();
  });

  it('returns null when the URL carries a malformed path', () => {
    expect(
      mod.avatarPathFromUrl('https://api.kanninja.com/api/v1/avatars/../../secret'),
    ).toBeNull();
  });
});

describe('buildAvatarPath', () => {
  it('names the blob after the digest of its bytes', () => {
    const a = mod.buildAvatarPath(UUID, Buffer.from('one'), 'image/png');
    const b = mod.buildAvatarPath(UUID, Buffer.from('one'), 'image/png');
    const c = mod.buildAvatarPath(UUID, Buffer.from('two'), 'image/png');

    expect(a).toBe(b); // identical bytes reuse the URL, so caches stay valid
    expect(a).not.toBe(c); // different bytes must not collide
    expect(mod.isValidAvatarBlobPath(a)).toBe(true);
  });

  it('refuses a type it cannot name an extension for', () => {
    expect(() => mod.buildAvatarPath(UUID, Buffer.from('x'), 'image/svg+xml')).toThrow();
  });

  it('tolerates a charset parameter on the content type', () => {
    expect(mod.extensionForAvatarMime('image/JPEG; charset=binary')).toBe('jpg');
  });
});
