import type { Metadata } from 'next';
import { PersonaPage } from '@/components/marketing/persona/PersonaPage';
import type { PersonaData } from '@/components/marketing/persona/types';
import { buildPageMetadata } from '@/lib/seo';

const data: PersonaData = {
    label: 'Agencies',
    hero: {
        eyebrow: 'kanNINJA for agencies',
        headlineBefore: 'Every client, every retainer,',
        headlineItalic: 'every brief.',
        subtitle:
            'A board per client, a clan per team, time tracked on the card. Built for shops that bill by the hour and ship by the week.',
    },
    intro:
        'Agencies live in a constant interleave of client work, internal work, and the next pitch. We built kanNINJA so the project management does not become its own client. A board per engagement, a clan for the people on it, time tracked where the work happens. Less meta-work, more ship.',
    // Sample board lives in @kanninja/shared (templates/personas/agencies.ts).
    useCases: [
        {
            title: 'A board per client.',
            body: 'Each engagement is its own board. The team only sees what they are on. Switching contexts at 11am is one click, not a refactor of your brain.',
        },
        {
            title: 'Time tracking that rolls up to the invoice.',
            body: 'Start the timer when you start the work. The total goes on the card and on the project. Month-end reconciliation is an hour, not an evening.',
        },
        {
            title: 'Clan-based access — clients see what you choose.',
            body: 'Make a board read-only for the client clan. Internal cards stay internal. The status update happens by them logging in, not by you writing one.',
        },
        {
            title: 'The pitch pipeline.',
            body: 'A board for new business. Discovery, proposal sent, signed, lost. Where every prospect is, without paying for a CRM that does too much.',
        },
        {
            title: 'A retainer board, already shaped.',
            body: 'The brief comes in. Start from "A board for a client retainer", edit, quote, send. The first hour of every engagement gets twenty minutes back.',
        },
        {
            title: 'MCP server for your in-house agents.',
            body: 'Wire kanNINJA into your agency Claude or Cursor setup. Drafting status updates, generating slides, querying project state — the agent has direct read/write to the board.',
        },
    ],
    faqs: [
        {
            q: 'Can I bring clients onto the board?',
            a: 'Yes — and most agencies do. Use clan permissions to scope what they see. Some agencies invite the client into a "client clan" with read-only access to specific boards.',
        },
        {
            q: 'Does it handle retainer hours?',
            a: 'Time tracking on cards rolls up per board, so monthly retainer hours are visible at a glance. We do not invoice — pair with QuickBooks, FreshBooks, or whatever you bill from.',
        },
        {
            q: 'Can I have a separate board for each engagement?',
            a: 'Yes — boards are cheap. Most agencies run one board per active client plus one for new business and one for internal work.',
        },
        {
            q: 'Does it have white-label?',
            a: 'Not yet. The agency-branded subdomain is on the roadmap.',
        },
        {
            q: 'How much for a 10-person agency?',
            a: 'The Clan plan: $12 per seat per month, so $120 a month for ten. Add and remove seats as engagements start and finish — the invoice follows. Two months free yearly.',
        },
    ],
    close: {
        headlineBefore: 'Bill the hour,',
        headlineItalic: 'ship the work.',
    },
};

export const metadata: Metadata = buildPageMetadata({
    title: 'kanNINJA for agencies',
    description:
        'A board per client, a clan per team, time tracked on the card. Built for agencies that bill by the hour and ship by the week.',
    path: '/for/agencies',
    ogTitle: 'kanNINJA for agencies',
    ogEyebrow: 'For agencies',
    keywords: ['kanban for agencies', 'agency project management', 'client retainer tracker', 'agency time tracking', 'creative agency tools'],
});

export default function ForAgenciesPage() {
    return <PersonaPage slug="agencies" data={data} />;
}
