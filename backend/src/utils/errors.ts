import { ErrorCode } from '@kanninja/shared';

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly statusCode: number = 500,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'AppError';
  }

  static unauthorized(message = 'Unauthorized') {
    return new AppError(ErrorCode.UNAUTHORIZED, message, 401);
  }

  static forbidden(message = 'Forbidden') {
    return new AppError(ErrorCode.FORBIDDEN, message, 403);
  }

  static notFound(resource = 'Resource') {
    return new AppError(ErrorCode.NOT_FOUND, `${resource} not found`, 404);
  }

  static conflict(message: string) {
    return new AppError(ErrorCode.CONFLICT, message, 409);
  }

  static validationError(message: string, details?: Record<string, unknown>) {
    return new AppError(ErrorCode.VALIDATION_ERROR, message, 400, details);
  }

  static subscriptionRequired(message = 'Subscription required') {
    return new AppError(ErrorCode.SUBSCRIPTION_REQUIRED, message, 402);
  }

  static tierInsufficient(requiredTier: string) {
    return new AppError(
      ErrorCode.TIER_INSUFFICIENT,
      `This feature requires the ${requiredTier} plan or higher`,
      403,
    );
  }
}
