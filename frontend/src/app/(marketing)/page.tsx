import Link from 'next/link';
import {
    faBolt,
    faUsers,
    faRobot,
    faChartLine,
} from '@fortawesome/free-solid-svg-icons';
import type { Metadata } from 'next';
import { KataCard } from '@/components/marketing/KataCard';
import { FourRefusalsSection } from '@/components/marketing/FourRefusalsSection';
import { HankoVideo } from '@/components/marketing/HankoVideo';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
    title: 'kanNINJA — Discipline, made visible.',
    absoluteTitle: true,
    description:
        'A kanban that respects your attention. The work in front of you, in the order you will finish it. Built by wizeworks.',
    path: '/',
    ogTitle: 'Discipline, made visible.',
    ogEyebrow: 'wizeworks · kanNINJA',
    keywords: [
        'kanban board',
        'AI kanban',
        'project management',
        'task management',
        'real-time kanban',
        'kanNINJA',
    ],
});

export default function LandingPage() {
    return (
        <>
            {/* Hero — left-aligned text, video alongside on lg+. Stacks on mobile. */}
            <section className="relative overflow-hidden">
                <div className="container mx-auto px-6 md:px-12 lg:px-16 pt-24 pb-32 lg:pt-32 lg:pb-40">
                    <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-16 lg:gap-12 xl:gap-20">
                        <div className="lg:col-span-5">
                            <p className="hanko-rise hanko-eyebrow text-eyebrow font-mono uppercase text-primary">
                                wizeworks · kanNINJA
                            </p>
                            <h1 className="hanko-rise hanko-rise-1 mt-12 font-display text-5xl md:text-7xl lg:text-display font-medium tracking-tight text-base-content">
                                Discipline,
                                <br />
                                <span className="hanko-brush italic text-primary">made visible.</span>
                            </h1>
                            <p className="hanko-rise hanko-rise-2 mt-10 max-w-2xl text-lg leading-relaxed text-base-content/70">
                                A kanban that respects your attention. The work in front of you,
                                in the order you'll finish it. Nothing else asking to be looked at.
                            </p>
                            <div className="hanko-rise hanko-rise-3 mt-12 flex flex-wrap items-center gap-8">
                                <Link
                                    href="/sign-up"
                                    className="hanko-stamp btn btn-primary focus-visible:shadow-focus"
                                >
                                    Start a kata
                                </Link>
                                <Link
                                    href="/features"
                                    className="text-sm font-mono uppercase tracking-widest text-base-content/60 hover:text-base-content focus-visible:shadow-focus rounded-sm px-2 py-2 transition-colors"
                                >
                                    See the dojo
                                </Link>
                            </div>
                        </div>

                        {/* The work, in motion — real Agile Sprint board, two card moves.
                            Silent autoplay, poster-only for prefers-reduced-motion. */}
                        <HankoVideo
                            sources={{ mp4: '/videos/hero.mp4' }}
                            poster="/videos/hero.jpg"
                            alt="The Agile Sprint board: a card moves from To Do to In Progress, then another from In Progress to Review."
                            aspect="16:9"
                            className="hanko-rise hanko-rise-4 lg:col-span-7"
                        />
                    </div>
                </div>
            </section>

            {/* In any chat — the strategic positioning slot. The hero says what
                we are; this section says where you can use us. Lands before the
                four kata so visitors meet the chat thesis before the feature grid. */}
            <section className="border-t border-base-300 bg-base-100">
                <div className="container mx-auto px-6 md:px-12 lg:px-16 py-24 lg:py-32">
                    <div className="hanko-scroll-rise max-w-3xl">
                        <p className="hanko-eyebrow text-eyebrow font-mono uppercase tracking-widest text-primary">
                            Now in your chat
                        </p>
                        <h2 className="mt-8 font-display text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight">
                            Your dojo,{' '}
                            <span className="italic text-primary">in any chat.</span>
                        </h2>
                        <p className="mt-10 text-lg leading-relaxed text-base-content/70">
                            kanNINJA lives inside Claude, ChatGPT, and any agent that
                            speaks MCP. The same board, the same kata, the same clan —
                            driven from the chat you already use.
                        </p>
                        <p className="mt-6 text-lg leading-relaxed text-base-content/70">
                            Project management, where the conversation already lives.
                        </p>
                        <Link
                            href="/in-any-chat"
                            className="mt-12 inline-flex btn btn-outline btn-secondary focus-visible:shadow-focus"
                        >
                            See how it works
                        </Link>
                    </div>
                </div>
            </section>

            {/* The four kata — features as disciplines. Hairline divider, no shift in surface. */}
            <section className="border-y border-base-300">
                <div className="container mx-auto px-6 md:px-12 lg:px-16 py-24 lg:py-32">
                    <div className="max-w-3xl">
                        <p className="hanko-eyebrow text-eyebrow font-mono uppercase text-primary">
                            The four kata
                        </p>
                        <h2 className="mt-8 font-display text-4xl md:text-5xl font-medium tracking-tight">
                            Tools that <span className="italic text-primary">earn</span> their place.
                        </h2>
                        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-base-content/70">
                            Not a checklist of features. Four disciplines you'll come back to
                            every day.
                        </p>
                    </div>
                    {/* Bento grid: featured tall card (01) on the left, two compact
                        cards (02, 03) top-right, wide card (04) bottom-right. */}
                    <div className="mt-20 grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-6">
                        <KataCard
                            featured
                            className="md:row-span-2"
                            number="01"
                            icon={faBolt}
                            title="Honed reflexes"
                            body="Drag a card. It moves the instant your finger does. The motion is supposed to disappear, so the only thing left is the work in front of you. The reps you're here to do."
                        />
                        <KataCard
                            number="02"
                            icon={faUsers}
                            title="Live presence"
                            body="When your clan moves a card, you see it move. No refresh button. No notification storm — just the work happening alongside you."
                        />
                        <KataCard
                            number="03"
                            icon={faRobot}
                            title="AI as second"
                            body="Watches how you actually work. Offers next steps you can accept or ignore. A quiet second pair of eyes — no takeover, no magic."
                        />
                        <KataCard
                            className="md:col-span-2"
                            number="04"
                            icon={faChartLine}
                            title="Honest signal"
                            body="Charts that show what's actually happening — not what looks good in a screenshot. We don't dress numbers up to make Mondays feel productive."
                        />
                    </div>
                </div>
            </section>

            {/* Four refusals — mirror-rhyme with the four kata. What kanNINJA
                refuses to do is the clearest signal of what it actually is. */}
            <FourRefusalsSection />

            {/* Editorial intermezzo — one line. A deliberate caesura between
                feature density and the closing CTA. No eyebrow, no chrome,
                just type and breath. The brushstroke fires on scroll. */}
            <section>
                <div className="container mx-auto px-6 md:px-12 lg:px-16 py-32 lg:py-48">
                    <h2 className="hanko-scroll-rise font-display text-5xl md:text-6xl lg:text-7xl font-medium tracking-tight max-w-4xl">
                        Mastery is{' '}
                        <span className="hanko-brush-scroll italic text-primary">
                            practice.
                        </span>
                    </h2>
                </div>
            </section>

            {/* Founder voice — a single quoted paragraph that grounds the
                philosophical line above in a real story. Body Inter at display
                scale (Fraunces is reserved for headlines). */}
            <section>
                <div className="container mx-auto px-6 md:px-12 lg:px-16 py-24 lg:py-32">
                    <div className="hanko-scroll-rise max-w-3xl">
                        <p className="hanko-eyebrow text-eyebrow font-mono uppercase text-primary">
                            Why we built this
                        </p>
                        <blockquote className="mt-12 text-2xl md:text-3xl leading-snug text-base-content font-medium">
                            We started kanNINJA because the boards we used at our last
                            jobs were honest about everything except how much our work
                            was hurting. We wanted a tool that watched, then helped,
                            then got out of the way.
                        </blockquote>
                        <p className="mt-10 text-eyebrow font-mono uppercase tracking-widest text-base-content/40">
                            — wizeworks · {new Date().getFullYear()}
                        </p>
                    </div>
                </div>
            </section>

            {/* Closing — sumi panel with the vermillion 忍 seal, mirrored from
                the brand guide's "One stamp. One thousand uses." panel. */}
            <section className="bg-neutral text-neutral-content">
                <div className="container mx-auto px-6 md:px-12 lg:px-16 py-32 lg:py-40">
                    <div className="hanko-scroll-rise grid grid-cols-1 md:grid-cols-[1fr_auto] gap-16 md:gap-24 lg:gap-32 items-center">
                        <div className="max-w-2xl">
                            <p className="hanko-eyebrow text-eyebrow font-mono uppercase text-primary">
                                Begin
                            </p>
                            <h2 className="mt-8 font-display text-5xl md:text-6xl lg:text-7xl font-medium tracking-tight">
                                Train <span className="italic text-primary">daily.</span>
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
                            alt="kanNINJA vermillion 忍 seal — the brand stamp"
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

