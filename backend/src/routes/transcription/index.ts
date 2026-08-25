import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../../middleware/require-auth.js';
import { transcriptionService } from '../../services/transcription.service.js';

export async function transcriptionRoutes(fastify: FastifyInstance) {
  // The only model call left in the product. There is no tier gate and no
  // monthly quota — the old AI-run metering existed to protect margin on
  // reasoning tokens we no longer spend. Whisper is cheap, so a per-user rate
  // limit is the whole defence.
  fastify.post(
    '/api/v1/transcribe',
    {
      preHandler: [requireAuth],
      config: {
        rateLimit: {
          max: 20,
          timeWindow: '1 minute',
          keyGenerator: (request) => request.profileId ?? request.ip,
        },
      },
    },
    async (request) => {
      const { audioBase64 } = z
        .object({ audioBase64: z.string().min(1) })
        .parse(request.body);

      const result = await transcriptionService.transcribe(audioBase64);
      return { data: result };
    },
  );
}
