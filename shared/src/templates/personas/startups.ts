import type { BoardTemplate } from '../types.js';

export const STARTUPS_TEMPLATE: BoardTemplate = {
    id: 'startups',
    name: 'A board for an early-stage startup',
    description:
        'Founder, first hires, the next fundraise. The work that compounds, separate from the work that just feels productive.',
    category: 'team',
    personaSlug: 'startups',
    lists: [
        {
            title: 'Backlog',
            cards: [
                { title: 'Customer interviews — 5 done by Friday' },
                { title: 'Update fundraising deck' },
                { title: 'Onboard new pilot customer' },
                { title: 'Bug triage — top 3 from feedback' },
            ],
        },
        {
            title: 'In progress',
            cards: [
                { title: 'Hit $20k MRR — push' },
                { title: 'Hire first full-time engineer — interviews' },
                { title: 'Ship v1 of the API — last bug' },
            ],
        },
        {
            title: 'Needs founder',
            cards: [
                { title: 'Approve hire — engineering' },
                { title: 'Sign vendor contract — Stripe enterprise' },
                { title: 'Investor reply — follow-up due' },
                { title: 'Close lead investor on seed' },
            ],
        },
        {
            title: 'Shipped',
            cards: [
                { title: 'Landing page test #3' },
                { title: 'New onboarding flow' },
                { title: 'Customer interview deck' },
            ],
        },
    ],
};
