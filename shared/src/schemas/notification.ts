import { z } from 'zod';

export const notificationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  type: z.string(),
  title: z.string(),
  message: z.string(),
  data: z.record(z.unknown()).nullable(),
  read: z.boolean(),
  createdAt: z.string().datetime(),
});

export type Notification = z.infer<typeof notificationSchema>;
