// One file per persona, re-exported here as a flat array. Order roughly
// follows the categories displayed on /templates: life → events → projects →
// solo → team. Within a category, ordering is editorial.

import type { BoardTemplate } from '../types.js';
import { MOMS_TEMPLATE } from './moms.js';
import { DADS_TEMPLATE } from './dads.js';
import { STUDENTS_TEMPLATE } from './students.js';
import { HOLIDAYS_TEMPLATE } from './holidays.js';
import { WEDDINGS_TEMPLATE } from './weddings.js';
import { EVENT_PLANNERS_TEMPLATE } from './event-planners.js';
import { MOVING_TEMPLATE } from './moving.js';
import { HOME_RENOVATIONS_TEMPLATE } from './home-renovations.js';
import { TRAVEL_PLANNING_TEMPLATE } from './travel-planning.js';
import { FREELANCERS_TEMPLATE } from './freelancers.js';
import { YOUTUBERS_TEMPLATE } from './youtubers.js';
import { ETSY_SELLERS_TEMPLATE } from './etsy-sellers.js';
import { REALTORS_TEMPLATE } from './realtors.js';
import { TEAMS_TEMPLATE } from './teams.js';
import { AGENCIES_TEMPLATE } from './agencies.js';
import { REMOTE_TEAMS_TEMPLATE } from './remote-teams.js';
import { STARTUPS_TEMPLATE } from './startups.js';

export const PERSONA_TEMPLATES: BoardTemplate[] = [
    MOMS_TEMPLATE,
    DADS_TEMPLATE,
    STUDENTS_TEMPLATE,
    HOLIDAYS_TEMPLATE,
    WEDDINGS_TEMPLATE,
    EVENT_PLANNERS_TEMPLATE,
    MOVING_TEMPLATE,
    HOME_RENOVATIONS_TEMPLATE,
    TRAVEL_PLANNING_TEMPLATE,
    FREELANCERS_TEMPLATE,
    YOUTUBERS_TEMPLATE,
    ETSY_SELLERS_TEMPLATE,
    REALTORS_TEMPLATE,
    TEAMS_TEMPLATE,
    AGENCIES_TEMPLATE,
    REMOTE_TEAMS_TEMPLATE,
    STARTUPS_TEMPLATE,
];
