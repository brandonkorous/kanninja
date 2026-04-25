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

Fifteen tools, two groups.

**Read**
- `list_boards` — every dojo you can see
- `get_board` — columns, cards, members
- `list_tasks` — same as get_board, scoped for the agent
- `get_task` — full detail with comments and history
- `get_my_work` — everything assigned to you, grouped by board
- `search` — text search across cards and comments

**Write**
- `create_task` — new kata on a column
- `update_task` — title, description, priority, progress
- `move_task` — across columns, with an optional comment
- `add_comment` — posts as you
- `assign_task` — to a teammate, or no one
- `add_label` / `remove_label`
- `set_due_date`
- `create_board`

AI-native tools (`break_down_task`, `estimate_task`, `suggest_next`, `summarize_board`, `draft_standup`, `extract_tasks`) and clan tools ship in v0.2.

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
