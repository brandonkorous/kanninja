import { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import { requireAuth } from '../../middleware/require-auth.js';
import { db } from '../../db/index.js';
import { profiles } from '../../db/schema/profiles.js';
import { authUsers } from '../../db/schema/auth.js';
import { AppError } from '../../utils/errors.js';
import {
  AVATAR_MAX_BYTES,
  AVATAR_MIME_TYPES,
  avatarPathFromUrl,
  avatarPublicUrl,
  buildAvatarPath,
  deleteAvatar,
  downloadAvatar,
  extensionForAvatarMime,
  isValidAvatarBlobPath,
  uploadAvatar,
} from '../../config/azure-storage.js';

/**
 * Profile pictures: stored by us, served by us.
 *
 * Until the Azure cutover every avatar was a Clerk URL, which meant deleting
 * the Clerk instance would have blanked every face in the product. Nothing
 * here depends on an outside identity provider.
 *
 * Registered as its own encapsulated plugin because it installs binary
 * content-type parsers. Those must not leak into the rest of the API, which
 * expects JSON — the same mistake that broke every auth route at cutover.
 */
export async function avatarRoutes(fastify: FastifyInstance) {
  for (const mime of AVATAR_MIME_TYPES) {
    fastify.addContentTypeParser(mime, { parseAs: 'buffer' }, (_request, payload, done) => {
      done(null, payload);
    });
  }

  /**
   * Public by design. It backs `<img src>` in every board, and an image tag
   * carries no session — gating it on auth would blank avatars everywhere.
   * The path is a profile UUID plus a SHA-256 of the bytes, so it is not
   * enumerable, and the only thing behind it is a picture the user chose to
   * show to the people they share boards with.
   */
  fastify.get<{ Params: { profileId: string; file: string } }>(
    '/api/v1/avatars/:profileId/:file',
    async (request, reply) => {
      const blobPath = `${request.params.profileId}/${request.params.file}`;

      // This string indexes into storage. Validate before it gets there —
      // anything outside the pattern cannot name a blob we wrote.
      if (!isValidAvatarBlobPath(blobPath)) throw AppError.notFound('Avatar');

      const blob = await downloadAvatar(blobPath);
      if (!blob) throw AppError.notFound('Avatar');

      // Content-addressed, so the bytes behind this URL can never change.
      reply.header('Cache-Control', 'public, max-age=31536000, immutable');
      reply.header('Content-Type', blob.contentType);
      if (blob.contentLength !== undefined) {
        reply.header('Content-Length', String(blob.contentLength));
      }
      return reply.send(blob.body);
    },
  );

  /** Upload: raw image bytes as the body, no multipart wrapper. */
  fastify.post('/api/v1/users/me/avatar', { preHandler: [requireAuth] }, async (request) => {
    const mimeType = (request.headers['content-type'] ?? '').split(';')[0].trim().toLowerCase();
    if (!extensionForAvatarMime(mimeType)) {
      throw AppError.validationError(
        `Unsupported image type. Send one of: ${AVATAR_MIME_TYPES.join(', ')}`,
      );
    }

    const bytes = request.body;
    if (!Buffer.isBuffer(bytes) || bytes.length === 0) {
      throw AppError.validationError('Request body must be the raw image bytes');
    }
    if (bytes.length > AVATAR_MAX_BYTES) {
      throw AppError.validationError(
        `Image is ${Math.round(bytes.length / 1024)}KB; the limit is ${AVATAR_MAX_BYTES / 1024}KB`,
      );
    }

    const profileId = request.profileId!;
    const blobPath = buildAvatarPath(profileId, bytes, mimeType);
    await uploadAvatar(blobPath, bytes, mimeType);

    const url = avatarPublicUrl(blobPath);
    const previous = await setAvatarUrl(profileId, url);

    // Best-effort, and only for a blob we own. A leftover image costs pennies;
    // a failed cleanup that took down the upload would cost the user their
    // profile picture.
    await discardPreviousAvatar(previous, blobPath, request.log);

    return { data: { avatarUrl: url } };
  });

  fastify.delete('/api/v1/users/me/avatar', { preHandler: [requireAuth] }, async (request, reply) => {
    const previous = await setAvatarUrl(request.profileId!, null);
    await discardPreviousAvatar(previous, null, request.log);
    return reply.status(204).send();
  });
}

/**
 * Writes the avatar to BOTH tables and returns whatever was there before.
 *
 * `auth_users.image` is what Better Auth puts in the session, and the header
 * reads it from there while the rest of the app reads `profiles.avatar_url`.
 * Updating one without the other leaves a user looking at two different faces.
 */
async function setAvatarUrl(profileId: string, url: string | null): Promise<string | null> {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .update(profiles)
      .set({ avatarUrl: url, updatedAt: new Date() })
      .where(eq(profiles.id, profileId))
      .returning({ userId: profiles.userId });

    if (!row) throw AppError.notFound('Profile');

    const [user] = await tx
      .update(authUsers)
      .set({ image: url, updatedAt: new Date() })
      .where(eq(authUsers.id, row.userId))
      .returning({ previous: authUsers.image });

    return user?.previous ?? null;
  });
}

async function discardPreviousAvatar(
  previousUrl: string | null,
  keepPath: string | null,
  log: { error: (obj: object, msg: string) => void },
): Promise<void> {
  if (!previousUrl) return;
  const previousPath = avatarPathFromUrl(previousUrl);
  // Null when the old value was a Clerk URL, or when re-uploading identical
  // bytes produced the same content hash. Nothing of ours to delete either way.
  if (!previousPath || previousPath === keepPath) return;

  await deleteAvatar(previousPath).catch((error) => {
    log.error({ err: error, path: previousPath }, 'Old avatar blob delete failed — orphaned');
  });
}
