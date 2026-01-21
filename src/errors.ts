import { AxiosResponse } from 'axios';
import type { ErrorCode, ErrorCodeDefinition, ErrorCategory, ErrorResponse } from './error-codes';
import { getErrorCode, getCanonicalErrorCode, isRetryableError } from './error-codes';

type ErrorConstructorFn = new (...args: unknown[]) => Error;

function setupError(error: Error, errorName: string, constructor: ErrorConstructorFn): void {
  error.name = errorName;
  if (Error.captureStackTrace) {
    Error.captureStackTrace(error, constructor);
  }
}

export class SDKError extends Error {
  constructor(
    message: string,
    public readonly cause?: Error,
  ) {
    super(message);
    setupError(this, 'SDKError', SDKError as ErrorConstructorFn);
  }
}

export class ValidationError extends SDKError {
  constructor(
    message: string,
    public readonly field?: string,
  ) {
    super(message);
    setupError(this, 'ValidationError', ValidationError as ErrorConstructorFn);
  }
}

export class APIError extends SDKError {
  public readonly code: ErrorCode;
  public readonly httpStatus: number;
  public readonly category: ErrorCategory;
  public readonly retryable: boolean;
  public readonly canonicalCode: ErrorCode;
  public readonly errorDescription: string;
  public readonly validationErrors?: ErrorResponse['errors'];

  constructor(
    errorResponse: ErrorResponse,
    public readonly response?: AxiosResponse,
  ) {
    const code = errorResponse.error;
    const definition = getErrorCode(code);

    let message: string;
    let httpStatus: number;
    let category: ErrorCategory;
    let retryable: boolean;
    let canonicalCode: ErrorCode;
    let errorDescription: string;

    if (!definition) {
      message = errorResponse.error_description || `API error: ${code}`;
      httpStatus = 500;
      category = 'server_error';
      retryable = false;
      canonicalCode = code as ErrorCode;
      errorDescription = errorResponse.error_description || `Unknown error code: ${code}`;
    } else {
      message = errorResponse.error_description || definition.description;
      httpStatus = definition.httpStatus;
      category = definition.category;
      retryable = isRetryableError(code);
      canonicalCode = getCanonicalErrorCode(code);
      errorDescription = errorResponse.error_description || definition.description;
    }

    super(message);

    this.code = code;
    this.httpStatus = httpStatus;
    this.category = category;
    this.retryable = retryable;
    this.canonicalCode = canonicalCode;
    this.errorDescription = errorDescription;
    this.validationErrors = errorResponse.errors;

    setupError(this, 'APIError', APIError as ErrorConstructorFn);
  }

  getDefinition(): ErrorCodeDefinition | undefined {
    return getErrorCode(this.code);
  }

  isAuthenticationError(): boolean {
    return this.category === 'authentication';
  }

  isAuthorizationError(): boolean {
    return this.category === 'authorization';
  }

  isClientError(): boolean {
    return this.category === 'client_error';
  }

  isServerError(): boolean {
    return this.category === 'server_error';
  }

  isValidationError(): boolean {
    return this.code === 'validation_error';
  }

  getValidationErrors(): ErrorResponse['errors'] {
    return this.validationErrors;
  }
}
