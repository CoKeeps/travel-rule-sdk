export declare class SDKError extends Error {
    readonly cause?: Error | undefined;
    constructor(message: string, cause?: Error | undefined);
}
export declare class ValidationError extends SDKError {
    readonly field?: string | undefined;
    constructor(message: string, field?: string | undefined);
}
//# sourceMappingURL=errors.d.ts.map