import { z } from 'zod';

export const timeEntrySchema = z.object({
  id: z.string().uuid(),
  cardId: z.string().uuid(),
  userId: z.string().uuid(),
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime().nullable(),
  durationSeconds: z.number().nullable(),
  description: z.string().nullable(),
  isRunning: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const startTimeEntrySchema = z.object({
  description: z.string().max(500).optional(),
});

export type TimeEntry = z.infer<typeof timeEntrySchema>;
export type StartTimeEntryInput = z.infer<typeof startTimeEntrySchema>;
