import { db } from '../db/index.js';
import { cardComments } from '../db/schema/card-features.js';
import { profiles } from '../db/schema/profiles.js';
import { eq, asc } from 'drizzle-orm';

export const commentRepo = {
  async findByCard(cardId: string) {
    return db
      .select({
        id: cardComments.id,
        cardId: cardComments.cardId,
        userId: cardComments.userId,
        content: cardComments.content,
        mentions: cardComments.mentions,
        replyTo: cardComments.replyTo,
        createdAt: cardComments.createdAt,
        updatedAt: cardComments.updatedAt,
        author: {
          displayName: profiles.displayName,
          avatarUrl: profiles.avatarUrl,
        },
      })
      .from(cardComments)
      .innerJoin(profiles, eq(cardComments.userId, profiles.id))
      .where(eq(cardComments.cardId, cardId))
      .orderBy(asc(cardComments.createdAt));
  },

  async findById(commentId: string) {
    const [c] = await db.select().from(cardComments).where(eq(cardComments.id, commentId)).limit(1);
    return c ?? null;
  },

  async create(data: {
    cardId: string;
    userId: string;
    content: string;
    mentions?: string[];
    replyTo?: string;
  }) {
    const [c] = await db
      .insert(cardComments)
      .values({
        cardId: data.cardId,
        userId: data.userId,
        content: data.content,
        mentions: data.mentions ?? [],
        replyTo: data.replyTo ?? null,
      })
      .returning();
    return c;
  },

  async update(commentId: string, content: string) {
    const [c] = await db
      .update(cardComments)
      .set({ content, updatedAt: new Date() })
      .where(eq(cardComments.id, commentId))
      .returning();
    return c ?? null;
  },

  async delete(commentId: string) {
    await db.delete(cardComments).where(eq(cardComments.id, commentId));
  },
};
