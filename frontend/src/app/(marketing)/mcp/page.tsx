import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'kanNINJA — MCP integration',
    description:
        'kanNINJA speaks the Model Context Protocol. Wire it into the agent you already use.',
    openGraph: {
        title: 'kanNINJA — MCP integration',
        description: 'Manage your dojo from any agent.',
        type: 'website',
    },
};

const READ_TOOLS = [
    { name: 'list_boards.', body: 'Every dojo you can see, on demand.' },
    { name: 'get_board.', body: 'Columns, cards, members. The whole board, returned in JSON.' },
    { name: 'list_tasks.', body: 'Filter by status, assignee, due date, label, clan.' },
    { name: 'get_task.', body: 'Full detail — comments, history, attachments.' },
    { name: 'get_my_work.', body: 'Everything assigned to you, grouped by board.' },
    { name: 'search.', body: 'Text search across cards and comments. Scoped to what you can see.' },
];

const WRITE_TOOLS = [
    { name: 'create_task.', body: 'A new kata, on the column you name.' },
    { name: 'update_task.', body: 'Title, description, priority, progress. Anything on the card.' },
    { name: 'move_task.', body: 'Across columns, with a comment if you want one.' },
    { name: 'add_comment.', body: 'Posts as you. Threaded with the rest.' },
    { name: 'assign_task.', body: 'To yourself, a clan member, or no one.' },
    { name: 'set_due_date.', body: 'In your workspace timezone, not the server’s.' },
];

const MCP_SNIPPET = `{
  "mcpServers": {
    "kanninja": {
      "command": "npx",
      "args": ["-y", "kanninja-mcp"],
      "env": { "KANNINJA_API_KEY": "ninja_live_..." }
    }
  }
}`;

const CLIENTS = [
    'Claude Code',
    'Claude.ai',
    'Cursor',
    'ChatGPT desktop',
    'Zed',
    'Windsurf',
    'Continue.dev',
];

