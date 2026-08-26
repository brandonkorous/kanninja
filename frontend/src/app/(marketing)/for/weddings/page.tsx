import type { Metadata } from 'next';
import { PersonaPage } from '@/components/marketing/persona/PersonaPage';
import type { PersonaData } from '@/components/marketing/persona/types';
import { buildPageMetadata } from '@/lib/seo';

const data: PersonaData = {
    label: 'Wedding planners',
    hero: {
        eyebrow: 'kanNINJA for weddings',
        headlineBefore: 'Every detail, in',
        headlineItalic: 'the right order.',
        subtitle:
            'Vendors, RSVPs, the seating chart, the playlist someone keeps editing. A board for the year between the proposal and the day.',
    },
    intro:
        "Wedding planning is one big project that breaks into a hundred small ones. The dress, the venue, the guest list, the floral mock-up, the rehearsal dinner, the ceremony script, the day-of timeline. A spreadsheet works until it doesn't. A wedding planner app makes you live in their world. kanNINJA gives you a board and gets out of the way.",
    // Sample board lives in @kanninja/shared (templates/personas/weddings.ts).
    useCases: [
        {
            title: 'Every decision, in the right state.',
            body: 'Researching, booked, confirmed, done. A vendor moves from deciding to deposit paid to everything locked for the day. The state lives on the column; the date sits on the card.',
        },
        {
            title: 'Vendor management.',
            body: 'A card per vendor. Their email, their contract, their final balance, the day they need final numbers. Comments capture every conversation.',
        },
        {
            title: 'Guest list and RSVPs.',
            body: "A board for guests. Columns: invited, RSVP'd yes, RSVP'd no, dietary restrictions. Filter by table when you build the seating chart.",
        },
        {
            title: 'Shared with your partner and your planner.',
            body: 'Real-time presence. When your partner moves a card, you see it move. When your planner adds a vendor, it shows up. No more "what was decided?" texts.',
        },
        {
            title: 'The day-of timeline.',
            body: "A separate board for the wedding day itself. Hour-by-hour. The maid of honor, the photographer, and the venue manager all see the same plan.",
        },
        {
            title: 'A year of planning, already mapped.',
            body: 'Start from "A board for the year of planning" — twelve months of the things people forget, already on cards. Save the brainpower for the parts that matter.',
        },
    ],
    faqs: [
        {
            q: 'Can my wedding planner use this with me?',
            a: "Yes. Invite your planner to the board. They see what you see, in real time. Most planners we've talked to prefer it to email threads and shared docs.",
        },
        {
            q: 'Can I print the day-of timeline?',
            a: "Not natively yet — but you can copy a board to a doc and print it. The day-of view is best on a phone in the bridal suite.",
        },
        {
            q: 'Does it handle the seating chart?',
            a: "It handles the planning of the seating chart — cards per guest, columns per table — but it is not a visual seating-chart tool. For the actual layout, pair it with AllSeated or Prismm.",
        },
        {
            q: 'How much does it cost?',
            a: "Free for the engaged couple. Add your planner and your moms and you might cross into a paid tier — still well under what one bouquet costs.",
        },
        {
            q: 'After the wedding, what happens to the board?',
            a: 'Archive it. Or rename it "Anniversary planning." Or use it for the honeymoon. The board is yours.',
        },
    ],
    close: {
        headlineBefore: 'Plan the day,',
        headlineItalic: 'enjoy the day.',
    },
};

export const metadata: Metadata = buildPageMetadata({
    title: 'kanNINJA for wedding planning',
    description:
        "A kanban for the year between the proposal and the wedding day. Vendors, RSVPs, the timeline. Shared with your partner and your planner.",
    path: '/for/weddings',
    ogTitle: 'kanNINJA for wedding planning',
    ogEyebrow: 'For weddings',
    keywords: ['wedding planning app', 'wedding kanban', 'wedding to-do list', 'wedding planner app', 'wedding checklist'],
});

export default function ForWeddingsPage() {
    return <PersonaPage slug="weddings" data={data} />;
}
