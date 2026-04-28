import { z } from 'zod';
import { defineTool } from '../registry.js';
import { applyStructureToBoardSchema } from '@kanninja/shared';

const inputSchema = applyStructureToBoardSchema.extend({
  boardId: z.string().uuid().describe('The existing board to extend'),
});

export const applyTemplateToBoardTool = defineTool({
  name: 'apply_template_to_board',
  title: 'Apply Template to Dojo',
  description:
    'Append a structured template (lists + cards + checklist items + labels) to an existing board. New lists are added to the right of any existing ones — existing data is never modified. Transactional: the whole append succeeds or none of it does. Card label references resolve to existing user/board labels first, then to any new labels created in the same call.',
  inputSchema,
  async handler(args, ctx) {
    const { boardId, ...body } = args;
    const res = await ctx.callApi.post<{ data: unknown }>(
      `/api/v1/boards/${boardId}/apply-template`,
      body,
    );
    return res.data;
  },
});
