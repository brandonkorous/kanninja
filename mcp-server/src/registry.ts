import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  type Implementation,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { zodToJsonSchema } from '@kanninja/shared';
import { McpApiError } from './api-client.js';
import type { McpContext } from './context.js';

/**
 * Server identity advertised to MCP clients — name, branding, and icons.
 * Hosts such as Claude render `icons` in the connector UI; without them
 * the host falls back to scraping a favicon from the domain (which is how
 * the stale v1 blue-ninja icon kept showing up). `version` is supplied
 * per-transport — the stdio and remote packages version independently.
 */
export const serverInfo: Omit<Implementation, 'version'> = {
  name: 'kanninja',
  title: 'kanNINJA',
  description: 'kanNINJA MCP server — manage your dojo from any agent',
  websiteUrl: 'https://kanninja.com',
  icons: [
    {
      src: 'https://kanninja.com/brand/nin-icon.svg',
      mimeType: 'image/svg+xml',
      sizes: ['any'],
      theme: 'light',
    },
    {
      src: 'https://kanninja.com/brand/nin-icon-night.svg',
      mimeType: 'image/svg+xml',
      sizes: ['any'],
      theme: 'dark',
    },
    {
      src: 'https://kanninja.com/brand/nin-icon.png',
      mimeType: 'image/png',
      sizes: ['256x256'],
    },
  ],
};

export interface ToolDefinition {
  name: string;
  // Human-readable title surfaced by hosts that respect the MCP spec
  // 2025-06-18 `title` field (Claude.ai, etc.). Lets us show kanNINJA
  // brand vocabulary ("Create Kata") without renaming the underlying
  // tool identifier ("create_task") that integrators have wired up.
  title?: string;
  description: string;
  // True for read-only tools. The registry maps this to MCP tool
  // annotations (readOnlyHint vs destructiveHint) — required for the
  // Anthropic Connectors Directory. Omitted = a write (destructive).
  readOnly?: boolean;
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
      ...(t.title ? { title: t.title } : {}),
      description: t.description,
      inputSchema: zodToJsonSchema(t.inputSchema),
      // Every tool carries a title plus a read/write hint. The Anthropic
      // Connectors Directory requires this — read tools get readOnlyHint,
      // writes get destructiveHint, and the hints drive host auto-permissions.
      annotations: {
        ...(t.title ? { title: t.title } : {}),
        ...(t.readOnly
          ? { readOnlyHint: true }
          : { readOnlyHint: false, destructiveHint: true }),
      },
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
