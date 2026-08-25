import type { Metadata } from 'next';
import { PersonaPage } from '@/components/marketing/persona/PersonaPage';
import type { PersonaData } from '@/components/marketing/persona/types';
import { buildPageMetadata } from '@/lib/seo';

const data: PersonaData = {
    label: 'People moving house',
    hero: {
        eyebrow: 'kanNINJA for moving',
        headlineBefore: 'A move,',
        headlineItalic: 'made finishable.',
        subtitle:
            'Boxes, utilities, address changes, the cat. A board for the eight weeks between the offer and the new front door.',
    },
    intro:
        "Moving is the single most stressful project most people take on. The to-do list is real and it has a deadline. We built kanNINJA so the move stops living in your head — and so the partner who said they would handle the utilities can prove it.",
    // Sample board lives in @kanninja/shared (templates/personas/moving.ts).
    useCases: [
        {
            title: 'Every task, with its own date.',
            body: 'Columns hold the state — to do, scheduled, waiting on a third party, done. Card due dates handle the timeline. The two-week-out reminders surface on their own.',
        },
        {
            title: 'Address changes that nobody remembers.',
            body: "Bank, license, voter registration, USPS, every subscription, work HR, the dentist. A column you can finally finish.",
        },
        {
            title: 'Packing, room by room.',
            body: 'A board per room. Cards for what is in each box. When you can’t find the spatula three weeks later, the search is two clicks.',
        },
        {
            title: 'Shared with whoever is moving with you.',
            body: 'Invite your partner, your roommate, your parents. Real-time presence. The "I thought you were doing that" stops being a fight.',
        },
        {
            title: 'Movers, contractors, the cleaner.',
            body: 'A card per vendor. Their quote, their phone number, the day they show up. Comments capture every conversation.',
        },
        {
            title: 'A move board, already written.',
            body: 'Start from "A board for the move" — utilities, addresses, the deposit you will otherwise forget. Save the brain space for the actual move.',
        },
    ],
    faqs: [
        {
            q: 'When should I start the board?',
            a: 'The day you accept the offer or sign the lease. Eight weeks is generous; six weeks is realistic; four weeks is hectic but doable.',
        },
        {
            q: 'Will it integrate with my movers?',
            a: 'No — and we would not recommend it. Movers email and call. Capture the conversation in a comment on the card and you have the full thread when you need it.',
        },
        {
            q: 'Can it print a moving checklist?',
            a: 'Not natively. The board IS the checklist — and it stays alive after move day, which a printout does not.',
        },
        {
            q: 'How much does it cost?',
            a: 'Free for one person. Free for two on a shared board. The paid tiers exist for bigger groups — most moves never need them.',
        },
        {
            q: 'After the move, what do I do with the board?',
            a: "Archive it. Or rename it 'Setting up the new place.' Some users keep it as their long-term household board.",
        },
    ],
    close: {
        headlineBefore: 'New keys,',
        headlineItalic: 'old calm.',
    },
};

export const metadata: Metadata = buildPageMetadata({
    title: 'kanNINJA for moving house',
    description:
        'A kanban board for the eight weeks between the offer and the new front door. Boxes, utilities, address changes, the cat — finally on paper.',
    path: '/for/moving',
    ogTitle: 'kanNINJA for moving house',
    ogEyebrow: 'For moving',
    keywords: ['moving checklist app', 'moving house planner', 'kanban for moving', 'house move organizer', 'moving project tracker'],
});

export default function ForMovingPage() {
    return <PersonaPage slug="moving" data={data} />;
}
