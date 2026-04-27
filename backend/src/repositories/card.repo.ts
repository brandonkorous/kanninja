import { db } from '../db/index.js';
import { cards } from '../db/schema/cards.js';
import { eq, asc, desc } from 'drizzle-orm';
import { generateIndexAfter, generateInitialIndex } from '../utils/order-index.js';

export const cardRepo = {
  async findByList(listId: string) {
    return db.select().from(cards).where(eq(cards.listId, listId)).orderBy(asc(cards.orderIndex));
  },

  async findById(cardId: string) {
    const [card] = await db.select().from(cards).where(eq(cards.id, cardId)).limit(1);
    return card ?? null;
  },

  async create(data: {
    listId: string;
    title: string;
    description?: string;
    priority?: string;
    assigneeId?: string;
    startDate?: string;
    dueDate?: string;
    estimatedHours?: number;
    createdBy: string;
  }) {
    // Get last card in the list for ordering
    const [lastCard] = await db
      .select({ orderIndex: cards.orderIndex })
      .from(cards)
      .where(eq(cards.listId, data.listId))
      .orderBy(desc(cards.orderIndex))
      .limit(1);

    const orderIndex = lastCard
      ? generateIndexAfter(lastCard.orderIndex)
      : generateInitialIndex();

    const [card] = await db
      .insert(cards)
      .values({
        listId: data.listId,
        title: data.title,
        description: data.description ?? null,
        priority: (data.priority as 'none' | 'low' | 'medium' | 'high' | 'urgent') ?? 'none',
        assigneeId: data.assigneeId ?? null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        estimatedHours: data.estimatedHours?.toString() ?? null,
        createdBy: data.createdBy,
        orderIndex,
      })
      .returning();

    return card;
  },

  async update(
    cardId: string,
    data: Partial<{
      title: string;
      description: string | null;
      priority: 'none' | 'low' | 'medium' | 'high' | 'urgent';
      assigneeId: string | null;
      startDate: Date | null;
      dueDate: Date | null;
      isCompleted: boolean;
      completedAt: Date | null;
      estimatedHours: string | null;
      progress: number;
      listId: string;
      orderIndex: string;
    }>,
  ) {
    const [card] = await db
      .update(cards)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(cards.id, cardId))
      .returning();
    return card ?? null;
  },

  async delete(cardId: string) {
    await db.delete(cards).where(eq(cards.id, cardId));
  },
};
