// Board templates are the single source of truth for both:
//   1. The /templates page (built-in templates a signed-in user can apply)
//   2. The /for/<persona> pages (their sampleBoard preview)
// One registry → no drift between marketing copy and the board you actually
// get when you click "Use this template".

export type TemplateCategory =
    | 'life'
    | 'events'
    | 'projects'
    | 'solo'
    | 'team'
    | 'classic';

export type TemplateCardPriority =
    | 'none'
    | 'low'
    | 'medium'
    | 'high'
    | 'urgent';

export interface TemplateCardSeed {
    title: string;
    description?: string;
    priority?: TemplateCardPriority;
    checklist?: string[];
}

export interface TemplateListSeed {
    title: string;
    cards: TemplateCardSeed[];
}

export interface BoardTemplate {
    /** Slug-style id; matches personaSlug for persona templates. */
    id: string;
    /** Display name for the templates grid. */
    name: string;
    /** One-sentence description for the templates grid. */
    description: string;
    /** Bucket the /templates page filters by. */
    category: TemplateCategory;
    /** When set, /for/<personaSlug> renders this template's sample board. */
    personaSlug?: string;
    /** Lists with seeded cards. Apply endpoint walks this directly. */
    lists: TemplateListSeed[];
}
