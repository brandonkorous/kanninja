import Link from 'next/link';
import type { Metadata } from 'next';
import { KataDeepdiveSection } from '@/components/marketing/KataDeepdiveSection';
import { AiTechniquesSection } from '@/components/marketing/AiTechniquesSection';

export const metadata: Metadata = {
    title: 'kanNINJA — Features',
    description:
        'Four disciplines. Twenty-eight features. Grouped by kata so you can find what you came for.',
    openGraph: {
        title: 'kanNINJA — Features',
        description: 'Every feature, grouped by kata.',
        type: 'website',
    },
};

const KATA_01_FEATURES = [
    {
        name: 'Cards.',
        body: "The unit of work. Title, description, comments, attachments. Open one in a side panel; the board doesn't move.",
    },
    {
        name: 'Lists.',
        body: 'Stages of work. Drag a card across; the activity log remembers where it came from.',
    },
    {
        name: 'Boards.',
        body: 'Projects, or sprints, or weeks of practice. Whatever the right unit is for you.',
    },
    {
        name: 'Checklists.',
        body: 'Subtasks inside a card. Tick them off without leaving the card.',
    },
    {
        name: 'Labels and custom fields.',
        body: "Color, status, owner, anything. We won't pretend to know what you need.",
    },
    {
        name: 'File attachments.',
        body: 'Screenshots, PDFs, voice memos, the spec the client emailed at midnight. They live with the card.',
    },
    {
        name: 'Time tracking.',
        body: 'Start the timer. Stop it. The total goes on the card. No spreadsheets.',
    },
    {
        name: 'Mobile and keyboard.',
        body: 'Touch on the phone, keyboard at the desk. Both first-class.',
    },
];

const KATA_02_FEATURES = [
    {
        name: 'Clans.',
        body: 'Permissions that match how you actually divide work. Three roles, no more. Stop fighting the permission tree.',
    },
    {
        name: 'Presence avatars.',
        body: "See who is on which card right now. No more 'who's editing this?'",
    },
    {
        name: 'Comments and @mentions.',
        body: 'Discuss inline. @mention pulls a teammate into the thread. Conversations stay with the card.',
    },
    {
        name: 'Notification preferences.',
        body: 'You decide what reaches you. Defaults are quiet on purpose.',
    },
];

const KATA_04_FEATURES = [
    {
        name: 'Burndown.',
        body: 'How much you have left versus how much you committed. Honest about the slope, even when the slope is bad.',
    },
    {
        name: 'Velocity.',
        body: 'How much you finish per cycle. Trended over time. Not a leaderboard.',
    },
    {
        name: 'Cycle time.',
        body: 'How long a card sits in each stage. Where the work actually slows down.',
    },
    {
        name: 'Audit log.',
        body: 'Every change, with the actor and the timestamp. Required for some teams. Quiet for the rest.',
    },
];

export default function FeaturesPage() {
    return (
        <>
            {/* Hero */}
            <section className="relative overflow-hidden">
                <div className="container mx-auto px-6 md:px-12 lg:px-16 pt-24 pb-24 lg:pt-32 lg:pb-32">
                    <div className="max-w-4xl">
                        <p className="hanko-rise hanko-eyebrow text-eyebrow font-mono uppercase text-primary">
                            Features
                        </p>
                        <h1 className="hanko-rise hanko-rise-1 mt-12 font-display text-5xl md:text-6xl lg:text-7xl font-medium tracking-tight text-base-content">
                            Every feature,{' '}
                            <span className="hanko-brush italic text-primary">
                                grouped by kata.
                            </span>
                        </h1>
                        <p className="hanko-rise hanko-rise-2 mt-10 max-w-2xl text-lg leading-relaxed text-base-content/70">
                            Four disciplines. Twenty-eight features. We grouped them so you can
                            find what you came for.
                        </p>
                    </div>
                </div>
            </section>

            <KataDeepdiveSection
                number="01"
                kataName="Honed reflexes"
                headlineBefore="The kanban that"
                headlineItalic="disappears."
                intro="Drag a card. It moves the instant your finger does. Mobile and keyboard are equal citizens. Nothing in this section is decoration."
                features={KATA_01_FEATURES}
            />

            <KataDeepdiveSection
                number="02"
                kataName="Live presence"
                headlineBefore="Your clan, in"
                headlineItalic="real time."
                intro="When someone moves a card, you see it move. Real-time is not a feature here — it is how the product is shaped."
                features={KATA_02_FEATURES}
            />

            <AiTechniquesSection />

            <KataDeepdiveSection
                number="04"
                kataName="Honest signal"
                headlineBefore="Numbers that"
                headlineItalic="don't lie."
                intro="Burndown when burndown matters. Velocity when velocity does. We don't dress numbers up to make Mondays feel productive."
                features={KATA_04_FEATURES}
            />

            {/* Closing — sumi panel with seal */}
            <section className="bg-neutral text-neutral-content">
                <div className="container mx-auto px-6 md:px-12 lg:px-16 py-32 lg:py-40">
                    <div className="hanko-scroll-rise grid grid-cols-1 md:grid-cols-[1fr_auto] gap-16 md:gap-24 lg:gap-32 items-center">
                        <div className="max-w-2xl">
                            <p className="hanko-eyebrow text-eyebrow font-mono uppercase text-primary">
                                Begin
                            </p>
                            <h2 className="mt-8 font-display text-5xl md:text-6xl lg:text-7xl font-medium tracking-tight">
                                Start with one{' '}
                                <span className="italic text-primary">kata.</span>
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
