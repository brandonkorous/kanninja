#!/usr/bin/env node
import 'dotenv/config';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createApiClient } from './api-client.js';
import { registerAllTools } from './registry.js';
import { allTools } from './tools/index.js';
import type { McpContext } from './context.js';

const API_KEY = process.env.KANNINJA_API_KEY;
const API_URL = process.env.KANNINJA_API_URL ?? 'https://api.kanninja.com';

if (!API_KEY) {
    console.error('KANNINJA_API_KEY environment variable is required');
    process.exit(1);
}

async function main() {
    const callApi = createApiClient(API_KEY!, API_URL);

    // Validate the API key on boot
    const { data } = await callApi.post<{
        data: { userId: string; displayName: string | null; email: string; tier: string };
    }>('/api/v1/auth/verify-key', { key: API_KEY });

    const ctx: McpContext = {
        userId: data.userId,
        displayName: data.displayName,
        email: data.email,
        tier: data.tier,
        apiUrl: API_URL,
        callApi,
    };

    const server = new Server(
        { name: 'kanninja', version: '0.2.0' },
        { capabilities: { tools: {} } },
    );

    registerAllTools(server, allTools, ctx);

    const transport = new StdioServerTransport();
    await server.connect(transport);
}

main().catch((err) => {
    console.error('Failed to start kanNINJA MCP server:', err.message ?? err);
    process.exit(1);
});
