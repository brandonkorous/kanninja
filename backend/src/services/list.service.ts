import { listRepo } from '../repositories/list.repo.js';
import { AppError } from '../utils/errors.js';
import { generateNIndices } from '../utils/order-index.js';
import type { CreateListInput, UpdateListInput, ReorderListsInput } from '@kanninja/shared';

export const listService = {
  async listByBoard(boardId: string) {
    return listRepo.findByBoard(boardId);
  },

  async createList(boardId: string, input: CreateListInput) {
    return listRepo.create({ boardId, title: input.title });
  },

  async updateList(listId: string, input: UpdateListInput) {
    const list = await listRepo.findById(listId);
    if (!list) throw AppError.notFound('List');

    return listRepo.update(listId, { title: input.title });
  },

  async deleteList(listId: string) {
    const list = await listRepo.findById(listId);
    if (!list) throw AppError.notFound('List');

    await listRepo.delete(listId);
  },

  async reorderLists(boardId: string, input: ReorderListsInput) {
    const indices = generateNIndices(input.orderedIds.length);

    await Promise.all(
      input.orderedIds.map((id, i) => listRepo.update(id, { orderIndex: indices[i] })),
    );

    return listRepo.findByBoard(boardId);
  },
};
