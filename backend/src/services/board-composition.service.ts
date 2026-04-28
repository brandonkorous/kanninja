import { db } from '../db/index.js';
import { boards } from '../db/schema/boards.js';
import { boardClans } from '../db/schema/board-clans.js';
import { lists } from '../db/schema/lists.js';
import { cards } from '../db/schema/cards.js';
import {
  cardChecklistItems,
  customLabels,
  cardLabels,
} from '../db/schema/card-features.js';
import { eq, and, asc, desc, inArray, isNull, or } from 'drizzle-orm';
import { generateIndexAfter, generateInitialIndex } from '../utils/order-index.js';
import { AppError } from '../utils/errors.js';
import type {
  CreateBoardWithStructureInput,
  ApplyStructureToBoardInput,
  BulkCreateCardsInput,
  BulkUpdateCardsInput,
  DuplicateCardInput,
} from '@kanninja/shared';

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

// Insert one list of cards into one list (column). Used by both
// createBoardWithStructure and applyStructureToBoard. Returns the
// inserted card rows in order.
async function insertCardsForList(
  tx: Tx,
  listId: string,
  cardInputs: NonNullable<CreateBoardWithStructureInput['lists'][number]['cards']>,
  userId: string,
  labelByName: Map<string, string>,
) {
  if (cardInputs.length === 0) return [];

  let prevIndex: string | null = null;
  const insertedCards: Array<typeof cards.$inferSelect> = [];

  for (const input of cardInputs) {
    const orderIndex: string = prevIndex ? generateIndexAfter(prevIndex) : generateInitialIndex();
    prevIndex = orderIndex;

    const [card] = await tx
      .insert(cards)
      .values({
        listId,
        title: input.title,
        description: input.description ?? null,
        priority: input.priority ?? 'none',
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        estimatedHours: input.estimatedHours?.toString() ?? null,
        createdBy: userId,
        orderIndex,
      })
      .returning();
    insertedCards.push(card);

    if (input.checklist?.length) {
      await tx.insert(cardChecklistItems).values(
        input.checklist.map((title, i) => ({
          cardId: card.id,
          userId,
          title,
          orderIndex: i + 1,
        })),
      );
    }

    if (input.labelNames?.length) {
      const labelIds: string[] = [];
      for (const name of input.labelNames) {
        const id = labelByName.get(name);
        if (!id) {
          throw AppError.validationError(
            `Card "${input.title}" references unknown label "${name}"`,
          );
        }
        labelIds.push(id);
      }
      if (labelIds.length > 0) {
        await tx.insert(cardLabels).values(
          labelIds.map((labelId) => ({ cardId: card.id, labelId })),
        );
      }
    }
  }

  return insertedCards;
}

// Insert the labels block (top-level on createBoardWithStructure /
// applyStructureToBoard inputs). Returns a name → id map for the cards
// step to look up by name.
async function insertLabels(
  tx: Tx,
  boardId: string,
  userId: string,
  labelInputs: NonNullable<CreateBoardWithStructureInput['labels']>,
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (labelInputs.length === 0) return map;

  const rows = await tx
    .insert(customLabels)
    .values(
      labelInputs.map((l) => ({
        userId,
        boardId,
        name: l.name,
        color: l.color,
      })),
    )
    .returning({ id: customLabels.id, name: customLabels.name });

  for (const row of rows) map.set(row.name, row.id);
  return map;
}

// When applying a structure to an existing board, cards may reference
// labels that already exist on the board (or are user-global). Build
// a lookup from name → id covering global + this-board-scoped labels
// before inserting the new ones, then layer the new ones on top.
async function loadExistingLabelNames(
  tx: Tx,
  boardId: string,
  userId: string,
): Promise<Map<string, string>> {
  const rows = await tx
    .select({ id: customLabels.id, name: customLabels.name })
    .from(customLabels)
    .where(
      or(
        and(eq(customLabels.userId, userId), isNull(customLabels.boardId)),
        eq(customLabels.boardId, boardId),
      ),
    );
  const map = new Map<string, string>();
  for (const row of rows) map.set(row.name, row.id);
  return map;
}

