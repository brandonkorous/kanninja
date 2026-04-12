import { db } from '../db/index.js';
import { lists } from '../db/schema/lists.js';
import { eq, asc, desc } from 'drizzle-orm';
import { generateIndexAfter, generateInitialIndex } from '../utils/order-index.js';

export const listRepo = {
  async findByBoard(boardId: string) {
    return db
      .select()
      .from(lists)
      .where(eq(lists.boardId, boardId))
      .orderBy(asc(lists.orderIndex));
  },

  async findById(listId: string) {
    const [list] = await db.select().from(lists).where(eq(lists.id, listId)).limit(1);
    return list ?? null;
  },

  async create(data: { boardId: string; title: string }) {
    // Get the last list to determine order index
    const [lastList] = await db
      .select({ orderIndex: lists.orderIndex })
      .from(lists)
      .where(eq(lists.boardId, data.boardId))
      .orderBy(desc(lists.orderIndex))
      .limit(1);

    const orderIndex = lastList
      ? generateIndexAfter(lastList.orderIndex)
      : generateInitialIndex();

    const [list] = await db
      .insert(lists)
      .values({
        boardId: data.boardId,
        title: data.title,
        orderIndex,
      })
      .returning();

    return list;
  },

  async update(listId: string, data: Partial<{ title: string; orderIndex: string }>) {
    const [list] = await db
      .update(lists)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(lists.id, listId))
      .returning();
    return list ?? null;
  },

  async delete(listId: string) {
    await db.delete(lists).where(eq(lists.id, listId));
  },
};
