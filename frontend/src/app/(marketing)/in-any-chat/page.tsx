import Link from 'next/link';
import type { Metadata } from 'next';
import { buildPageMetadata, MCP_REMOTE_URL } from '@/lib/seo';
import { JsonLd, breadcrumbLd } from '@/components/seo/JsonLd';

export const metadata: Metadata = buildPageMetadata({
    title: 'Project management, in any chat',
    description:
        'kanNINJA is project management for everyone, in the chat they already trust. Claude, ChatGPT, and any agent that speaks MCP. Plan the work where the conversation already lives.',
    path: '/in-any-chat',
    ogTitle: 'Project management, in any chat.',
    ogEyebrow: 'kanNINJA · In any chat',
    keywords: [
        'project management in ChatGPT',
        'project management in Claude',
        'kanban inside chat',
        'agent project management',
        'plan with ChatGPT',
        'plan with Claude',
        'MCP project management',
    ],
});

const SCENES = [
    {
        who: 'A history teacher',
        chat: 'ChatGPT',
        prompt:
            'Add the Reformation unit kata for next week, and move the Renaissance project to In Review.',
        outcome:
            'The AP Euro board updates. The lesson plan lands on Mon–Fri. Renaissance projects move to In Review with the rubric attached. Tuesday morning she opens the board to grade — everything is where she left it.',
    },
    {
        who: 'A small bakery owner',
        chat: 'Claude',
        prompt: 'What is left for Saturday’s Anderson wedding cake?',
        outcome:
            'Claude reads back the open kata: tasting confirmed, deposit cleared, allergy notes from the bride. He mentions the strawberries arrived early. Claude moves the prep kata up to Thursday and flags the supplier.',
    },
    {
        who: 'A new dad',
        chat: 'ChatGPT',
        prompt:
            'Add the pediatrician for Tuesday and remind me Monday night to grab the insurance card.',
        outcome:
            'The kata lands on the Family board. Monday at 7pm, ChatGPT pings him about the insurance card. Tuesday morning, the address is already in the kata.',
    },
    {
        who: 'A novelist on a deadline',
        chat: 'Claude',
        prompt:
            'Move chapter seven to Done, start the editing pass kata, and tell me what is left for the November launch.',
        outcome:
            'Claude moves the chapter, opens the editing kata, and reads back the seven items between her and the launch — copy edit, cover proof, ARC list, three more.',
    },
];

