import {
  BlobServiceClient,
  StorageSharedKeyCredential,
  BlobSASPermissions,
  SASProtocol,
  generateBlobSASQueryParameters,
} from '@azure/storage-blob';
import { createHash } from 'node:crypto';
import { env } from './env.js';

/**
 * Azure Blob Storage, replacing Supabase Storage for card attachments.
 *
 * Auth is the storage account key. Azure Workload Identity is the eventual
 * goal, but it needs a dedicated k8s ServiceAccount — the backend currently
 * runs as `default` — plus projected tokens and user-delegation SAS. The key
 * never leaves the backend: browsers only ever receive short-lived SAS URLs.
 *
 * Uploads and downloads go browser↔Azure directly, so attachment bytes never
 * transit the cluster.
 */

const UPLOAD_TTL_MINUTES = 15;
const DOWNLOAD_TTL_MINUTES = 60;
// Azure rejects a SAS that isn't yet valid if the caller's clock runs fast.
const CLOCK_SKEW_MINUTES = 5;

export const ATTACHMENTS_CONTAINER = env.AZURE_STORAGE_CONTAINER;

function assertConfigured(): void {
  if (!env.AZURE_STORAGE_ACCOUNT || !env.AZURE_STORAGE_KEY) {
    throw new Error(
      'AZURE_STORAGE_ACCOUNT and AZURE_STORAGE_KEY are required for attachments.',
    );
  }
}

let cachedCredential: StorageSharedKeyCredential | null = null;
function credential(): StorageSharedKeyCredential {
  assertConfigured();
  cachedCredential ??= new StorageSharedKeyCredential(
    env.AZURE_STORAGE_ACCOUNT,
    env.AZURE_STORAGE_KEY,
  );
  return cachedCredential;
}

let cachedClient: BlobServiceClient | null = null;
function blobService(): BlobServiceClient {
  cachedClient ??= new BlobServiceClient(
    `https://${env.AZURE_STORAGE_ACCOUNT}.blob.core.windows.net`,
    credential(),
  );
  return cachedClient;
}

function sasUrl(blobPath: string, permissions: BlobSASPermissions, ttlMinutes: number): string {
  const now = Date.now();
  const sas = generateBlobSASQueryParameters(
    {
      containerName: ATTACHMENTS_CONTAINER,
      blobName: blobPath,
      permissions,
      startsOn: new Date(now - CLOCK_SKEW_MINUTES * 60_000),
      expiresOn: new Date(now + ttlMinutes * 60_000),
      protocol: SASProtocol.Https,
    },
    credential(),
  ).toString();

  const encodedPath = blobPath.split('/').map(encodeURIComponent).join('/');
  return (
    `https://${env.AZURE_STORAGE_ACCOUNT}.blob.core.windows.net/` +
    `${ATTACHMENTS_CONTAINER}/${encodedPath}?${sas}`
  );
}

/**
 * A URL the browser can PUT the file to directly.
 *
 * The client MUST send `x-ms-blob-type: BlockBlob` on that PUT. Azure rejects
 * the request without it, and the failure looks like a generic 400 rather than
 * anything that names the missing header.
 */
export function createUploadUrl(blobPath: string): string {
  return sasUrl(blobPath, BlobSASPermissions.from({ create: true, write: true }), UPLOAD_TTL_MINUTES);
}

export function createDownloadUrl(blobPath: string): string {
  return sasUrl(blobPath, BlobSASPermissions.from({ read: true }), DOWNLOAD_TTL_MINUTES);
}

export async function deleteBlob(blobPath: string): Promise<void> {
  await blobService()
    .getContainerClient(ATTACHMENTS_CONTAINER)
    .getBlockBlobClient(blobPath)
    .deleteIfExists();
}

export async function blobExists(blobPath: string): Promise<boolean> {
  return blobService()
    .getContainerClient(ATTACHMENTS_CONTAINER)
    .getBlockBlobClient(blobPath)
    .exists();
}

/**
 * Builds the storage path for a new attachment.
 *
 * `fileName` is user-supplied and lands in a path, so it is sanitised here
 * rather than at the route: strip any directory component, reject traversal,
 * and collapse anything outside a conservative allowlist. Without this a
 * crafted name can write outside its card's prefix.
 */
export function buildAttachmentPath(cardId: string, fileName: string): string {
  const base = fileName.replace(/^.*[/\\]/, '');
  const safe = base
    .replace(/[^A-Za-z0-9._-]/g, '_')
    .replace(/^\.+/, '')
    .slice(0, 200);

  if (!safe) throw new Error('File name is empty after sanitisation');

  return `${cardId}/${Date.now()}-${safe}`;
}

