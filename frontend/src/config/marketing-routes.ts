// Single source of truth for /vs/* and /for/* slugs. Imported by sitemap,
// llms.txt, the index pages, and the dynamic route handlers themselves so
// adding a new persona is a one-line change.

export interface ComparisonRoute {
    slug: string;
    competitor: string;
    competitorShort: string;
}

export const COMPARISON_ROUTES: ComparisonRoute[] = [
    { slug: 'trello', competitor: 'Trello', competitorShort: 'Trello' },
    { slug: 'asana', competitor: 'Asana', competitorShort: 'Asana' },
    { slug: 'monday', competitor: 'Monday.com', competitorShort: 'Monday' },
    { slug: 'clickup', competitor: 'ClickUp', competitorShort: 'ClickUp' },
    { slug: 'notion', competitor: 'Notion', competitorShort: 'Notion' },
    { slug: 'linear', competitor: 'Linear', competitorShort: 'Linear' },
];

export interface PersonaRoute {
    slug: string;
    label: string;
    category: 'personal' | 'creator' | 'business';
}

export const PERSONA_ROUTES: PersonaRoute[] = [
    // Personal life — large search volume, every other kanban tool ignores
    { slug: 'moms', label: 'Moms', category: 'personal' },
    { slug: 'dads', label: 'Dads', category: 'personal' },
    { slug: 'weddings', label: 'Wedding planning', category: 'personal' },
    { slug: 'students', label: 'Students', category: 'personal' },
    { slug: 'moving', label: 'Moving house', category: 'personal' },
    { slug: 'home-renovations', label: 'Home renovations', category: 'personal' },
    { slug: 'travel-planning', label: 'Travel planning', category: 'personal' },
    { slug: 'holidays', label: 'Holidays & hosting', category: 'personal' },
    // Creator / solo professional
    { slug: 'freelancers', label: 'Freelancers', category: 'creator' },
    { slug: 'youtubers', label: 'YouTubers', category: 'creator' },
    { slug: 'etsy-sellers', label: 'Etsy sellers', category: 'creator' },
    { slug: 'realtors', label: 'Realtors', category: 'creator' },
    { slug: 'event-planners', label: 'Event planners', category: 'creator' },
    // Business / team
    { slug: 'teams', label: 'Teams', category: 'business' },
    { slug: 'agencies', label: 'Agencies', category: 'business' },
    { slug: 'remote-teams', label: 'Remote teams', category: 'business' },
    { slug: 'startups', label: 'Startups', category: 'business' },
];
