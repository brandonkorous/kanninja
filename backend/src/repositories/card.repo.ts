import { db } from '../db/index.js';
import { cards } from '../db/schema/cards.js';
import { eq, asc, desc } from 'drizzle-orm';
import {
  generateIndexAfter,
  generateIndexBefore,
  generateInitialIndex,
  generateNIndices,
} from '../utils/order-index.js';

export const cardRepo = {
  async findByList(listId: string) {
    return db.select().from(cards).where(eq(cards.listId, listId)).orderBy(asc(cards.orderIndex));
  },

  async findById(cardId: string) {
    const [card] = await db.select().from(cards).where(eq(cards.id, cardId)).limit(1);
    return card ?? null;
  },

  /** Next order index for a card appended to the end of `listId`. */
  async tailIndexFor(listId: string) {
    const [lastCard] = await db
      .select({ orderIndex: cards.orderIndex })
      .from(cards)
      .where(eq(cards.listId, listId))
      .orderBy(desc(cards.orderIndex))
      .limit(1);

    return lastCard ? generateIndexAfter(lastCard.orderIndex) : generateInitialIndex();
  },

  /**
   * Next order index for a card inserted at the *head* of `listId`.
   *
   * Fractional indexing runs out of room below the head after a handful of
   * consecutive top-inserts (the alphabet has a floor of 'a'). When that
   * happens we respace the existing cards evenly and hand back the slot
   * above them, so the head stays insertable indefinitely. The respace is
   * O(n) writes but only fires on exhaustion, not on every insert.
   */
  async headIndexFor(listId: string) {
    const existing = await db
      .select({ id: cards.id, orderIndex: cards.orderIndex })
      .from(cards)
      .where(eq(cards.listId, listId))
      .orderBy(asc(cards.orderIndex));

    if (existing.length === 0) return generateInitialIndex();

    const head = generateIndexBefore(existing[0].orderIndex);
    if (head !== null) return head;

    // Exhausted — respace every existing card, reserving indices[0] for
    // the incoming card.
    const indices = generateNIndices(existing.length + 1);
    await Promise.all(
      existing.map((card, i) =>
        db.update(cards).set({ orderIndex: indices[i + 1] }).where(eq(cards.id, card.id)),
      ),
    );

    return indices[0];
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
    position?: 'top' | 'bottom';
    createdBy: string;
  }) {
    const orderIndex =
      data.position === 'top'
        ? await this.headIndexFor(data.listId)
        : await this.tailIndexFor(data.listId);

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
