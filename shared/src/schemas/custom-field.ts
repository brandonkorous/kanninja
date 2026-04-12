import { z } from 'zod';
import { CustomFieldType } from '../enums.js';

const fieldTypeValues = Object.values(CustomFieldType) as [string, ...string[]];

export const createCustomFieldDefinitionSchema = z.object({
  name: z.string().min(1).max(100),
  fieldType: z.enum(fieldTypeValues),
  options: z.record(z.unknown()).optional(),
  isRequired: z.boolean().optional().default(false),
});

export const updateCustomFieldDefinitionSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  options: z.record(z.unknown()).optional(),
  isRequired: z.boolean().optional(),
});

export const setCustomFieldValueSchema = z.object({
  value: z.unknown(),
});

export const customFieldDefinitionSchema = z.object({
  id: z.string().uuid(),
  boardId: z.string().uuid(),
  name: z.string(),
  fieldType: z.enum(fieldTypeValues),
  options: z.record(z.unknown()).nullable(),
  isRequired: z.boolean(),
  orderIndex: z.number(),
  createdBy: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type CustomFieldDefinition = z.infer<typeof customFieldDefinitionSchema>;
export type CreateCustomFieldDefinitionInput = z.infer<typeof createCustomFieldDefinitionSchema>;
export type UpdateCustomFieldDefinitionInput = z.infer<typeof updateCustomFieldDefinitionSchema>;
export type SetCustomFieldValueInput = z.infer<typeof setCustomFieldValueSchema>;
