import fp from 'fastify-plugin';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors.js';
import { ErrorCode } from '@kanninja/shared';

export const errorHandlerPlugin = fp(async (fastify) => {
  fastify.setErrorHandler((error, _request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        code: error.code,
        message: error.message,
        details: error.details,
      });
    }

    if (error instanceof ZodError) {
      return reply.status(400).send({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Validation failed',
        details: { issues: error.issues },
      });
    }

    // Fastify validation errors
    if (error instanceof Error && 'validation' in error) {
      return reply.status(400).send({
        code: ErrorCode.VALIDATION_ERROR,
        message: error.message,
      });
    }

    fastify.log.error(error);
    return reply.status(500).send({
      code: ErrorCode.INTERNAL_ERROR,
      message: 'Internal server error',
    });
  });
});
