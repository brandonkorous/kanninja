import { z } from 'zod';

export const createListSchema = z.object({
  title: z.string().min(1).max(200),
});

export const updateListSchema = z.object({
  title: z.string().min(1).max(200).optional(),
});

export const reorderListsSchema = z.object({
  orderedIds: z.array(z.string().uuid()),
});

export const listSchema = z.object({
  id: z.string().uuid(),
  boardId: z.string().uuid(),
  title: z.string(),
  orderIndex: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type List = z.infer<typeof listSchema>;
export type CreateListInput = z.infer<typeof createListSchema>;
export type UpdateListInput = z.infer<typeof updateListSchema>;
export type ReorderListsInput = z.infer<typeof reorderListsSchema>;
