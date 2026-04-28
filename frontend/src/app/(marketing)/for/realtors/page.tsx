import type { Metadata } from 'next';
import { PersonaPage } from '@/components/marketing/persona/PersonaPage';
import type { PersonaData } from '@/components/marketing/persona/types';
import { buildPageMetadata } from '@/lib/seo';

const data: PersonaData = {
    label: 'Realtors',
    hero: {
        eyebrow: 'kanNINJA for realtors',
        headlineBefore: 'Every transaction,',
        headlineItalic: 'every deadline.',
        subtitle:
            'Listings, showings, offers, closings. A board for every client and every deal — without paying for a CRM that does too much.',
    },
    intro:
        'Real estate runs on deadlines that do not move. Inspection contingencies, financing periods, closing dates. Most CRMs in the industry are bloated and expensive — and yet a deal still slips because somebody forgot to file the addendum. kanNINJA gives you a board per transaction, and the calendar gets honest.',
    // Sample board lives in @kanninja/shared (templates/personas/realtors.ts).
    useCases: [
        {
            title: 'A board per transaction.',
            body: 'Every active deal is its own board. Columns for the phases — under contract, due diligence, financing, closing. Drag the cards as the dates pass.',
        },
        {
            title: 'Listings pipeline.',
            body: "A board for prospects, listings, under contract, sold. Where each home is in your funnel — visible at a glance, not buried in your CRM.",
        },
        {
            title: 'Showings and open houses.',
            body: 'A weekly board for the showings calendar. Every property, every showing, every feedback note from the buyer. Sellers get a real update.',
        },
        {
            title: 'Working with your team or assistant.',
            body: 'Invite your assistant, transaction coordinator, or co-agent. Real-time presence. The "did anyone send that contract?" question stops being a question.',
        },
        {
            title: 'Lender, title, and inspector tracking.',
            body: 'A card for each vendor. Their contact, their deadlines, the day they confirmed. No more chasing the title company at 4pm on closing day.',
        },
        {
            title: 'AI for breaking down a complex closing.',
            body: 'Ask the AI to break down a 30-day closing into cards. Edit for your jurisdiction. Save the brain space for the negotiation.',
        },
    ],
    faqs: [
        {
            q: 'Can it replace my MLS or CRM?',
            a: 'No. Your MLS is your MLS. A CRM that handles compliance and DocuSign integration may still be worth it. kanNINJA is the operational layer on top — the day-to-day work that the CRM does not show.',
        },
        {
            q: 'Does it integrate with DocuSign or dotloop?',
            a: 'Not yet. For now, attach the signed PDF to the relevant card and link to the dotloop or DocuSign URL.',
        },
        {
            q: 'Can my clients see the board?',
            a: "Optional. Some agents share a 'client view' so the buyer can see where things are. Most keep boards internal and send a weekly text update.",
        },
        {
            q: 'How much does it cost?',
            a: 'Free for solo agents. The paid tiers exist for teams and for the AI — even busy solo agents stay free.',
        },
        {
            q: 'Is the AI giving legal advice?',
            a: 'No. The AI helps you plan and break down work. It does not interpret contracts or give legal advice. Your broker, your attorney, your judgment.',
        },
    ],
    close: {
        headlineBefore: 'The deal,',
        headlineItalic: 'closed.',
    },
};

export const metadata: Metadata = buildPageMetadata({
    title: 'kanNINJA for realtors',
    description:
        'A kanban for every transaction and every deadline. Listings, showings, offers, closings — without paying for a CRM that does too much.',
    path: '/for/realtors',
    ogTitle: 'kanNINJA for realtors',
    ogEyebrow: 'For realtors',
    keywords: ['real estate transaction management', 'realtor productivity tool', 'kanban for realtors', 'real estate pipeline', 'transaction coordinator app'],
});

export default function ForRealtorsPage() {
    return <PersonaPage slug="realtors" data={data} />;
}
