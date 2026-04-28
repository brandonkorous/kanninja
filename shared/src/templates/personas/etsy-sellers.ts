import type { BoardTemplate } from '../types.js';

export const ETSY_SELLERS_TEMPLATE: BoardTemplate = {
    id: 'etsy-sellers',
    name: 'A board for a small Etsy shop',
    description:
        'Every order, end to end. The one-person factory, on paper. (Restock lives on a separate board.)',
    category: 'solo',
    personaSlug: 'etsy-sellers',
    lists: [
        {
            title: 'New orders',
            cards: [
                { title: 'Order #4521 — custom name necklace' },
                { title: 'Order #4522 — gold ring (size 7)' },
                { title: 'Order #4523 — bridal earrings (rush)' },
            ],
        },
        {
            title: 'In progress',
            cards: [
                { title: 'Order #4519 — solder, polish' },
                { title: 'Order #4518 — engrave initials' },
            ],
        },
        {
            title: 'Ready to ship',
            cards: [
                { title: 'Order #4517 — packed, label printed' },
                { title: 'Order #4516 — ready, awaiting USPS pickup' },
            ],
        },
        {
            title: 'Shipped',
            cards: [
                { title: 'Order #4514 — shipped Mon' },
                { title: 'Order #4513 — shipped Mon' },
                { title: 'Order #4512 — shipped last week' },
            ],
        },
    ],
};
