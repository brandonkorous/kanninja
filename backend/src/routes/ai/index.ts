import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../../middleware/require-auth.js';
import { requireAIQuota } from '../../middleware/require-ai-quota.js';
import { aiService } from '../../services/ai.service.js';

export async function aiRoutes(fastify: FastifyInstance) {
  // Every paid tier — and Free up to its 50-run lifetime taste — can hit AI
  // routes. The gate is the quota, not the tier. The tier only sets the cap.
  const aiPreHandler = [requireAuth, requireAIQuota];

  fastify.post(
    '/api/v1/ai/parse-task',
    { preHandler: aiPreHandler },
    async (request) => {
      const { text } = z.object({ text: z.string().min(1) }).parse(request.body);
      const result = await aiService.parseTask(request.profileId!, text);
      return { data: result };
    },
  );

  fastify.post(
    '/api/v1/ai/voice-to-task',
    { preHandler: aiPreHandler },
    async (request) => {
      const { audioBase64 } = z.object({ audioBase64: z.string() }).parse(request.body);
      const result = await aiService.voiceToTask(request.profileId!, audioBase64);
      return { data: result };
    },
  );

  fastify.post(
    '/api/v1/ai/suggestions',
    { preHandler: aiPreHandler },
    async (request) => {
      const { title, type } = z
        .object({
          title: z.string().min(1),
          type: z.enum(['subtasks', 'priority', 'optimization']),
        })
        .parse(request.body);
      const result = await aiService.getSuggestions(request.profileId!, title, type);
      return { data: result };
    },
  );

  fastify.post(
    '/api/v1/ai/generate-template/lists',
    { preHandler: aiPreHandler },
    async (request) => {
      const { request: req } = z
        .object({ request: z.string().min(1) })
        .parse(request.body);
      const result = await aiService.generateTemplateLists(request.profileId!, req);
      return { data: result };
    },
  );

  fastify.post(
    '/api/v1/ai/generate-template/cards',
    { preHandler: aiPreHandler },
    async (request) => {
      const input = z
        .object({
          request: z.string().min(1),
          boardTitle: z.string().min(1),
          lists: z.array(z.string().min(1)).min(1).max(10),
        })
        .parse(request.body);
      const result = await aiService.generateTemplateCards(
        request.profileId!,
        input.request,
        input.boardTitle,
        input.lists,
      );
      return { data: result };
    },
  );

  fastify.post(
    '/api/v1/ai/review-card',
    { preHandler: aiPreHandler },
    async (request) => {
      const input = z
        .object({
          title: z.string().min(1),
          description: z.string().nullable(),
          priority: z.string(),
          estimatedHours: z.number().nullable(),
        })
        .parse(request.body);
      const result = await aiService.reviewCard(request.profileId!, input);
      return { data: result };
    },
  );

  fastify.post(
    '/api/v1/ai/generate-checklist',
    { preHandler: aiPreHandler },
    async (request) => {
      const input = z
        .object({
          title: z.string().min(1),
          description: z.string().optional(),
          priority: z.string().optional(),
          estimatedHours: z.number().optional(),
        })
        .parse(request.body);
      const result = await aiService.generateChecklist(request.profileId!, input);
      return { data: result };
    },
  );

  fastify.post(
    '/api/v1/ai/smart-due-date',
    { preHandler: aiPreHandler },
    async (request) => {
      const input = z
        .object({
          title: z.string().min(1),
          description: z.string().optional(),
          estimatedHours: z.number().optional(),
        })
        .parse(request.body);
      const result = await aiService.smartDueDate(request.profileId!, input);
      return { data: result };
    },
  );

  fastify.post(
    '/api/v1/ai/smart-start-date',
    { preHandler: aiPreHandler },
    async (request) => {
      const input = z
        .object({
          title: z.string().min(1),
          description: z.string().optional(),
          dueDate: z.string().datetime(),
          estimatedHours: z.number().optional(),
        })
        .parse(request.body);
      const result = await aiService.smartStartDate(request.profileId!, input);
      return { data: result };
    },
  );

  fastify.post(
    '/api/v1/ai/decompose-goal',
    { preHandler: aiPreHandler },
    async (request) => {
      const input = z
        .object({ goal: z.string().min(1), timeframe: z.string().optional() })
        .parse(request.body);
      const result = await aiService.decomposeGoal(request.profileId!, input);
      return { data: result };
    },
  );

  fastify.post(
    '/api/v1/ai/analyze-dependencies',
    { preHandler: aiPreHandler },
    async (request) => {
      const { boardId } = z.object({ boardId: z.string().uuid() }).parse(request.body);
      const result = await aiService.analyzeDependencies(request.profileId!, boardId);
      return { data: result };
    },
  );

  fastify.post(
    '/api/v1/ai/balance-workload',
    { preHandler: aiPreHandler },
    async (request) => {
      const { boardId } = z.object({ boardId: z.string().uuid() }).parse(request.body);
      const result = await aiService.balanceWorkload(request.profileId!, boardId);
      return { data: result };
    },
  );

  fastify.post(
    '/api/v1/ai/analyze-meeting',
    { preHandler: aiPreHandler },
    async (request) => {
      const { transcript, boardId } = z
        .object({ transcript: z.string().min(1), boardId: z.string().uuid().optional() })
        .parse(request.body);
      const result = await aiService.analyzeMeeting(request.profileId!, transcript, boardId);
      return { data: result };
    },
  );

  fastify.post(
    '/api/v1/ai/briefing',
    { preHandler: aiPreHandler },
    async (request) => {
      const { type, boardId } = z
        .object({ type: z.enum(['daily', 'weekly']), boardId: z.string().uuid().optional() })
        .parse(request.body);
      const result = await aiService.getBriefing(request.profileId!, type, boardId);
      return { data: result };
    },
  );

  fastify.post(
    '/api/v1/ai/productivity-analysis',
    { preHandler: aiPreHandler },
    async (request) => {
      const { boardId } = z.object({ boardId: z.string().uuid().optional() }).parse(request.body);
      const result = await aiService.productivityAnalysis(request.profileId!, boardId);
      return { data: result };
    },
  );

  fastify.post(
    '/api/v1/ai/risk-analysis',
    { preHandler: aiPreHandler },
    async (request) => {
      const { boardId } = z.object({ boardId: z.string().uuid() }).parse(request.body);
      const result = await aiService.riskAnalysis(request.profileId!, boardId);
      return { data: result };
    },
  );
}