/* ------------------------------------------------------------------ */
/* Avatars                                                            */
/* ------------------------------------------------------------------ */

/**
 * Avatars live in their OWN container, and that container is PRIVATE.
 *
 * They are deliberately not served the way attachments are. A SAS URL expires,
 * and an expiring URL is wrong for an `<img src>` that sits in the DB and gets
 * rendered by every board member for years — the image would 403 the moment
 * the signature aged out, and the browser could never cache it. So avatar
 * bytes are streamed back through the API instead, at a stable content-hashed
 * URL that can be cached forever.
 *
 * The alternative was a public container, which would have meant enabling
 * anonymous blob access on the storage account. That is a Terraform change in
 * the sparx repo for a benefit we do not need: the API route is a dozen lines
 * and keeps the account locked down.
 */
export const AVATARS_CONTAINER = env.AZURE_AVATARS_CONTAINER;

const AVATAR_MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

export const AVATAR_MIME_TYPES = Object.keys(AVATAR_MIME_EXTENSIONS);
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

/** `<uuid>/<64 hex>.<ext>` and nothing else — this value indexes into storage. */
const AVATAR_BLOB_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[0-9a-f]{64}\.(?:jpg|png|webp|gif)$/;

export function isValidAvatarBlobPath(blobPath: string): boolean {
  return AVATAR_BLOB_PATTERN.test(blobPath);
}

export function extensionForAvatarMime(mimeType: string): string | null {
  return AVATAR_MIME_EXTENSIONS[mimeType.toLowerCase().split(';')[0].trim()] ?? null;
}

/**
 * Content-addressed: the digest of the bytes IS the file name.
 *
 * That is what makes `Cache-Control: immutable` honest. Change the picture and
 * the URL changes with it, so no cache anywhere is ever holding a stale image
 * under a name that is supposed to be current.
 */
export function buildAvatarPath(profileId: string, bytes: Buffer, mimeType: string): string {
  const ext = extensionForAvatarMime(mimeType);
  if (!ext) throw new Error(`Unsupported avatar type: ${mimeType}`);
  const digest = createHash('sha256').update(bytes).digest('hex');
  return `${profileId}/${digest}.${ext}`;
}

/** The value that goes in `profiles.avatar_url`. */
export function avatarPublicUrl(blobPath: string): string {
  return `${env.PUBLIC_API_URL.replace(/\/+$/, '')}/api/v1/avatars/${blobPath}`;
}

/** Extracts the blob path back out of a stored avatar URL, or null. */
export function avatarPathFromUrl(url: string): string | null {
  const marker = '/api/v1/avatars/';
  const at = url.indexOf(marker);
  if (at === -1) return null;
  const path = url.slice(at + marker.length);
  return isValidAvatarBlobPath(path) ? path : null;
}

/**
 * Creates the container if it is missing. Called once at upload time rather
 * than at boot so a storage outage cannot stop the API from starting.
 */
export async function ensureAvatarsContainer(): Promise<void> {
  // No public-access argument: the container stays private on purpose.
  await blobService().getContainerClient(AVATARS_CONTAINER).createIfNotExists();
}

export async function uploadAvatar(
  blobPath: string,
  bytes: Buffer,
  mimeType: string,
): Promise<void> {
  await ensureAvatarsContainer();
  await blobService()
    .getContainerClient(AVATARS_CONTAINER)
    .getBlockBlobClient(blobPath)
    .uploadData(bytes, {
      blobHTTPHeaders: {
        blobContentType: mimeType,
        blobCacheControl: 'public, max-age=31536000, immutable',
      },
    });
}

export async function downloadAvatar(
  blobPath: string,
): Promise<{ body: NodeJS.ReadableStream; contentType: string; contentLength?: number } | null> {
  const client = blobService().getContainerClient(AVATARS_CONTAINER).getBlockBlobClient(blobPath);

  try {
    const response = await client.download();
    if (!response.readableStreamBody) return null;
    return {
      body: response.readableStreamBody,
      contentType: response.contentType ?? 'application/octet-stream',
      contentLength: response.contentLength,
    };
  } catch (error) {
    // 404 is the ordinary "no such avatar" path, not a failure worth throwing.
    if ((error as { statusCode?: number }).statusCode === 404) return null;
    throw error;
  }
}

export async function deleteAvatar(blobPath: string): Promise<void> {
  await blobService()
    .getContainerClient(AVATARS_CONTAINER)
    .getBlockBlobClient(blobPath)
    .deleteIfExists();
}
