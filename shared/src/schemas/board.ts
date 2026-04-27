import { z } from 'zod';

// Curated palette IDs — the SOURCE of truth for valid `color` values
// on a board. Stored as the slug (not a hex) so the visual treatment
// can be retuned in CSS/Tailwind without a data migration. Frontend
// `lib/card-colors.ts` maps slug → Tailwind class.
export const DOJO_COLOR_IDS = [
  'rose',
  'amber',
  'emerald',
  'sky',
  'violet',
  'pink',
  'teal',
  'orange',
] as const;
export type DojoColorId = (typeof DOJO_COLOR_IDS)[number];

const dojoColorSchema = z.enum(DOJO_COLOR_IDS);

// createBoardSchema still accepts `clanId` — it's no longer a column on
// the boards table, but it IS how the creator says "make this board
// available to this clan as part of creation." If provided, the backend
// inserts an initial row in `board_clans` with role='owner'. Omitted
// means a personal board (only the creator has access).
export const createBoardSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  clanId: z.string().uuid().optional(),
  color: dojoColorSchema.optional(),
});

export const updateBoardSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  color: dojoColorSchema.nullable().optional(),
  financialTrackingEnabled: z.boolean().optional(),
  projectBudget: z.number().nonnegative().nullable().optional(),
  projectValueGoal: z.number().nonnegative().nullable().optional(),
  currencyCode: z.string().length(3).optional(),
});

// Note: no `clanId` on the board row — boards belong to a creator and
// can be granted access to zero or more clans via the `board_clans`
// join table. Query that separately if you need the attachment list.
export const boardSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  color: dojoColorSchema.nullable(),
  financialTrackingEnabled: z.boolean(),
  projectBudget: z.number().nullable(),
  projectValueGoal: z.number().nullable(),
  currencyCode: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Board = z.infer<typeof boardSchema>;
export type CreateBoardInput = z.infer<typeof createBoardSchema>;
export type UpdateBoardInput = z.infer<typeof updateBoardSchema>;
