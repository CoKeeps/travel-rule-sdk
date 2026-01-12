function setupError(error, errorName, constructor) {
    error.name = errorName;
    if (Error.captureStackTrace) {
        Error.captureStackTrace(error, constructor);
    }
}
export class SDKError extends Error {
    constructor(message, cause) {
        super(message);
        this.cause = cause;
        setupError(this, 'SDKError', SDKError);
    }
}
export class ValidationError extends SDKError {
    constructor(message, field) {
        super(message);
        this.field = field;
        setupError(this, 'ValidationError', ValidationError);
    }
}
//# sourceMappingURL=errors.js.map