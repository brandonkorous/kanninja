import type { Metadata } from 'next';
import { PersonaPage } from '@/components/marketing/persona/PersonaPage';
import type { PersonaData } from '@/components/marketing/persona/types';
import { buildPageMetadata } from '@/lib/seo';

const data: PersonaData = {
    label: 'Home renovators',
    hero: {
        eyebrow: 'kanNINJA for home renovations',
        headlineBefore: 'Every room, every contractor,',
        headlineItalic: 'every receipt.',
        subtitle:
            'A board for the kitchen remodel, the bathroom redo, the basement finally finished. The whole project, end to end.',
    },
    intro:
        "Renovations always take longer and cost more than the spreadsheet said. kanNINJA does not fix that — but it makes the slope visible. Every contractor, every quote, every change order, every dump run. The room that’s done. The room that is not. The day the tile finally arrives.",
    // Sample board lives in @kanninja/shared (templates/personas/home-renovations.ts).
    useCases: [
        {
            title: 'The contractor list.',
            body: 'A card per contractor. Their bid, their license, their phone, the day they start, the day they finish. Comments capture every text.',
        },
        {
            title: 'The change-order trail.',
            body: 'When the contractor says "we can do this for an extra $400," the change order goes on the card. You have a paper trail without keeping a paper trail.',
        },
        {
            title: 'Materials and lead times.',
            body: "Tile, cabinets, fixtures, the appliance that’s on backorder until June. Cards with due dates surface what blocks the next phase.",
        },
        {
            title: 'Permits and inspections.',
            body: 'A column for everything the city wants. The day you submitted, the day you got it back. Inspectors love a paper trail.',
        },
        {
            title: 'The budget board.',
            body: "A board for spend. Cards for each line item. Drag to 'over' or 'under' as the bills come in. The honesty hurts a little, then it helps a lot.",
        },
        {
            title: 'A renovation board, phase by phase.',
            body: 'Start from "A board for the renovation" — permits, trades, change orders, the punch list. Save the planning time for the harder choices.',
        },
    ],
    faqs: [
        {
            q: 'Can my contractor see the board?',
            a: 'Yes — invite them by email. Most contractors prefer it to texting, once they try it. You both see the same plan and the same change orders.',
        },
        {
            q: 'Does it handle photos and floor plans?',
            a: 'Photos and PDFs attach to cards. Floor plans, inspection reports, swatches — all live with the relevant card. We do not draw floor plans natively.',
        },
        {
            q: 'Will it warn me when I am over budget?',
            a: "Not yet. The budget column shows the over/under at a glance, but kanNINJA is not an accounting tool. Pair it with a spreadsheet for the dollars.",
        },
        {
            q: 'How much does it cost?',
            a: 'Free for the homeowner. If you bring in your contractor and architect, you might cross a paid tier — still less than a single sheet of subway tile.',
        },
        {
            q: 'Will this tell me what my contractor is hiding?',
            a: 'No. kanNINJA holds the plan; it does not audit anyone. Trust comes from the change orders written on the cards, not from us.',
        },
    ],
    close: {
        headlineBefore: 'The room,',
        headlineItalic: 'finished.',
    },
};

export const metadata: Metadata = buildPageMetadata({
    title: 'kanNINJA for home renovations',
    description:
        'A kanban for the kitchen remodel, the bathroom redo, the basement finally finished. Every contractor, every change order, every dump run.',
    path: '/for/home-renovations',
    ogTitle: 'kanNINJA for home renovations',
    ogEyebrow: 'For home renovations',
    keywords: ['home renovation app', 'kitchen remodel tracker', 'renovation project management', 'contractor management app', 'home improvement kanban'],
});

export default function ForHomeRenovationsPage() {
    return <PersonaPage slug="home-renovations" data={data} />;
}
