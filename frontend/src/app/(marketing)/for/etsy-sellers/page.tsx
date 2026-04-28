import type { Metadata } from 'next';
import { PersonaPage } from '@/components/marketing/persona/PersonaPage';
import type { PersonaData } from '@/components/marketing/persona/types';
import { buildPageMetadata } from '@/lib/seo';

const data: PersonaData = {
    label: 'Etsy sellers',
    hero: {
        eyebrow: 'kanNINJA for Etsy sellers',
        headlineBefore: 'Every order, every craft,',
        headlineItalic: 'every restock.',
        subtitle:
            'A board for the orders, the materials, and the December rush you swore you would handle better this year.',
    },
    intro:
        "Selling on Etsy is a one-person factory. Orders come in. Materials run out. The custom listing needs a conversation. The holiday rush is closer than it feels. kanNINJA gives the maker a board so the orders stop hiding in the inbox and the restock list stops hiding in your head.",
    // Sample board lives in @kanninja/shared (templates/personas/etsy-sellers.ts).
    useCases: [
        {
            title: 'Orders, end to end.',
            body: 'New, in progress, ready to ship, shipped. The board mirrors your bench. When a buyer asks "where is my order?", the column is the answer.',
        },
        {
            title: 'Custom orders without losing the conversation.',
            body: 'A card per custom request. The buyer message, the size, the color, the proof you sent. Comments capture every back-and-forth.',
        },
        {
            title: 'Restock and materials.',
            body: 'A board for raw materials. When you use the last of something, drag it to "order now." The day you sit down to restock, the list is built.',
        },
        {
            title: 'New listings and product launches.',
            body: 'A board for the next launch. Photos, copy, SEO keywords, scheduled go-live. The launch becomes a project, not a panic.',
        },
        {
            title: 'The holiday rush, planned.',
            body: 'A board for November and December. Order cutoff dates, gift-wrap stock, the day to stop accepting custom work. The rush stops being a wall.',
        },
        {
            title: 'AI for breaking down the new product line.',
            body: 'Ask the AI to break "launch new earrings collection" into cards. Adjust to your shop. Get back to the bench.',
        },
    ],
    faqs: [
        {
            q: 'Does it sync with Etsy?',
            a: 'Not yet. Etsy API integration is on the list. For now, you paste the order number on the card.',
        },
        {
            q: 'Can my packer or assistant use it?',
            a: 'Yes. Invite them. Real-time presence. They see what is ready to ship; you see what they have packed. The mid-day "what is left?" question stops being a question.',
        },
        {
            q: 'Does it handle inventory?',
            a: 'It handles the awareness of inventory — restock cards, "running low" labels — but it is not an inventory system. Pair with Craftybase or a spreadsheet for the actual counts.',
        },
        {
            q: 'How much does it cost?',
            a: 'Free for one maker. Free for two on a shared board. Most Etsy shops never need the paid tiers.',
        },
        {
            q: 'Is there a holiday-rush template?',
            a: 'Not yet — but you can ask the AI to break down "Etsy holiday rush prep" and it gets you most of the way. We will probably add real templates as the requests pile up.',
        },
    ],
    close: {
        headlineBefore: 'The shop,',
        headlineItalic: 'caught up.',
    },
};

export const metadata: Metadata = buildPageMetadata({
    title: 'kanNINJA for Etsy sellers',
    description:
        'A kanban for the orders, the materials, and the December rush. Built for the one-person factory that is a small Etsy shop.',
    path: '/for/etsy-sellers',
    ogTitle: 'kanNINJA for Etsy sellers',
    ogEyebrow: 'For Etsy sellers',
    keywords: ['Etsy seller tools', 'Etsy order management', 'kanban for Etsy', 'handmade business app', 'Etsy shop organizer'],
});

export default function ForEtsySellersPage() {
    return <PersonaPage slug="etsy-sellers" data={data} />;
}
