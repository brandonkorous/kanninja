# Changelog

All notable changes to `kanninja-mcp`. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] — 2026-04-10

First public release. Local stdio transport, API-key auth, fifteen tools.

### Added

- Stdio MCP server compatible with Claude Code, Cursor, Claude.ai, ChatGPT desktop, Zed, Windsurf, and Continue.dev.
- API-key authentication via `KANNINJA_API_KEY`. Keys are generated in the kanNINJA settings page and scoped per workspace.
- **Read tools.** `list_boards`, `get_board`, `list_tasks`, `get_task`, `get_my_work`, `search`.
- **Write tools.** `create_task`, `update_task`, `move_task`, `add_comment`, `assign_task`, `add_label`, `remove_label`, `set_due_date`, `create_board`.
- Zod input validation for every tool, with structured error responses.
- Configurable backend URL via `KANNINJA_API_URL` (defaults to `https://api.kanninja.com`).
- Docker image published to `ghcr.io/brandonkorous/kanninja-mcp` for users who don't want Node on their machine.

### Notes

- AI-native tools (`break_down_task`, `estimate_task`, `suggest_next`, `summarize_board`, `draft_standup`, `extract_tasks`) are scheduled for v0.2.
- Clan tools (`list_clan_members`, `get_clan_velocity`, `assign_to_clan_member`, `get_member_load`, `list_upcoming_reviews`, `log_time_on_task`) are scheduled for v0.2.
- Hosted remote transport (HTTP + SSE) and Clerk OAuth are scheduled for v0.3.
