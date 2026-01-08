function setupError(error: Error, errorName: string, constructor: Function): void {
  error.name = errorName;
  if (Error.captureStackTrace) {
    Error.captureStackTrace(error, constructor);
  }
}

export class SDKError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    setupError(this, 'SDKError', SDKError);
  }
}

export class ValidationError extends SDKError {
  constructor(message: string, public readonly field?: string) {
    super(message);
    setupError(this, 'ValidationError', ValidationError);
  }
}