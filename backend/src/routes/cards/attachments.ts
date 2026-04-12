import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../../middleware/require-auth.js';
import { requireBoardRole } from '../../middleware/require-board-role.js';
import { db } from '../../db/index.js';
import { cardAttachments } from '../../db/schema/card-features.js';
import { eq, desc } from 'drizzle-orm';
import { supabase } from '../../config/supabase.js';
import { AppError } from '../../utils/errors.js';

const BUCKET = 'card-attachments';

const createUploadUrlSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileSize: z.number().int().positive(),
  mimeType: z.string().min(1),
});

const finalizeSchema = z.object({
  fileName: z.string(),
  filePath: z.string(),
  fileSize: z.number().int().positive(),
  mimeType: z.string(),
});

export async function attachmentRoutes(fastify: FastifyInstance) {
  // List attachments for a card
  fastify.get<{ Params: { boardId: string; cardId: string } }>(
    '/api/v1/boards/:boardId/cards/:cardId/attachments',
    { preHandler: [requireAuth, requireBoardRole('viewer')] },
    async (request) => {
      const data = await db
        .select()
        .from(cardAttachments)
        .where(eq(cardAttachments.cardId, request.params.cardId))
        .orderBy(desc(cardAttachments.createdAt));
      return { data };
    },
  );

  // Generate a signed upload URL
  fastify.post<{ Params: { boardId: string; cardId: string } }>(
    '/api/v1/boards/:boardId/cards/:cardId/attachments/upload-url',
    { preHandler: [requireAuth, requireBoardRole('editor')] },
    async (request) => {
      const input = createUploadUrlSchema.parse(request.body);
      const filePath = `${request.params.cardId}/${Date.now()}-${input.fileName}`;

      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUploadUrl(filePath);

      if (error || !data) {
        throw new AppError(
          'INTERNAL_ERROR',
          `Failed to create upload URL: ${error?.message ?? 'unknown'}`,
          500,
        );
      }

      return {
        data: {
          uploadUrl: data.signedUrl,
          token: data.token,
          path: filePath,
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

  // Get a signed download URL
  fastify.get<{ Params: { boardId: string; cardId: string; attachmentId: string } }>(
    '/api/v1/boards/:boardId/cards/:cardId/attachments/:attachmentId/url',
    { preHandler: [requireAuth, requireBoardRole('viewer')] },
    async (request) => {
      const [att] = await db
        .select()
        .from(cardAttachments)
        .where(eq(cardAttachments.id, request.params.attachmentId))
        .limit(1);

      if (!att) throw AppError.notFound('Attachment');

      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(att.filePath, 3600);

      if (error || !data) {
        throw new AppError(
          'INTERNAL_ERROR',
          `Failed to create download URL: ${error?.message ?? 'unknown'}`,
          500,
        );
      }

      return { data: { url: data.signedUrl } };
    },
  );

  // Delete attachment
  fastify.delete<{ Params: { boardId: string; cardId: string; attachmentId: string } }>(
    '/api/v1/boards/:boardId/cards/:cardId/attachments/:attachmentId',
    { preHandler: [requireAuth, requireBoardRole('editor')] },
    async (request, reply) => {
      const [att] = await db
        .select()
        .from(cardAttachments)
        .where(eq(cardAttachments.id, request.params.attachmentId))
        .limit(1);

      if (att) {
        await supabase.storage.from(BUCKET).remove([att.filePath]);
        await db.delete(cardAttachments).where(eq(cardAttachments.id, att.id));
      }

      return reply.status(204).send();
    },
  );
}
