import type { BoardTemplate } from '../types.js';

export const TEAMS_TEMPLATE: BoardTemplate = {
    id: 'teams',
    name: 'A board for a small product team',
    description:
        'Real-time presence, AI suggestions, honest analytics. Built for teams of two to twenty.',
    category: 'team',
    personaSlug: 'teams',
    lists: [
        {
            title: 'Backlog',
            cards: [
                { title: 'Onboarding redesign — research' },
                { title: 'Billing page accessibility audit' },
                { title: 'Push notifications — investigate' },
                { title: 'New customer testimonial collection' },
            ],
        },
        {
            title: 'In progress',
            cards: [
                { title: 'Ship dark mode (Maya)' },
                { title: 'Customer interview synthesis (Theo)' },
                { title: 'Pricing page A/B test (Jules)' },
            ],
        },
        {
            title: 'In review',
            cards: [
                { title: 'Auth refactor — code review' },
                { title: 'New onboarding email — copy review' },
            ],
        },
        {
            title: 'Done',
            cards: [
                { title: 'Stripe webhook fix' },
                { title: 'Quarterly retro doc' },
                { title: 'Customer support macro updates' },
            ],
        },
    ],
};