export const boardCompositionService = {
  async createBoardWithStructure(input: CreateBoardWithStructureInput, userId: string) {
    return db.transaction(async (tx) => {
      const [board] = await tx
        .insert(boards)
        .values({
          userId,
          title: input.title,
          description: input.description ?? null,
          color: input.color ?? null,
        })
        .returning();

      if (input.clanId) {
        await tx.insert(boardClans).values({
          boardId: board.id,
          clanId: input.clanId,
          role: 'owner',
        });
      }

      const labelByName = await insertLabels(tx, board.id, userId, input.labels ?? []);

      let listIndex: string | null = null;
      const insertedLists: Array<{ id: string; title: string; orderIndex: string; cards: Array<typeof cards.$inferSelect> }> = [];

      for (const listInput of input.lists) {
        const orderIndex: string = listIndex ? generateIndexAfter(listIndex) : generateInitialIndex();
        listIndex = orderIndex;

        const [list] = await tx
          .insert(lists)
          .values({ boardId: board.id, title: listInput.title, orderIndex })
          .returning();

        const insertedCards = await insertCardsForList(
          tx,
          list.id,
          listInput.cards ?? [],
          userId,
          labelByName,
        );

        insertedLists.push({
          id: list.id,
          title: list.title,
          orderIndex: list.orderIndex,
          cards: insertedCards,
        });
      }

      return {
        board,
        labels: Array.from(labelByName.entries()).map(([name, id]) => ({ id, name })),
        lists: insertedLists,
      };
    });
  },

  async applyStructureToBoard(boardId: string, input: ApplyStructureToBoardInput, userId: string) {
    return db.transaction(async (tx) => {
      const [board] = await tx
        .select({ id: boards.id })
        .from(boards)
        .where(eq(boards.id, boardId))
        .limit(1);
      if (!board) throw AppError.notFound('Board');

      // Append after the rightmost existing list. If the board has no
      // lists, start from the initial fractional index.
      const [last] = await tx
        .select({ orderIndex: lists.orderIndex })
        .from(lists)
        .where(eq(lists.boardId, boardId))
        .orderBy(desc(lists.orderIndex))
        .limit(1);

      let listIndex: string | null = last?.orderIndex ?? null;

      const labelByName = await loadExistingLabelNames(tx, boardId, userId);
      const newLabelMap = await insertLabels(tx, boardId, userId, input.labels ?? []);
      // New labels override existing entries with the same name — caller
      // explicitly asked for these in this call.
      for (const [name, id] of newLabelMap) labelByName.set(name, id);

      const insertedLists: Array<{ id: string; title: string; orderIndex: string; cards: Array<typeof cards.$inferSelect> }> = [];

      for (const listInput of input.lists) {
        const orderIndex: string = listIndex ? generateIndexAfter(listIndex) : generateInitialIndex();
        listIndex = orderIndex;

        const [list] = await tx
          .insert(lists)
          .values({ boardId, title: listInput.title, orderIndex })
          .returning();

        const insertedCards = await insertCardsForList(
          tx,
          list.id,
          listInput.cards ?? [],
          userId,
          labelByName,
        );

        insertedLists.push({
          id: list.id,
          title: list.title,
          orderIndex: list.orderIndex,
          cards: insertedCards,
        });
      }

      return {
        boardId,
        labels: Array.from(newLabelMap.entries()).map(([name, id]) => ({ id, name })),
        lists: insertedLists,
      };
    });
  },

  async bulkCreateCards(boardId: string, input: BulkCreateCardsInput, userId: string) {
    // Validate every listId belongs to this board before opening the tx —
    // saves rolling back if the caller mixed boards.
    const listIds = Array.from(new Set(input.cards.map((c) => c.listId)));
    const validLists = await db
      .select({ id: lists.id })
      .from(lists)
      .where(and(eq(lists.boardId, boardId), inArray(lists.id, listIds)));
    if (validLists.length !== listIds.length) {
      throw AppError.validationError(
        'One or more listIds do not belong to this board',
        { boardId, listIds },
      );
    }

    return db.transaction(async (tx) => {
      // Find the current rightmost orderIndex per affected list once,
      // then generate sequential indices in memory.
      const lastByList = new Map<string, string | null>();
      for (const listId of listIds) {
        const [last] = await tx
          .select({ orderIndex: cards.orderIndex })
          .from(cards)
          .where(eq(cards.listId, listId))
          .orderBy(desc(cards.orderIndex))
          .limit(1);
        lastByList.set(listId, last?.orderIndex ?? null);
      }

      const inserted: Array<typeof cards.$inferSelect> = [];
      for (const c of input.cards) {
        const prev = lastByList.get(c.listId) ?? null;
        const orderIndex = prev ? generateIndexAfter(prev) : generateInitialIndex();
        lastByList.set(c.listId, orderIndex);

        const [row] = await tx
          .insert(cards)
          .values({
            listId: c.listId,
            title: c.title,
            description: c.description ?? null,
            priority: c.priority ?? 'none',
            assigneeId: c.assigneeId ?? null,
            startDate: c.startDate ? new Date(c.startDate) : null,
            dueDate: c.dueDate ? new Date(c.dueDate) : null,
            estimatedHours: c.estimatedHours?.toString() ?? null,
            createdBy: userId,
            orderIndex,
          })
          .returning();
        inserted.push(row);
      }

      return inserted;
    });
  },

  async bulkUpdateCards(boardId: string, input: BulkUpdateCardsInput) {
    const cardIds = Array.from(new Set(input.updates.map((u) => u.cardId)));

    // Confirm every card lives under this board (via its list) so the
    // caller can't smuggle updates onto cards they can't see.
    const owned = await db
      .select({ id: cards.id })
      .from(cards)
      .innerJoin(lists, eq(cards.listId, lists.id))
      .where(and(eq(lists.boardId, boardId), inArray(cards.id, cardIds)));
    if (owned.length !== cardIds.length) {
      throw AppError.validationError(
        'One or more cardIds do not belong to this board',
        { boardId, cardIds },
      );
    }

    return db.transaction(async (tx) => {
      const updated: Array<typeof cards.$inferSelect> = [];
      for (const u of input.updates) {
        const set: Partial<typeof cards.$inferInsert> = { updatedAt: new Date() };
        if (u.title !== undefined) set.title = u.title;
        if (u.description !== undefined) set.description = u.description;
        if (u.priority !== undefined) set.priority = u.priority;
        if (u.assigneeId !== undefined) set.assigneeId = u.assigneeId;
        if (u.dueDate !== undefined) set.dueDate = u.dueDate ? new Date(u.dueDate) : null;
        if (u.estimatedHours !== undefined) {
          set.estimatedHours = u.estimatedHours == null ? null : u.estimatedHours.toString();
        }
        if (u.progress !== undefined) set.progress = u.progress;
        if (u.isCompleted !== undefined) {
          set.isCompleted = u.isCompleted;
          set.completedAt = u.isCompleted ? new Date() : null;
        }

        const [row] = await tx
          .update(cards)
          .set(set)
          .where(eq(cards.id, u.cardId))
          .returning();
        updated.push(row);
      }
      return updated;
    });
  },

  async duplicateCard(
    boardId: string,
    cardId: string,
    options: DuplicateCardInput,
    userId: string,
  ) {
    // Source has to exist on this board. Resolve via list join so the
    // route's requireBoardRole check covers authorization for the source.
    const [source] = await db
      .select({
        id: cards.id,
        listId: cards.listId,
        title: cards.title,
        description: cards.description,
        priority: cards.priority,
        assigneeId: cards.assigneeId,
        startDate: cards.startDate,
        dueDate: cards.dueDate,
        estimatedHours: cards.estimatedHours,
      })
      .from(cards)
      .innerJoin(lists, eq(cards.listId, lists.id))
      .where(and(eq(cards.id, cardId), eq(lists.boardId, boardId)))
      .limit(1);
    if (!source) throw AppError.notFound('Card');

    const targetListId = options.targetListId ?? source.listId;

    // If the caller provided a different target, that list must also live
    // on this board — same protection as bulkCreateCards.
    if (options.targetListId && options.targetListId !== source.listId) {
      const [list] = await db
        .select({ id: lists.id })
        .from(lists)
        .where(and(eq(lists.id, targetListId), eq(lists.boardId, boardId)))
        .limit(1);
      if (!list) {
        throw AppError.validationError('targetListId does not belong to this board');
      }
    }

    return db.transaction(async (tx) => {
      const [last] = await tx
        .select({ orderIndex: cards.orderIndex })
        .from(cards)
        .where(eq(cards.listId, targetListId))
        .orderBy(desc(cards.orderIndex))
        .limit(1);
      const orderIndex = last ? generateIndexAfter(last.orderIndex) : generateInitialIndex();

      const [clone] = await tx
        .insert(cards)
        .values({
          listId: targetListId,
          title: options.titleOverride ?? source.title,
          description: source.description,
          priority: source.priority,
          assigneeId: source.assigneeId,
          startDate: source.startDate,
          dueDate: source.dueDate,
          estimatedHours: source.estimatedHours,
          createdBy: userId,
          orderIndex,
        })
        .returning();

      if (options.includeChecklist) {
        const items = await tx
          .select({
            title: cardChecklistItems.title,
            completed: cardChecklistItems.completed,
            orderIndex: cardChecklistItems.orderIndex,
          })
          .from(cardChecklistItems)
          .where(eq(cardChecklistItems.cardId, cardId))
          .orderBy(asc(cardChecklistItems.orderIndex));
        if (items.length > 0) {
          await tx.insert(cardChecklistItems).values(
            items.map((item) => ({
              cardId: clone.id,
              userId,
              title: item.title,
              completed: item.completed,
              orderIndex: item.orderIndex,
            })),
          );
        }
      }

      if (options.includeLabels) {
        const links = await tx
          .select({ labelId: cardLabels.labelId })
          .from(cardLabels)
          .where(eq(cardLabels.cardId, cardId));
        if (links.length > 0) {
          await tx.insert(cardLabels).values(
            links.map((l) => ({ cardId: clone.id, labelId: l.labelId })),
          );
        }
      }

      return clone;
    });
  },
};
