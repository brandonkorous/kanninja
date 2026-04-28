import type { Metadata } from 'next';
import { PersonaPage } from '@/components/marketing/persona/PersonaPage';
import type { PersonaData } from '@/components/marketing/persona/types';
import { buildPageMetadata } from '@/lib/seo';

const data: PersonaData = {
    label: 'Startups',
    hero: {
        eyebrow: 'kanNINJA for startups',
        headlineBefore: 'The work that actually',
        headlineItalic: 'moves the needle.',
        subtitle:
            'Founder, first hires, the next fundraise. A board for the work that compounds — and the work that just feels productive.',
    },
    intro:
        "Startups die from the wrong things being done well, not the right things being done badly. We built kanNINJA so the founder and the early team can keep the actual priorities visible — and so the work that just feels productive (the inbox, the busywork, the sixth tweak to the deck) does not crowd out the work that actually moves the company.",
    // Sample board lives in @kanninja/shared (templates/personas/startups.ts).
    useCases: [
        {
            title: '"Needs founder" is a real column.',
            body: 'The team flags work that requires founder approval, signature, or judgment. The bottleneck becomes visible, not theoretical. Quarterly OKRs live in a strategy doc and on labels; the kanban is for what is moving today.',
        },
        {
            title: 'Customer interviews and feedback as cards.',
            body: 'Every interview is a card. Quotes in comments. Patterns surface as you re-read. The "what are users telling us" question gets answered by the board.',
        },
        {
            title: 'Fundraising as a board.',
            body: 'A pipeline of investors. Where each one is — pitched, in diligence, term sheet, signed, passed. The fundraise stops eating the founder’s mental RAM.',
        },
        {
            title: 'AI for breaking down "ship v1 of the API".',
            body: 'Ask the AI to break a quarterly objective into weekly cards. Edit for what you actually need. The first hour of the quarter pays back ten.',
        },
        {
            title: 'MCP server for the agent that drafts your investor update.',
            body: 'Wire kanNINJA into Claude. The agent reads the board, asks for quotes from customer interview cards, and drafts a real investor update — not a vibes one.',
        },
    ],
    faqs: [
        {
            q: 'Is this overkill for a 2-person startup?',
            a: 'No. Two-person startups are exactly when discipline pays back the hardest. The board is small, but the priorities are still real.',
        },
        {
            q: 'Will it scale to a Series A team?',
            a: 'Up to about 30 seats it scales naturally. Past 50 you may want portfolio views we do not have yet.',
        },
        {
            q: 'Should we use this or Linear?',
            a: 'If your work is mostly engineering and tickets, Linear is purpose-built for that. If your work is a mix of engineering, GTM, fundraising, and ops, kanNINJA fits the broader shape.',
        },
        {
            q: 'How does it handle OKRs?',
            a: 'Not as a separate concept. The "this quarter" column is your OKR list — the kata you have committed to. Cards underneath are the work to deliver them.',
        },
        {
            q: 'Is the AI suggesting strategy?',
            a: 'No. The AI breaks work down and drafts updates. It does not pick your strategy. That is your job; we just make sure the work after that decision is visible.',
        },
    ],
    close: {
        headlineBefore: 'Build the right',
        headlineItalic: 'thing.',
    },
};

export const metadata: Metadata = buildPageMetadata({
    title: 'kanNINJA for startups',
    description:
        'A kanban for the founder and the early team. The work that compounds, separated from the work that just feels productive.',
    path: '/for/startups',
    ogTitle: 'kanNINJA for startups',
    ogEyebrow: 'For startups',
    keywords: ['startup project management', 'founder productivity', 'kanban for startups', 'early-stage team tools', 'startup operations'],
});

export default function ForStartupsPage() {
    return <PersonaPage slug="startups" data={data} />;
}
