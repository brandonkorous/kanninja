'use client';

// The 42 tools the MCP server advertises. Grouped the way an agent actually
// reaches for them: look first, change a kata, restructure a dojo, then the
// composite calls that collapse a whole conversation into one round trip.
//
// Source of truth is mcp-server/src/tools/ — keep this list in step with it.

const GROUPS: { title: string; note: string; tools: string[] }[] = [
    {
        title: 'Look',
        note: 'Read-only. Scoped to what you can already see.',
        tools: [
            'list_boards',
            'get_board',
            'list_tasks',
            'get_task',
            'get_my_work',
            'search',
            'list_comments',
            'list_checklist',
            'list_labels',
            'list_connected_integrations',
            'list_available_providers',
            'get_integration_events',
        ],
    },
    {
        title: 'Change a kata',
        note: 'Everything you can do on a card, your agent can do too.',
        tools: [
            'create_task',
            'update_task',
            'move_task',
            'delete_task',
            'assign_task',
            'set_due_date',
            'duplicate_card',
            'add_comment',
            'update_comment',
            'delete_comment',
            'add_checklist_item',
            'update_checklist_item',
            'delete_checklist_item',
            'add_label',
            'remove_label',
            'create_label',
            'update_label',
            'delete_label',
        ],
    },
    {
        title: 'Shape a dojo',
        note: 'Boards and columns, including their order.',
        tools: [
            'create_board',
            'update_board',
            'delete_board',
            'create_list',
            'update_list',
            'delete_list',
            'reorder_lists',
        ],
    },
    {
        title: 'One call, many changes',
        note: 'Transactional. They land whole or not at all.',
        tools: [
            'create_board_with_structure',
            'apply_template_to_board',
            'bulk_create_tasks',
            'bulk_update_tasks',
            'sync_integration',
        ],
    },
];

export function ToolCatalogPanel() {
    const total = GROUPS.reduce((n, g) => n + g.tools.length, 0);

    return (
        <div className="bg-base-100 rounded-lg shadow-e1 p-8">
            <h2 className="font-display text-2xl font-medium tracking-tight">
                <span className="font-mono">{total}</span> tools, no prompt to learn.
            </h2>
            <p className="mt-3 text-sm text-base-content/70 max-w-xl">
                Your agent reads these on connect and works out the rest. You never
                type a tool name — this list is here so you know what you handed over.
            </p>

            <div className="mt-10 space-y-10">
                {GROUPS.map((group) => (
                    <section key={group.title}>
                        <div className="flex items-baseline gap-3 flex-wrap">
                            <h3 className="font-display text-lg font-medium tracking-tight">
                                {group.title}
                            </h3>
                            <span className="font-mono text-xs text-base-content/30">
                                {String(group.tools.length).padStart(2, '0')}
                            </span>
                        </div>
                        <p className="mt-1 text-xs text-base-content/60">{group.note}</p>
                        <ul className="mt-4 flex flex-wrap gap-2">
                            {group.tools.map((tool) => (
                                <li
                                    key={tool}
                                    className="font-mono text-xs bg-base-200 text-base-content/70 rounded-sm px-2.5 py-1.5"
                                >
                                    {tool}
                                </li>
                            ))}
                        </ul>
                    </section>
                ))}
            </div>
        </div>
    );
}
