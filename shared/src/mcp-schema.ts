import { z } from 'zod';

/**
 * Convert a Zod schema to a JSON Schema object suitable for MCP inputSchema.
 * Handles the subset of Zod types used across @kanninja/shared schemas.
 */
export function zodToJsonSchema(schema: z.ZodTypeAny): Record<string, unknown> {
  return walk(schema);
}

function walk(schema: z.ZodTypeAny): Record<string, unknown> {
  // Unwrap wrappers first
  if (schema instanceof z.ZodOptional) return walk(schema.unwrap());
  if (schema instanceof z.ZodDefault) return walk(schema.removeDefault());

  if (schema instanceof z.ZodNullable) {
    const inner = walk(schema.unwrap());
    return { ...inner, nullable: true };
  }

  if (schema instanceof z.ZodString) {
    const out: Record<string, unknown> = { type: 'string' };
    for (const check of (schema as z.ZodString)._def.checks) {
      if (check.kind === 'min') out.minLength = check.value;
      if (check.kind === 'max') out.maxLength = check.value;
      if (check.kind === 'uuid') out.format = 'uuid';
      if (check.kind === 'datetime') out.format = 'date-time';
      if (check.kind === 'email') out.format = 'email';
    }
    return out;
  }

  if (schema instanceof z.ZodNumber) {
    const out: Record<string, unknown> = { type: 'number' };
    for (const check of (schema as z.ZodNumber)._def.checks) {
      if (check.kind === 'min') out.minimum = check.value;
      if (check.kind === 'max') out.maximum = check.value;
      if (check.kind === 'int') out.type = 'integer';
    }
    return out;
  }

  if (schema instanceof z.ZodBoolean) return { type: 'boolean' };

  if (schema instanceof z.ZodEnum) {
    return { type: 'string', enum: schema._def.values };
  }

  if (schema instanceof z.ZodArray) {
    return { type: 'array', items: walk(schema._def.type) };
  }

  if (schema instanceof z.ZodObject) {
    const shape = schema._def.shape();
    const properties: Record<string, unknown> = {};
    const required: string[] = [];

    for (const [key, value] of Object.entries(shape)) {
      properties[key] = walk(value as z.ZodTypeAny);
      if (!(value instanceof z.ZodOptional) && !(value instanceof z.ZodDefault)) {
        required.push(key);
      }
    }

    const out: Record<string, unknown> = { type: 'object', properties };
    if (required.length > 0) out.required = required;
    return out;
  }

  // Fallback
  return {};
}
