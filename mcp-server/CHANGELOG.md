# Changelog

All notable changes to `kanninja-mcp`. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] — 2026-05-21

### Fixed

- **The package is now installable from npm.** `0.1.0` declared a runtime
  dependency on the private `@kanninja/shared` workspace package, which is not
  published — so `npx kanninja-mcp` failed to install. `@kanninja/shared` is now
  bundled into the build, and the package depends only on
  `@modelcontextprotocol/sdk`, `dotenv`, and `zod`.

### Changed

- Build switched from `tsc` to `tsup` (bundled ESM output).

### Added

This release documents the complete tool surface — 42 tools. Earlier changelog
entries under-reported what shipped.

- **Read.** `list_boards`, `get_board`, `list_tasks`, `get_task`, `get_my_work`, `search`, `list_comments`, `list_checklist`, `list_labels`.
- **Boards.** `create_board`, `update_board`, `delete_board`.
- **Lists.** `create_list`, `update_list`, `delete_list`, `reorder_lists`.
- **Cards.** `create_task`, `update_task`, `move_task`, `delete_task`, `assign_task`, `set_due_date`.
- **Comments.** `add_comment`, `update_comment`, `delete_comment`.
- **Checklist.** `add_checklist_item`, `update_checklist_item`, `delete_checklist_item`.
- **Labels.** `create_label`, `update_label`, `delete_label`, `add_label`, `remove_label`.
- **Composite.** One transactional call in place of a chain of CRUD: `create_board_with_structure`, `apply_template_to_board`, `bulk_create_tasks`, `bulk_update_tasks`, `duplicate_card`.
- **Integrations.** `list_connected_integrations`, `list_available_providers`, `get_integration_events`, `sync_integration`.

### Notes

- AI-native tools (`break_down_task`, `estimate_task`, `suggest_next`, `summarize_board`, `draft_standup`, `extract_tasks`) and clan tools remain on the roadmap.

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
