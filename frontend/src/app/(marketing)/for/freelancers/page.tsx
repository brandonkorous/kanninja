import type { Metadata } from 'next';
import { PersonaPage } from '@/components/marketing/persona/PersonaPage';
import type { PersonaData } from '@/components/marketing/persona/types';
import { buildPageMetadata } from '@/lib/seo';

const data: PersonaData = {
    label: 'Freelancers',
    hero: {
        eyebrow: 'kanNINJA for freelancers',
        headlineBefore: 'Every client, every deadline,',
        headlineItalic: 'the dignity intact.',
        subtitle:
            'A board for the work, the invoices, and the four projects that all somehow have a Friday deadline. Built for the person who has to do all of it.',
    },
    intro:
        "Freelance work means you are the project manager and the operator. The good news: nobody schedules a meeting to plan the meeting. The hard part: there is nobody to remind you the contract is unsigned. We built kanNINJA so the work is always one drag away from done — and the bookkeeping no longer hides at the bottom of the list.",
    // Sample board lives in @kanninja/shared (templates/personas/freelancers.ts)
    // so /for/freelancers and /templates render the same starting point.
    useCases: [
        {
            title: 'A board per client.',
            body: 'Or one board with a swimlane per client. Whatever fits your brain. Cards carry the work, the comments, the files, the invoices.',
        },
        {
            title: 'Time tracking, on the card itself.',
            body: 'Start the timer when you start the work. Stop it when you stop. The total goes on the card and rolls up to the invoice. No spreadsheet.',
        },
        {
            title: 'The "waiting on client" column.',
            body: 'The single most useful column for any freelancer. When a client asks why a project is delayed, the column is the answer.',
        },
        {
            title: 'Invoices, on a separate board.',
            body: 'A board for the bookkeeping. Cards for invoices sent, paid, overdue. The column you cannot ignore on the day you have to chase a payment.',
        },
        {
            title: 'AI for breaking down the proposal.',
            body: 'Ask the AI to break a project brief into kata. Edit. Quote. Send. The hour you usually lose to "where do I start" goes back to the work.',
        },
        {
            title: 'A clear log when the contract goes sideways.',
            body: 'Every change request, every revision round, every comment lives on the card. When a client says "I never asked for that," the receipt is right there.',
        },
    ],
    faqs: [
        {
            q: 'Can my clients see the board?',
            a: 'Optional. Some freelancers love the transparency; others keep boards internal. You decide per board, per client.',
        },
        {
            q: 'Does the time tracking handle billing?',
            a: 'It tracks. It does not invoice. Pair it with whatever invoicing tool you already trust — Stripe, Bonsai, FreshBooks. We do not want to be your accountant.',
        },
        {
            q: 'Can I export hours to my accountant?',
            a: 'CSV export of time entries is on the list. For now, the totals are visible per card and per board.',
        },
        {
            q: 'Is the free tier really free for solo work?',
            a: 'Yes. Forever. The paid tiers are for the AI and for adding teammates — most freelancers stay free for years.',
        },
        {
            q: 'Will the AI write proposals for me?',
            a: 'It can break a brief into cards. It does not write client-facing copy. You stay the expert; it just clears the runway.',
        },
    ],
    close: {
        headlineBefore: 'Every kata,',
        headlineItalic: 'shipped.',
    },
};

export const metadata: Metadata = buildPageMetadata({
    title: 'kanNINJA for freelancers',
    description:
        'A kanban for the work, the invoices, and the four projects that all have a Friday deadline. Time tracking on the card. Built for solo work.',
    path: '/for/freelancers',
    ogTitle: 'kanNINJA for freelancers',
    ogEyebrow: 'For freelancers',
    keywords: ['kanban for freelancers', 'freelancer project management', 'time tracking for freelancers', 'solo project management', 'freelance organizer'],
});

export default function ForFreelancersPage() {
    return <PersonaPage slug="freelancers" data={data} />;
}
