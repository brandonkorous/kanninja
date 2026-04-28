import type { Metadata } from 'next';
import { PersonaPage } from '@/components/marketing/persona/PersonaPage';
import type { PersonaData } from '@/components/marketing/persona/types';
import { buildPageMetadata } from '@/lib/seo';

const data: PersonaData = {
    label: 'Dads',
    hero: {
        eyebrow: 'kanNINJA for dads',
        headlineBefore: 'From honey-do to',
        headlineItalic: 'honey-done.',
        subtitle:
            'A board for the projects you keep meaning to start, the chores nobody volunteers for, and the kid stuff you actually own. Less list, more progress.',
    },
    intro:
        "We built kanNINJA so the things you said you'd handle actually have somewhere to live. The lawn, the garage, the trip to the dump. The Saturday project that becomes a six-week project. The kid's science fair. The car maintenance schedule that everyone forgets except for the day it matters. Cards on a board — done is a real column you can see.",
    // Sample board lives in @kanninja/shared (templates/personas/dads.ts).
    useCases: [
        {
            title: 'The honey-do list.',
            body: "The list is real. The board makes it visible — and finishable. Drag a card to done and feel the satisfaction you've earned.",
        },
        {
            title: 'House projects, broken down.',
            body: 'A new fence is not one card. It is a sub-board. Materials, permits, the helper you owe a beer, the dump runs. kanNINJA splits the project into kata you can actually finish.',
        },
        {
            title: 'Kid stuff you actually own.',
            body: 'The science fair, the soccer carpool, the tooth that finally fell out. A board makes "I got this" mean something.',
        },
        {
            title: 'Car and house maintenance.',
            body: 'Oil changes, filter changes, the gutter clean every fall. Cards with due dates so you stop finding out the hard way.',
        },
        {
            title: 'The shared board with your partner.',
            body: "Invite them. They see what you have done; you see what they have done. The lopsided feeling — sometimes deserved, sometimes not — gets replaced by what is actually on the board.",
        },
        {
            title: 'AI for the planning parts.',
            body: 'Ask the AI to break "remodel the basement" into a project board. Edit what it got wrong. Save the rest of your weekend for the work itself.',
        },
    ],
    faqs: [
        {
            q: 'Is this just another to-do app?',
            a: "No, and yes. The to-do list is the simple case. The point is the board — seeing the work in progress, the work waiting, the work done. The dignity of finished cards stacking up over a Saturday.",
        },
        {
            q: 'Can I use it without my partner seeing?',
            a: "Yes. Personal boards are private by default. Invite your partner only to the boards you both need to see — household stuff, kid logistics, the calendar.",
        },
        {
            q: 'Does it work on my phone?',
            a: "Yes. Drag works on touch. The board adjusts for the small screen. You can install it like an app from the browser.",
        },
        {
            q: 'How much does it cost?',
            a: "Free for one person, forever. Free for two, with shared boards. The paid tiers are for the AI and for bigger groups — most dads never need them.",
        },
        {
            q: 'Will the AI mansplain my own house to me?',
            a: 'No. The AI suggests when you ask. It never moves a card on its own. And we tested it on at least one dad who hates being told things.',
        },
    ],
    close: {
        headlineBefore: 'Saturday,',
        headlineItalic: 'finished.',
    },
};

export const metadata: Metadata = buildPageMetadata({
    title: 'kanNINJA for dads',
    description:
        "A kanban board for the honey-do list, the house projects, and the kid stuff you actually own. Done is a real column you can see.",
    path: '/for/dads',
    ogTitle: 'kanNINJA for dads',
    ogEyebrow: 'For dads',
    keywords: ['kanban for dads', 'honey-do list app', 'house project tracker', 'home maintenance app', 'dad organizer'],
});

export default function ForDadsPage() {
    return <PersonaPage slug="dads" data={data} />;
}
