import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../../middleware/require-auth.js';
import { requireBoardRole } from '../../middleware/require-board-role.js';
import { db } from '../../db/index.js';
import { cardAttachments } from '../../db/schema/card-features.js';
import { cards } from '../../db/schema/cards.js';
import { lists } from '../../db/schema/lists.js';
import { eq, and, desc } from 'drizzle-orm';
import {
  buildAttachmentPath,
  createUploadUrl,
  createDownloadUrl,
  deleteBlob,
} from '../../config/azure-storage.js';
import { AppError } from '../../utils/errors.js';

const createUploadUrlSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileSize: z.number().int().positive(),
  mimeType: z.string().min(1),
});

// `filePath` is NOT taken from the client on finalize. It used to be, which
// let a caller record any path they liked — including one pointing at another
// tenant's blob. The server now hands out the path with the upload URL and
// re-derives nothing from the request body.
const finalizeSchema = z.object({
  fileName: z.string().min(1).max(255),
  filePath: z.string().min(1),
  fileSize: z.number().int().positive(),
  mimeType: z.string().min(1),
});

/**
 * Asserts the card actually belongs to the board in the URL.
 *
 * `requireBoardRole` only checks the caller's role on `:boardId` — it says
 * nothing about `:cardId`. Without this join, quoting a board you own plus
 * someone else's card id reads and writes across the tenant boundary.
 */
async function assertCardInBoard(cardId: string, boardId: string): Promise<void> {
  const [row] = await db
    .select({ id: cards.id })
    .from(cards)
    .innerJoin(lists, eq(cards.listId, lists.id))
    .where(and(eq(cards.id, cardId), eq(lists.boardId, boardId)))
    .limit(1);

  if (!row) throw AppError.notFound('Card');
}

/** Loads an attachment, proving it belongs to the card AND the board. */
async function loadAttachmentInBoard(attachmentId: string, cardId: string, boardId: string) {
  const [row] = await db
    .select({
      id: cardAttachments.id,
      filePath: cardAttachments.filePath,
    })
    .from(cardAttachments)
    .innerJoin(cards, eq(cardAttachments.cardId, cards.id))
    .innerJoin(lists, eq(cards.listId, lists.id))
    .where(
      and(
        eq(cardAttachments.id, attachmentId),
        eq(cardAttachments.cardId, cardId),
        eq(lists.boardId, boardId),
      ),
    )
    .limit(1);

  if (!row) throw AppError.notFound('Attachment');
  return row;
}

export async function attachmentRoutes(fastify: FastifyInstance) {
  // List attachments for a card
  fastify.get<{ Params: { boardId: string; cardId: string } }>(
    '/api/v1/boards/:boardId/cards/:cardId/attachments',
    { preHandler: [requireAuth, requireBoardRole('viewer')] },
    async (request) => {
      await assertCardInBoard(request.params.cardId, request.params.boardId);

      const data = await db
        .select()
        .from(cardAttachments)
        .where(eq(cardAttachments.cardId, request.params.cardId))
        .orderBy(desc(cardAttachments.createdAt));
      return { data };
    },
  );

  // Generate a SAS upload URL
  fastify.post<{ Params: { boardId: string; cardId: string } }>(
    '/api/v1/boards/:boardId/cards/:cardId/attachments/upload-url',
    { preHandler: [requireAuth, requireBoardRole('editor')] },
    async (request) => {
      const input = createUploadUrlSchema.parse(request.body);
      await assertCardInBoard(request.params.cardId, request.params.boardId);

      // Sanitises the file name and namespaces the blob under the card.
      const filePath = buildAttachmentPath(request.params.cardId, input.fileName);

      return {
        data: {
          uploadUrl: createUploadUrl(filePath),
          path: filePath,
          // Azure rejects a block-blob PUT without this header.
          requiredHeaders: { 'x-ms-blob-type': 'BlockBlob' },
        },
      };
    },
  );

  // Finalize upload (record metadata in DB)
  fastify.post<{ Params: { boardId: string; cardId: string } }>(
    '/api/v1/boards/:boardId/cards/:cardId/attachments',
    { preHandler: [requireAuth, requireBoardRole('editor')] },
    async (request, reply) => {
      const input = finalizeSchema.parse(request.body);
      await assertCardInBoard(request.params.cardId, request.params.boardId);

      // The path must be one we issued for THIS card. Cheap to verify and it
      // stops a client claiming an arbitrary blob as its attachment.
      if (!input.filePath.startsWith(`${request.params.cardId}/`)) {
        throw AppError.validationError('filePath does not belong to this card');
      }

      const [att] = await db
        .insert(cardAttachments)
        .values({
          cardId: request.params.cardId,
          userId: request.profileId!,
          fileName: input.fileName,
          filePath: input.filePath,
          fileSize: input.fileSize,
          mimeType: input.mimeType,
        })
        .returning();
      return reply.status(201).send({ data: att });
    },
  );

  // Get a SAS download URL
  fastify.get<{ Params: { boardId: string; cardId: string; attachmentId: string } }>(
    '/api/v1/boards/:boardId/cards/:cardId/attachments/:attachmentId/url',
    { preHandler: [requireAuth, requireBoardRole('viewer')] },
    async (request) => {
      const att = await loadAttachmentInBoard(
        request.params.attachmentId,
        request.params.cardId,
        request.params.boardId,
      );

      return { data: { url: createDownloadUrl(att.filePath) } };
    },
  );

  // Delete attachment
  fastify.delete<{ Params: { boardId: string; cardId: string; attachmentId: string } }>(
    '/api/v1/boards/:boardId/cards/:cardId/attachments/:attachmentId',
    { preHandler: [requireAuth, requireBoardRole('editor')] },
    async (request, reply) => {
      const att = await loadAttachmentInBoard(
        request.params.attachmentId,
        request.params.cardId,
        request.params.boardId,
      );

      // Row first: a failed blob delete would otherwise leave a row pointing at
      // nothing, which reads as data loss. An orphaned blob is just cost.
      await db.delete(cardAttachments).where(eq(cardAttachments.id, att.id));
      await deleteBlob(att.filePath).catch((error) => {
        request.log.error({ err: error, path: att.filePath }, 'Blob delete failed — orphaned');
      });

      return reply.status(204).send();
    },
  );
}
