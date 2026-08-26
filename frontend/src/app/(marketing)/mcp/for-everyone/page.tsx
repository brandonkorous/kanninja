import Link from 'next/link';
import type { Metadata } from 'next';
import { buildPageMetadata, MCP_REMOTE_URL } from '@/lib/seo';
import { JsonLd, breadcrumbLd } from '@/components/seo/JsonLd';

export const metadata: Metadata = buildPageMetadata({
    title: 'Inside the chat',
    description:
        'Run your kanNINJA boards from inside ChatGPT or Claude. Tell it to add, move, or remind — it just does it.',
    path: '/mcp/for-everyone',
    ogTitle: 'Run your dojo from inside the chat.',
    ogEyebrow: 'kanNINJA · Inside chat',
    keywords: [
        'kanban inside ChatGPT',
        'kanban for Claude',
        'kanban for AI agents',
        'plan with ChatGPT',
        'task list ChatGPT',
    ],
});

const SCENES = [
    {
        who: 'A wedding planner',
        prompt: 'Add "taste cakes Saturday morning" and move "venue contract" to Done.',
        outcome:
            'kanNINJA adds the kata to her Spring 2026 board, marks the venue contract complete, and reads back what is still open.',
    },
    {
        who: 'A youth soccer coach',
        prompt: 'What is on the list for this week’s practice?',
        outcome:
            'Claude pulls up the U10 Practice Plan board and reads back the drills he set up Sunday night.',
    },
    {
        who: 'A parent',
        prompt: 'Add a vet appointment for Tuesday and remind me Monday night.',
        outcome:
            'The kata lands on the Family board with a Monday reminder. Tuesday morning, ChatGPT can pull up the address.',
    },
    {
        who: 'A freelance designer',
        prompt: 'Move the brand refresh deck to In Review and assign it to Maya.',
        outcome: 'Done. The card moves. Maya gets a notification.',
    },
];

const ASKS = [
    'Show me my boards.',
    'Add a kata to my Home Renovation board.',
    'Move the Anderson invoice to Sent.',
    'Assign the venue walkthrough to Ben.',
    'What is due this week?',
    'Mark the dentist appointment done.',
    'Remind me about taxes on Friday.',
    'What did I finish yesterday?',
];

