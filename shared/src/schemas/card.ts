import { z } from 'zod';
import { Priority } from '../enums.js';

const priorityValues = Object.values(Priority) as [string, ...string[]];

export const createCardSchema = z.object({
  listId: z.string().uuid(),
  title: z.string().min(1).max(500),
  description: z.string().max(10000).optional(),
  priority: z.enum(priorityValues).optional(),
  assigneeId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  dueDate: z.string().datetime().optional(),
  estimatedHours: z.number().nonnegative().optional(),
  /** Where the new kata lands in its list. Defaults to 'bottom' so
   *  existing API and MCP callers keep their current behaviour. */
  position: z.enum(['top', 'bottom']).optional(),
});

export const updateCardSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(10000).nullable().optional(),
  priority: z.enum(priorityValues).optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  startDate: z.string().datetime().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  isCompleted: z.boolean().optional(),
  estimatedHours: z.number().nonnegative().nullable().optional(),
  progress: z.number().min(0).max(100).optional(),
});

export const moveCardSchema = z
  .object({
    listId: z.string().uuid(),
    /** Explicit fractional index — what drag-and-drop sends, since the
     *  client already knows the exact neighbours it dropped between. */
    orderIndex: z.string().optional(),
    /** Symbolic destination — what the card's move-to-top / move-to-bottom
     *  menu sends. The server resolves it against the live list, so it
     *  stays correct even when the fractional key space needs respacing. */
    position: z.enum(['top', 'bottom']).optional(),
  })
  .refine((v) => v.orderIndex !== undefined || v.position !== undefined, {
    message: 'Provide either orderIndex or position',
  });

export const cardSchema = z.object({
  id: z.string().uuid(),
  listId: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  priority: z.enum(priorityValues),
  assigneeId: z.string().uuid().nullable(),
  createdBy: z.string().uuid(),
  startDate: z.string().datetime().nullable(),
  dueDate: z.string().datetime().nullable(),
  orderIndex: z.string(),
  isCompleted: z.boolean(),
  completedAt: z.string().datetime().nullable(),
  estimatedHours: z.number().nullable(),
  progress: z.number(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Card = z.infer<typeof cardSchema>;
export type CreateCardInput = z.infer<typeof createCardSchema>;
export type UpdateCardInput = z.infer<typeof updateCardSchema>;
export type MoveCardInput = z.infer<typeof moveCardSchema>;