export default function InAnyChatPage() {
    return (
        <>
            <JsonLd
                data={breadcrumbLd([
                    { name: 'Home', path: '/' },
                    { name: 'In any chat', path: '/in-any-chat' },
                ])}
            />

            {/* Hero */}
            <section className="relative overflow-hidden">
                <div className="container mx-auto px-6 md:px-12 lg:px-16 pt-24 pb-24 lg:pt-32 lg:pb-32">
                    <div className="max-w-4xl">
                        <p className="hanko-rise hanko-eyebrow text-eyebrow font-mono uppercase text-primary">
                            kanNINJA · In any chat
                        </p>
                        <h1 className="hanko-rise hanko-rise-1 mt-12 font-display text-5xl md:text-6xl lg:text-7xl font-medium tracking-tight text-base-content">
                            Project management,{' '}
                            <span className="hanko-brush italic text-primary">
                                in any chat.
                            </span>
                        </h1>
                        <p className="hanko-rise hanko-rise-2 mt-10 max-w-2xl text-lg leading-relaxed text-base-content/70">
                            kanNINJA lives inside Claude, ChatGPT, and any agent that speaks
                            MCP — so the work happens in the chat you already trust. No new
                            tool to learn. No tab to keep open.
                        </p>
                    </div>
                </div>
            </section>

            {/* 01 — The shift */}
            <section className="border-t border-base-300">
                <div className="container mx-auto px-6 md:px-12 lg:px-16 py-24 lg:py-32">
                    <div className="max-w-3xl">
                        <p className="hanko-eyebrow text-eyebrow font-mono uppercase tracking-widest text-primary">
                            01 — What changed
                        </p>
                        <h2 className="mt-8 font-display text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight">
                            You already live{' '}
                            <span className="italic text-primary">in the chat.</span>
                        </h2>
                        <p className="mt-10 text-lg leading-relaxed text-base-content/70">
                            You ask Claude what is on your week. You ask ChatGPT to draft an
                            email. You ask one of them to remember something — and you trust
                            it, more than you trust opening another tab.
                        </p>
                        <p className="mt-6 text-lg leading-relaxed text-base-content/70">
                            We built kanNINJA for that. The board lives where you already are.
                            The work moves where the conversation moves. Open the chat you
                            already use, and your project is there, listening.
                        </p>
                    </div>
                </div>
            </section>

            {/* 02 — For everyone */}
            <section className="border-t border-base-300">
                <div className="container mx-auto px-6 md:px-12 lg:px-16 py-24 lg:py-32">
                    <div className="max-w-3xl">
                        <p className="hanko-eyebrow text-eyebrow font-mono uppercase tracking-widest text-primary">
                            02 — Who it is for
                        </p>
                        <h2 className="mt-8 font-display text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight">
                            Not just developers.{' '}
                            <span className="italic text-primary">Everyone.</span>
                        </h2>
                        <p className="mt-10 max-w-2xl text-lg leading-relaxed text-base-content/70">
                            The teachers. The parents. The small-business owners. The writers.
                            The agents your kids use to plan a science fair. The chat is the
                            front door for all of them now — kanNINJA is what waits inside.
                        </p>
                    </div>

                    <div className="hanko-scroll-rise mt-20 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16 max-w-5xl">
                        {SCENES.map((s) => (
                            <article key={s.who}>
                                <p className="text-eyebrow font-mono uppercase tracking-widest text-base-content/50">
                                    {s.who} · in {s.chat}
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

            {/* 03 — Reassurance */}
            <section className="border-t border-base-300">
                <div className="container mx-auto px-6 md:px-12 lg:px-16 py-24 lg:py-32">
                    <div className="max-w-3xl">
                        <p className="hanko-eyebrow text-eyebrow font-mono uppercase tracking-widest text-primary">
                            03 — The board is still there
                        </p>
                        <h2 className="mt-8 font-display text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight">
                            Two doorways.{' '}
                            <span className="italic text-primary">Same dojo.</span>
                        </h2>
                        <p className="mt-10 text-lg leading-relaxed text-base-content/70">
                            The chat is one entrance. The visual app is the other. Some days
                            you want a column to drag your kata across — open kanninja.com and
                            it works the way it always has. Real-time presence, the clan you
                            invited, the calendar view, the burndown chart.
                        </p>
                        <p className="mt-6 text-lg leading-relaxed text-base-content/70">
                            You pick the doorway. The work is the same on either side.
                        </p>
                    </div>
                </div>
            </section>

            {/* 04 — One stamp / connect */}
            <section className="border-t border-base-300">
                <div className="container mx-auto px-6 md:px-12 lg:px-16 py-24 lg:py-32">
                    <div className="max-w-3xl">
                        <p className="hanko-eyebrow text-eyebrow font-mono uppercase tracking-widest text-primary">
                            04 — Connect
                        </p>
                        <h2 className="mt-8 font-display text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight">
                            Two minutes,{' '}
                            <span className="italic text-primary">once.</span>
                        </h2>
                        <p className="mt-10 max-w-2xl text-lg leading-relaxed text-base-content/70">
                            In ChatGPT or Claude, open Settings → Integrations and add{' '}
                            <code className="font-mono text-base text-primary">
                                {MCP_REMOTE_URL}
                            </code>
                            . Sign in when it asks. From then on, the agent can see your boards
                            and act on them.
                        </p>
                    </div>

                    <div className="mt-16 flex flex-wrap gap-4">
                        <Link
                            href="/sign-up"
                            className="btn btn-primary focus-visible:shadow-focus"
                        >
                            Start a kata
                        </Link>
                        <Link
                            href="/mcp/for-everyone"
                            className="btn btn-outline btn-secondary focus-visible:shadow-focus"
                        >
                            See more examples
                        </Link>
                    </div>
                </div>
            </section>

            {/* Sibling cross-link — the technical page */}
            <section className="border-t border-base-300 bg-base-100">
                <div className="container mx-auto px-6 md:px-12 lg:px-16 py-16 lg:py-20">
                    <div className="max-w-3xl flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div>
                            <p className="text-eyebrow font-mono uppercase tracking-widest text-base-content/50">
                                Building with it?
                            </p>
                            <p className="mt-3 font-display text-xl md:text-2xl font-medium tracking-tight">
                                The technical page covers the protocol, the tools, and how
                                Claude Code and Cursor connect.
                            </p>
                        </div>
                        <Link
                            href="/mcp"
                            className="btn btn-outline btn-secondary focus-visible:shadow-focus shrink-0"
                        >
                            Read the MCP docs
                        </Link>
                    </div>
                </div>
            </section>

            {/* Closing seal */}
            <section className="bg-neutral text-neutral-content">
                <div className="container mx-auto px-6 md:px-12 lg:px-16 py-32 lg:py-40">
                    <div className="hanko-scroll-rise grid grid-cols-1 md:grid-cols-[1fr_auto] gap-16 md:gap-24 lg:gap-32 items-center">
                        <div className="max-w-2xl">
                            <p className="hanko-eyebrow text-eyebrow font-mono uppercase text-primary">
                                Begin
                            </p>
                            <h2 className="mt-8 font-display text-5xl md:text-6xl lg:text-7xl font-medium tracking-tight">
                                Your project,{' '}
                                <span className="italic text-primary">
                                    in your chat.
                                </span>
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
