import { defineTool } from '../registry.js';
import { createBoardWithStructureSchema } from '@kanninja/shared';

export const createBoardWithStructureTool = defineTool({
  name: 'create_board_with_structure',
  title: 'Create Dojo with Structure',
  description:
    'Create a board fully populated in one transactional call: board metadata, board-scoped labels, lists, cards in those lists, plus per-card checklist items and label attachments. All-or-nothing — if any insert fails, nothing is created. Cards reference labels by name (defined in the top-level `labels` array). Use this instead of chaining create_board + create_list + create_task when an LLM has decided the full structure up front.',
  inputSchema: createBoardWithStructureSchema,
  async handler(args, ctx) {
    const res = await ctx.callApi.post<{ data: unknown }>(
      '/api/v1/boards/with-structure',
      args,
    );
    return res.data;
  },
});
