import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { zodToJsonSchema } from '@kanninja/shared';
import { McpApiError } from './api-client.js';
import type { McpContext } from './context.js';

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: z.ZodObject<z.ZodRawShape>;
  handler: (args: Record<string, unknown>, ctx: McpContext) => Promise<unknown>;
}

export function defineTool(def: ToolDefinition): ToolDefinition {
  return def;
}

export function registerAllTools(
  server: Server,
  tools: ToolDefinition[],
  ctx: McpContext,
) {
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: tools.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: zodToJsonSchema(t.inputSchema),
    })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const tool = tools.find((t) => t.name === request.params.name);
    if (!tool) {
      return {
        content: [{ type: 'text' as const, text: `Unknown tool: ${request.params.name}` }],
        isError: true,
      };
    }

    try {
      const args = tool.inputSchema.parse(request.params.arguments ?? {});
      const result = await tool.handler(args as Record<string, unknown>, ctx);

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      if (error instanceof McpApiError) {
        return {
          content: [{
            type: 'text' as const,
            text: `API error (${error.status}): ${error.apiError.message}`,
          }],
          isError: true,
        };
      }
      if (error instanceof z.ZodError) {
        return {
          content: [{
            type: 'text' as const,
            text: `Validation error: ${error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
          }],
          isError: true,
        };
      }

      const msg = error instanceof Error ? error.message : 'Unknown error';
      return {
        content: [{ type: 'text' as const, text: msg }],
        isError: true,
      };
    }
  });
}