export default function McpPage() {
    return (
        <>
            {/* Hero */}
            <section className="relative overflow-hidden">
                <div className="container mx-auto px-6 md:px-12 lg:px-16 pt-24 pb-24 lg:pt-32 lg:pb-32">
                    <div className="max-w-4xl">
                        <p className="hanko-rise hanko-eyebrow text-eyebrow font-mono uppercase text-primary">
                            MCP integration
                        </p>
                        <h1 className="hanko-rise hanko-rise-1 mt-12 font-display text-5xl md:text-6xl lg:text-7xl font-medium tracking-tight text-base-content">
                            Manage your dojo{' '}
                            <span className="hanko-brush italic text-primary">
                                from any agent.
                            </span>
                        </h1>
                        <p className="hanko-rise hanko-rise-2 mt-10 max-w-2xl text-lg leading-relaxed text-base-content/70">
                            kanNINJA speaks the Model Context Protocol. Wire it into the agent
                            you already use.
                        </p>
                    </div>
                </div>
            </section>

            {/* 01 — The protocol */}
            <section className="border-t border-base-300">
                <div className="container mx-auto px-6 md:px-12 lg:px-16 py-24 lg:py-32">
                    <div className="max-w-3xl">
                        <p className="hanko-eyebrow text-eyebrow font-mono uppercase tracking-widest text-primary">
                            01 — The protocol
                        </p>
                        <h2 className="mt-8 font-display text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight">
                            What MCP{' '}
                            <span className="italic text-primary">actually is.</span>
                        </h2>
                        <p className="mt-8 text-lg leading-relaxed text-base-content/70">
                            The Model Context Protocol is a small open standard for letting AI
                            agents call tools in your apps. Anthropic published it. Other
                            vendors picked it up. It is now the way your agent talks to the
                            software you already pay for.
                        </p>
                        <p className="mt-6 text-lg leading-relaxed text-base-content/70">
                            kanNINJA ships an MCP server. You generate an API key, paste a
                            short snippet into your agent’s config, and the agent can read
                            your boards and move your kata. No browser tab. No copy-paste from
                            the dashboard. The work happens where you already work.
                        </p>
                    </div>
                </div>
            </section>

            {/* 02 — Tools you get */}
            <section className="border-t border-base-300">
                <div className="container mx-auto px-6 md:px-12 lg:px-16 py-24 lg:py-32">
                    <div className="max-w-3xl">
                        <p className="hanko-eyebrow text-eyebrow font-mono uppercase tracking-widest text-primary">
                            02 — Tools you get
                        </p>
                        <h2 className="mt-8 font-display text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight">
                            Fifteen verbs, in{' '}
                            <span className="italic text-primary">your vocabulary.</span>
                        </h2>
                        <p className="mt-8 max-w-2xl text-lg leading-relaxed text-base-content/70">
                            Read what is there. Move what isn’t. The same names you use on
                            the board, exposed as tools the agent can call.
                        </p>
                    </div>

                    {/* Read */}
                    <div className="hanko-scroll-rise mt-20 max-w-5xl">
                        <p className="text-eyebrow font-mono uppercase tracking-widest text-base-content/50">
                            Read
                        </p>
                        <ul className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12">
                            {READ_TOOLS.map((t) => (
                                <li key={t.name}>
                                    <h3 className="font-display text-2xl font-medium tracking-tight">
                                        {t.name}
                                    </h3>
                                    <p className="mt-3 text-base leading-relaxed text-base-content/70 max-w-md">
                                        {t.body}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Write */}
                    <div className="hanko-scroll-rise mt-20 max-w-5xl">
                        <p className="text-eyebrow font-mono uppercase tracking-widest text-base-content/50">
                            Write
                        </p>
                        <ul className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12">
                            {WRITE_TOOLS.map((t) => (
                                <li key={t.name}>
                                    <h3 className="font-display text-2xl font-medium tracking-tight">
                                        {t.name}
                                    </h3>
                                    <p className="mt-3 text-base leading-relaxed text-base-content/70 max-w-md">
                                        {t.body}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <p className="mt-16 max-w-2xl text-base text-base-content/60 italic">
                        AI-native tools (break down, estimate, suggest next, draft standup) and
                        clan tools are next. Pro and Team tiers, when they ship.
                    </p>
                </div>
            </section>

            {/* 03 — Three steps */}
            <section className="border-t border-base-300">
                <div className="container mx-auto px-6 md:px-12 lg:px-16 py-24 lg:py-32">
                    <div className="max-w-3xl">
                        <p className="hanko-eyebrow text-eyebrow font-mono uppercase tracking-widest text-primary">
                            03 — Setup
                        </p>
                        <h2 className="mt-8 font-display text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight">
                            Three steps to{' '}
                            <span className="italic text-primary">wired.</span>
                        </h2>
                        <p className="mt-8 max-w-2xl text-lg leading-relaxed text-base-content/70">
                            Under a minute, in any direction.
                        </p>
                    </div>

                    <div className="hanko-scroll-rise mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl">
                        <article className="bg-base-100 rounded-lg shadow-e1 p-8">
                            <p className="text-eyebrow font-mono uppercase tracking-widest text-base-content/40">
                                Step 01
                            </p>
                            <h3 className="mt-4 font-display text-2xl font-medium tracking-tight">
                                Generate a key.
                            </h3>
                            <p className="mt-4 text-base leading-relaxed text-base-content/70">
                                Settings &rarr; API keys &rarr; <em>Create key</em>. Name it
                                after the agent that will use it.
                            </p>
                        </article>
                        <article className="bg-base-100 rounded-lg shadow-e1 p-8">
                            <p className="text-eyebrow font-mono uppercase tracking-widest text-base-content/40">
                                Step 02
                            </p>
                            <h3 className="mt-4 font-display text-2xl font-medium tracking-tight">
                                Paste the snippet.
                            </h3>
                            <p className="mt-4 text-base leading-relaxed text-base-content/70">
                                Drop it into your client&rsquo;s MCP config and restart the
                                client.
                            </p>
                        </article>
                        <article className="bg-base-100 rounded-lg shadow-e1 p-8">
                            <p className="text-eyebrow font-mono uppercase tracking-widest text-base-content/40">
                                Step 03
                            </p>
                            <h3 className="mt-4 font-display text-2xl font-medium tracking-tight">
                                Ask for your boards.
                            </h3>
                            <p className="mt-4 text-base leading-relaxed text-base-content/70">
                                &ldquo;List my boards.&rdquo; The agent calls{' '}
                                <code className="font-mono text-sm">list_boards</code> and
                                you&rsquo;re done.
                            </p>
                        </article>
                    </div>

                    {/* Snippet */}
                    <div className="mt-12 max-w-3xl">
                        <p className="text-eyebrow font-mono uppercase tracking-widest text-base-content/50 mb-4">
                            The snippet
                        </p>
                        <pre className="bg-base-100 rounded-lg shadow-e1 p-6 font-mono text-sm overflow-x-auto whitespace-pre">
                            {MCP_SNIPPET}
                        </pre>
                        <p className="mt-3 text-sm text-base-content/50">
                            Replace <code className="font-mono">ninja_live_...</code> with the
                            key from your settings page.
                        </p>
                    </div>
                </div>
            </section>

            {/* 04 — Clients */}
            <section className="border-t border-base-300">
                <div className="container mx-auto px-6 md:px-12 lg:px-16 py-24 lg:py-32">
                    <div className="max-w-3xl">
                        <p className="hanko-eyebrow text-eyebrow font-mono uppercase tracking-widest text-primary">
                            04 — Clients
                        </p>
                        <h2 className="mt-8 font-display text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight">
                            Tested in the agents{' '}
                            <span className="italic text-primary">you trust.</span>
                        </h2>
                    </div>

                    <ul className="hanko-scroll-rise mt-16 flex flex-wrap gap-3 max-w-4xl">
                        {CLIENTS.map((c) => (
                            <li
                                key={c}
                                className="px-5 py-3 rounded-full bg-base-100 border border-base-300 font-mono text-sm text-base-content"
                            >
                                {c}
                            </li>
                        ))}
                    </ul>
                    <p className="mt-8 text-base text-base-content/60 max-w-xl">
                        Plus anything else that speaks MCP. The protocol is open and the
                        server is the same on every client.
                    </p>
                </div>
            </section>

            {/* Closing CTA */}
            <section className="bg-neutral text-neutral-content">
                <div className="container mx-auto px-6 md:px-12 lg:px-16 py-32 lg:py-40">
                    <div className="hanko-scroll-rise grid grid-cols-1 md:grid-cols-[1fr_auto] gap-16 md:gap-24 lg:gap-32 items-center">
                        <div className="max-w-2xl">
                            <p className="hanko-eyebrow text-eyebrow font-mono uppercase text-primary">
                                Begin
                            </p>
                            <h2 className="mt-8 font-display text-5xl md:text-6xl lg:text-7xl font-medium tracking-tight">
                                Try it in{' '}
                                <span className="italic text-primary">one minute.</span>
                            </h2>
                            <p className="mt-8 max-w-xl text-lg leading-relaxed text-neutral-content/70">
                                Free until you outgrow it. Most people never do.
                            </p>
                            <Link
                                href="/sign-up"
                                className="mt-12 inline-flex btn btn-primary focus-visible:shadow-focus"
                            >
                                Start a kata
                            </Link>
                        </div>
                        <img
                            src="/brand/nin-icon.svg"
                            alt=""
                            width={288}
                            height={288}
                            className="hidden md:block h-48 w-48 lg:h-64 lg:w-64 xl:h-72 xl:w-72"
                        />
                    </div>
                </div>
            </section>
        </>
    );
}
