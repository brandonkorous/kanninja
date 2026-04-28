import type { BoardTemplate, TemplateCategory } from './types.js';
import { CLASSIC_TEMPLATES } from './classics.js';
import { PERSONA_TEMPLATES } from './personas/index.js';

export type {
    BoardTemplate,
    TemplateCategory,
    TemplateCardPriority,
    TemplateCardSeed,
    TemplateListSeed,
} from './types.js';

// Personas first so users see audience-shaped boards before the dev classics.
export const BOARD_TEMPLATES: BoardTemplate[] = [
    ...PERSONA_TEMPLATES,
    ...CLASSIC_TEMPLATES,
];

export function getTemplateById(id: string): BoardTemplate | undefined {
    return BOARD_TEMPLATES.find((t) => t.id === id);
}

export function getTemplateByPersonaSlug(
    slug: string,
): BoardTemplate | undefined {
    return BOARD_TEMPLATES.find((t) => t.personaSlug === slug);
}

// Display order on /templates. 'classic' goes last because the personas are
// the more interesting starting points for most users.
export const TEMPLATE_CATEGORY_ORDER: TemplateCategory[] = [
    'life',
    'events',
    'projects',
    'solo',
    'team',
    'classic',
];

export const TEMPLATE_CATEGORY_LABEL: Record<TemplateCategory, string> = {
    life: 'Life',
    events: 'Events',
    projects: 'Projects',
    solo: 'Solo',
    team: 'Team',
    classic: 'Classic',
};