export default function McpForEveryonePage() {
    return (
        <>
            <JsonLd
                data={breadcrumbLd([
                    { name: 'Home', path: '/' },
                    { name: 'MCP integration', path: '/mcp' },
                    { name: 'Inside the chat', path: '/mcp/for-everyone' },
                ])}
            />

            {/* Hero */}
            <section className="relative overflow-hidden">
                <div className="container mx-auto px-6 md:px-12 lg:px-16 pt-24 pb-24 lg:pt-32 lg:pb-32">
                    <div className="max-w-4xl">
                        <p className="hanko-rise hanko-eyebrow text-eyebrow font-mono uppercase text-primary">
                            kanNINJA · Inside chat
                        </p>
                        <h1 className="hanko-rise hanko-rise-1 mt-12 font-display text-5xl md:text-6xl lg:text-7xl font-medium tracking-tight text-base-content">
                            Run your dojo{' '}
                            <span className="hanko-brush italic text-primary">
                                from the chat.
                            </span>
                        </h1>
                        <p className="hanko-rise hanko-rise-2 mt-10 max-w-2xl text-lg leading-relaxed text-base-content/70">
                            Connect kanNINJA to ChatGPT or Claude. Tell it what to add, what
                            to move, what to remind you about. It updates your boards directly.
                            No tabs to switch. No copy-paste.
                        </p>
                    </div>
                </div>
            </section>

            {/* 01 — Scenes */}
            <section className="border-t border-base-300">
                <div className="container mx-auto px-6 md:px-12 lg:px-16 py-24 lg:py-32">
                    <div className="max-w-3xl">
                        <p className="hanko-eyebrow text-eyebrow font-mono uppercase tracking-widest text-primary">
                            01 — How it looks
                        </p>
                        <h2 className="mt-8 font-display text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight">
                            Four people. Four{' '}
                            <span className="italic text-primary">real moments.</span>
                        </h2>
                    </div>

                    <div className="hanko-scroll-rise mt-20 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16 max-w-5xl">
                        {SCENES.map((s) => (
                            <article key={s.who}>
                                <p className="text-eyebrow font-mono uppercase tracking-widest text-base-content/50">
                                    {s.who}
                                </p>
                                <blockquote className="mt-6 font-display text-2xl md:text-3xl font-medium tracking-tight leading-tight">
                                    &ldquo;{s.prompt}&rdquo;
                                </blockquote>
                                <p className="mt-6 text-base leading-relaxed text-base-content/70 max-w-md">
                                    {s.outcome}
                                </p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {/* 02 — What to ask */}
            <section className="border-t border-base-300">
                <div className="container mx-auto px-6 md:px-12 lg:px-16 py-24 lg:py-32">
                    <div className="max-w-3xl">
                        <p className="hanko-eyebrow text-eyebrow font-mono uppercase tracking-widest text-primary">
                            02 — Ask anything
                        </p>
                        <h2 className="mt-8 font-display text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight">
                            Plain language.{' '}
                            <span className="italic text-primary">No commands.</span>
                        </h2>
                        <p className="mt-8 max-w-2xl text-lg leading-relaxed text-base-content/70">
                            You don&rsquo;t learn anything new. You talk to the agent the way
                            you already talk to the agent. It figures out which board, which
                            kata, which column.
                        </p>
                    </div>

                    <ul className="hanko-scroll-rise mt-16 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 max-w-4xl">
                        {ASKS.map((ask) => (
                            <li
                                key={ask}
                                className="font-display text-xl md:text-2xl font-medium tracking-tight text-base-content/80 border-l-2 border-primary/30 pl-5 py-2"
                            >
                                &ldquo;{ask}&rdquo;
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            {/* 03 — How to connect */}
            <section className="border-t border-base-300">
                <div className="container mx-auto px-6 md:px-12 lg:px-16 py-24 lg:py-32">
                    <div className="max-w-3xl">
                        <p className="hanko-eyebrow text-eyebrow font-mono uppercase tracking-widest text-primary">
                            03 — How it connects
                        </p>
                        <h2 className="mt-8 font-display text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight">
                            Add it once.{' '}
                            <span className="italic text-primary">Use it always.</span>
                        </h2>
                        <p className="mt-8 max-w-2xl text-lg leading-relaxed text-base-content/70">
                            kanNINJA plugs into ChatGPT and Claude as an integration. You
                            add it once, sign in when it asks, and from then on the agent
                            can see your boards and act on them.
                        </p>
                    </div>

                    <div className="hanko-scroll-rise mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl">
                        <article className="bg-base-100 rounded-lg shadow-e1 p-8">
                            <p className="text-eyebrow font-mono uppercase tracking-widest text-base-content/40">
                                Step 01
                            </p>
                            <h3 className="mt-4 font-display text-2xl font-medium tracking-tight">
                                Sign up free.
                            </h3>
                            <p className="mt-4 text-base leading-relaxed text-base-content/70">
                                The free tier is generous on purpose. Most people never
                                outgrow it.
                            </p>
                        </article>
                        <article className="bg-base-100 rounded-lg shadow-e1 p-8">
                            <p className="text-eyebrow font-mono uppercase tracking-widest text-base-content/40">
                                Step 02
                            </p>
                            <h3 className="mt-4 font-display text-2xl font-medium tracking-tight">
                                Add the integration.
                            </h3>
                            <p className="mt-4 text-base leading-relaxed text-base-content/70">
                                In ChatGPT or Claude, open Settings → Integrations and add{' '}
                                <code className="font-mono text-sm text-primary">
                                    {MCP_REMOTE_URL}
                                </code>
                                . Sign in when it asks.
                            </p>
                        </article>
                        <article className="bg-base-100 rounded-lg shadow-e1 p-8">
                            <p className="text-eyebrow font-mono uppercase tracking-widest text-base-content/40">
                                Step 03
                            </p>
                            <h3 className="mt-4 font-display text-2xl font-medium tracking-tight">
                                Talk normally.
                            </h3>
                            <p className="mt-4 text-base leading-relaxed text-base-content/70">
                                Open ChatGPT or Claude and ask. The agent does the rest.
                            </p>
                        </article>
                    </div>
                </div>
            </section>

            {/* 04 — On privacy */}
            <section className="border-t border-base-300">
                <div className="container mx-auto px-6 md:px-12 lg:px-16 py-24 lg:py-32">
                    <div className="max-w-3xl">
                        <p className="hanko-eyebrow text-eyebrow font-mono uppercase tracking-widest text-primary">
                            04 — What it can see
                        </p>
                        <h2 className="mt-8 font-display text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight">
                            Only the boards{' '}
                            <span className="italic text-primary">you allow.</span>
                        </h2>
                        <p className="mt-8 text-lg leading-relaxed text-base-content/70">
                            When you connect, you grant the agent access to your account &mdash;
                            same access you have. Anything you can see, it can see. Nothing
                            else.
                        </p>
                        <p className="mt-6 text-lg leading-relaxed text-base-content/70">
                            You can revoke access from settings any time. The agent
                            immediately loses the ability to read or change anything.
                        </p>
                    </div>
                </div>
            </section>

            {/* For developers — sibling page */}
            <section className="border-t border-base-300 bg-base-100">
                <div className="container mx-auto px-6 md:px-12 lg:px-16 py-16 lg:py-20">
                    <div className="max-w-3xl flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div>
                            <p className="text-eyebrow font-mono uppercase tracking-widest text-base-content/50">
                                Developer?
                            </p>
                            <p className="mt-3 font-display text-xl md:text-2xl font-medium tracking-tight">
                                There&rsquo;s a version for Claude Code, Cursor, and the
                                terminal.
                            </p>
                        </div>
                        <Link
                            href="/mcp"
                            className="btn btn-outline btn-secondary focus-visible:shadow-focus shrink-0"
                        >
                            Read the technical docs
                        </Link>
                    </div>
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
                                Free.{' '}
                                <span className="italic text-primary">Connected.</span>
                            </h2>
                            <p className="mt-8 max-w-xl text-lg leading-relaxed text-neutral-content/70">
                                Start a kata, then add{' '}
                                <code className="font-mono text-sm text-primary">
                                    {MCP_REMOTE_URL}
                                </code>{' '}
                                in ChatGPT or Claude. Two minutes.
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
