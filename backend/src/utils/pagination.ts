import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

export function paginate(input: PaginationInput) {
  const offset = (input.page - 1) * input.pageSize;
  return { limit: input.pageSize, offset, page: input.page, pageSize: input.pageSize };
}
