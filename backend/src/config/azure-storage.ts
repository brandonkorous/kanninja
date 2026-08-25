import {
  BlobServiceClient,
  StorageSharedKeyCredential,
  BlobSASPermissions,
  SASProtocol,
  generateBlobSASQueryParameters,
} from '@azure/storage-blob';
import { env } from './env.js';

/**
 * Azure Blob Storage, replacing Supabase Storage for card attachments.
 *
 * Auth is the storage account key. Workload identity federation from GKE to
 * Entra is possible (Entra accepts GKE's OIDC issuer) and is the eventual
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
