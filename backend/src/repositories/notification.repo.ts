import { db } from '../db/index.js';
import { notificationQueue } from '../db/schema/notifications.js';

export const notificationRepo = {
  async create(data: {
    userId: string;
    type: string;
    title: string;
    message: string;
    data?: Record<string, unknown>;
  }) {
    const [n] = await db
      .insert(notificationQueue)
      .values(data)
      .returning();
    return n;
  },

  async createMany(
    rows: Array<{
      userId: string;
      type: string;
      title: string;
      message: string;
      data?: Record<string, unknown>;
    }>,
  ) {
    if (rows.length === 0) return [];
    return db.insert(notificationQueue).values(rows).returning();
  },
};
