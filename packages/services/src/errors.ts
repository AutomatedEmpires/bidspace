// Service-layer error taxonomy. HTTP handlers (Phase 3 apps/web route handlers)
// map these to status codes; the service layer itself stays transport-agnostic.

export class ServiceError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "ServiceError";
  }
}

export class NotFoundError extends ServiceError {
  constructor(resource: string, id: string) {
    super(`${resource} not found: ${id}`);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends ServiceError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = "ValidationError";
  }
}

export class TransitionError extends ServiceError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = "TransitionError";
  }
}

// Wraps a Supabase PostgrestError-like object into a ServiceError.
export function fromDbError(context: string, error: { message: string } | null): ServiceError {
  return new ServiceError(`${context}: ${error?.message ?? "unknown database error"}`, error);
}
