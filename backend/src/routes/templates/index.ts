import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../../middleware/require-auth.js';
import { db } from '../../db/index.js';
import { boards } from '../../db/schema/boards.js';
import { lists } from '../../db/schema/lists.js';
import { cards } from '../../db/schema/cards.js';
import { eq, asc } from 'drizzle-orm';
import { generateInitialIndex, generateIndexAfter } from '../../utils/order-index.js';

const applyTemplateSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  lists: z.array(
    z.object({
      title: z.string(),
      cards: z.array(
        z.object({
          title: z.string(),
          description: z.string().optional(),
          priority: z.enum(['none', 'low', 'medium', 'high', 'urgent']).optional(),
        }),
      ),
    }),
  ),
});

const BUILT_IN_TEMPLATES = [
  {
    id: 'agile-sprint',
    name: 'Agile Sprint',
    description: 'Standard agile sprint board with backlog, in-progress, review, and done',
    lists: ['Backlog', 'To Do', 'In Progress', 'Review', 'Done'],
  },
  {
    id: 'simple-kanban',
    name: 'Simple Kanban',
    description: 'Three-column kanban for any workflow',
    lists: ['To Do', 'Doing', 'Done'],
  },
  {
    id: 'content-pipeline',
    name: 'Content Pipeline',
    description: 'For blog posts, videos, or social content',
    lists: ['Ideas', 'Drafting', 'Editing', 'Scheduled', 'Published'],
  },
  {
    id: 'bug-tracker',
    name: 'Bug Tracker',
    description: 'Track bug reports through resolution',
    lists: ['Reported', 'Triaged', 'In Progress', 'Testing', 'Resolved'],
  },
  {
    id: 'product-launch',
    name: 'Product Launch',
    description: 'Coordinate a product launch across teams',
    lists: ['Planning', 'Development', 'Marketing', 'QA', 'Launch', 'Post-launch'],
  },
];

export async function templateRoutes(fastify: FastifyInstance) {
  // List built-in templates
  fastify.get(
    '/api/v1/templates/boards',
    { preHandler: [requireAuth] },
    async () => {
      return { data: BUILT_IN_TEMPLATES };
    },
  );

  // Apply a template (creates a new board with lists/cards)
  fastify.post(
    '/api/v1/templates/boards/apply',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const input = applyTemplateSchema.parse(request.body);

      // Applied templates become personal boards (no clan attached)
      // by default — the creator is the owner via boards.user_id and
      // can attach a clan later if they want to share the template.
      const [board] = await db
        .insert(boards)
        .values({
          title: input.title,
          description: input.description ?? null,
          userId: request.profileId!,
        })
        .returning();

      let listOrder = generateInitialIndex();
      for (const listInput of input.lists) {
        const [list] = await db
          .insert(lists)
          .values({ boardId: board.id, title: listInput.title, orderIndex: listOrder })
          .returning();
        listOrder = generateIndexAfter(listOrder);

        let cardOrder = generateInitialIndex();
        for (const cardInput of listInput.cards) {
          await db.insert(cards).values({
            listId: list.id,
            title: cardInput.title,
            description: cardInput.description ?? null,
            priority: cardInput.priority ?? 'none',
            orderIndex: cardOrder,
            createdBy: request.profileId!,
          });
          cardOrder = generateIndexAfter(cardOrder);
        }
      }

      return reply.status(201).send({ data: board });
    },
  );

  // Save existing board as template (returns serialized template)
  fastify.post<{ Params: { boardId: string } }>(
    '/api/v1/templates/boards/from-board/:boardId',
    { preHandler: [requireAuth] },
    async (request) => {
      const [board] = await db.select().from(boards).where(eq(boards.id, request.params.boardId)).limit(1);
      if (!board) return { data: null };

      const boardLists = await db
        .select()
        .from(lists)
        .where(eq(lists.boardId, board.id))
        .orderBy(asc(lists.orderIndex));

      const result = {
        title: board.title,
        description: board.description,
        lists: await Promise.all(
          boardLists.map(async (list) => {
            const listCards = await db
              .select()
              .from(cards)
              .where(eq(cards.listId, list.id))
              .orderBy(asc(cards.orderIndex));
            return {
              title: list.title,
              cards: listCards.map((c) => ({
                title: c.title,
                description: c.description,
                priority: c.priority,
              })),
            };
          }),
        ),
      };

      return { data: result };
    },
  );
}
