# kanninja-mcp

The Model Context Protocol server for [kanNINJA](https://kanninja.com). Manage your dojo from any agent — Claude Code, Cursor, Claude.ai, ChatGPT desktop, Zed, Continue.dev, anything that speaks MCP.

## Install

You don't install it. Your client does.

### Claude Code

Add to your `.mcp.json`:

```json
{
  "mcpServers": {
    "kanninja": {
      "command": "npx",
      "args": ["-y", "kanninja-mcp"],
      "env": { "KANNINJA_API_KEY": "ninja_live_..." }
    }
  }
}
```

### Claude desktop, Cursor, Windsurf

Same shape. The path to the config file changes per client; the server entry is identical.

### Docker

```bash
docker run --rm -i \
  -e KANNINJA_API_KEY=ninja_live_... \
  ghcr.io/brandonkorous/kanninja-mcp:latest
```

## Get a key

1. Sign in at [kanninja.com](https://kanninja.com)
2. Go to **Settings → API Keys**
3. **Create key**, name it after the agent that will hold it
4. Copy the `ninja_live_...` value (shown once)

The settings page also gives you a copy-pasteable JSON block, ready to drop into your client config.

## Tools

Forty-two tools, grouped by what they touch.

**Read** — `list_boards`, `get_board`, `list_tasks`, `get_task`, `get_my_work`, `search`, `list_comments`, `list_checklist`, `list_labels`

**Boards** — `create_board`, `update_board`, `delete_board`

**Lists** — `create_list`, `update_list`, `delete_list`, `reorder_lists`

**Cards** — `create_task`, `update_task`, `move_task`, `delete_task`, `assign_task`, `set_due_date`

**Comments** — `add_comment`, `update_comment`, `delete_comment`

**Checklist** — `add_checklist_item`, `update_checklist_item`, `delete_checklist_item`

**Labels** — `create_label`, `update_label`, `delete_label`, `add_label`, `remove_label`

**Composite** — one transactional call in place of a chain of CRUD: `create_board_with_structure`, `apply_template_to_board`, `bulk_create_tasks`, `bulk_update_tasks`, `duplicate_card`

**Integrations** — `list_connected_integrations`, `list_available_providers`, `get_integration_events`, `sync_integration`

AI-native tools (`break_down_task`, `estimate_task`, `suggest_next`, `summarize_board`, `draft_standup`, `extract_tasks`) and clan tools are on the roadmap.

## Configuration

Two environment variables.

| Variable | Required | Default | Notes |
|---|---|---|---|
| `KANNINJA_API_KEY` | yes | — | Generated in the kanNINJA settings page |
| `KANNINJA_API_URL` | no | `https://api.kanninja.com` | Override for local dev or self-hosted |

The package validates the key on every startup. A revoked key, expired key, or wrong URL will fail fast with a clear error.

## Security

API keys are scoped to your account. Anything you can do in the web app, the agent can do with your key — and only that. RLS at the DB level keeps you in your own data; there's no MCP-specific bypass.

If a key leaks, revoke it from the settings page. Active sessions lose access immediately.

## License

MIT. See the [repo](https://github.com/brandonkorous/kanninja).

## Issues

[github.com/brandonkorous/kanninja/issues](https://github.com/brandonkorous/kanninja/issues)
