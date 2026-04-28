import { z } from 'zod';
import { DOJO_COLOR_IDS } from './board.js';

// Composite write operations — one input, one transactional DB write,
// one round-trip from the agent's perspective. Each schema below maps
// 1:1 to a backend endpoint; failures inside the transaction roll back
// the whole call so the caller never sees partial state.

const priorityEnum = z.enum(['none', 'low', 'medium', 'high', 'urgent']);
const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/);

const structureCardSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(10000).optional(),
  priority: priorityEnum.optional(),
  dueDate: z.string().datetime().optional(),
  estimatedHours: z.number().nonnegative().optional(),
  // Item-level checklist seeded with the card. Strings get inserted
  // in order with completed=false.
  checklist: z.array(z.string().min(1).max(500)).max(50).optional(),
  // Names of labels (defined in the top-level `labels` array on the
  // board input) to attach to this card. Resolved post-insert by name
  // lookup — using names instead of IDs lets the caller compose the
  // whole structure in one go without minting label IDs first.
  labelNames: z.array(z.string().min(1).max(50)).max(20).optional(),
});

const structureListSchema = z.object({
  title: z.string().min(1).max(200),
  cards: z.array(structureCardSchema).max(200).optional(),
});

const structureLabelSchema = z.object({
  name: z.string().min(1).max(50),
  color: hexColor,
});

export const createBoardWithStructureSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  clanId: z.string().uuid().optional(),
  color: z.enum(DOJO_COLOR_IDS).optional(),
  // Board-scoped labels created up front so cards in `lists` can refer
  // to them by name. Skip if no card uses labels.
  labels: z.array(structureLabelSchema).max(50).optional(),
  lists: z.array(structureListSchema).min(1).max(50),
});

export const applyStructureToBoardSchema = z.object({
  // Same shape as createBoardWithStructure minus the board metadata.
  // Lists in the input are appended to the right of any existing lists
  // on the board; existing data is never touched.
  labels: z.array(structureLabelSchema).max(50).optional(),
  lists: z.array(structureListSchema).min(1).max(50),
});

const bulkCreateCardSchema = z.object({
  listId: z.string().uuid(),
  title: z.string().min(1).max(500),
  description: z.string().max(10000).optional(),
  priority: priorityEnum.optional(),
  assigneeId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  dueDate: z.string().datetime().optional(),
  estimatedHours: z.number().nonnegative().optional(),
});

export const bulkCreateCardsSchema = z.object({
  cards: z.array(bulkCreateCardSchema).min(1).max(100),
});

const bulkUpdateCardSchema = z.object({
  cardId: z.string().uuid(),
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(10000).nullable().optional(),
  priority: priorityEnum.optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  estimatedHours: z.number().nonnegative().nullable().optional(),
  isCompleted: z.boolean().optional(),
  progress: z.number().int().min(0).max(100).optional(),
});

export const bulkUpdateCardsSchema = z.object({
  updates: z.array(bulkUpdateCardSchema).min(1).max(100),
});

export const duplicateCardSchema = z.object({
  // Defaults: place clone in the same list as the source, keep checklist,
  // keep labels. Override any of these explicitly.
  targetListId: z.string().uuid().optional(),
  includeChecklist: z.boolean().default(true),
  includeLabels: z.boolean().default(true),
  titleOverride: z.string().min(1).max(500).optional(),
});

export type CreateBoardWithStructureInput = z.infer<typeof createBoardWithStructureSchema>;
export type ApplyStructureToBoardInput = z.infer<typeof applyStructureToBoardSchema>;
export type BulkCreateCardsInput = z.infer<typeof bulkCreateCardsSchema>;
export type BulkUpdateCardsInput = z.infer<typeof bulkUpdateCardsSchema>;
export type DuplicateCardInput = z.infer<typeof duplicateCardSchema>;
