export interface ErrorCodeDefinition {
  httpStatus: number;
  description: string;
  category: ErrorCategory;
  mappedTo?: string;
}

export type ErrorCategory =
  | 'authentication'
  | 'authorization'
  | 'client_error'
  | 'oauth'
  | 'resource'
  | 'server_error';

export type ErrorCode =
  | 'bad_request'
  | 'client_error'
  | 'cnf_jkt_mismatch'
  | 'conflict'
  | 'dpop_ath_mismatch'
  | 'dpop_htm_mismatch'
  | 'dpop_htu_mismatch'
  | 'dpop_iat_out_of_range'
  | 'dpop_missing_jti'
  | 'dpop_missing_jwk'
  | 'dpop_missing_jwk_header'
  | 'dpop_replay'
  | 'duplicate_entry'
  | 'forbidden'
  | 'insufficient_scope'
  | 'internal_error'
  | 'invalid_client'
  | 'invalid_request'
  | 'invalid_scope'
  | 'invalid_token'
  | 'invalid_token_type'
  | 'method_not_allowed'
  | 'missing_dpop_proof'
  | 'missing_exp'
  | 'missing_jti'
  | 'missing_kid'
  | 'missing_sub'
  | 'missing_token'
  | 'not_found'
  | 'replayed_assertion'
  | 'service_unavailable'
  | 'unauthorized'
  | 'unsupported_grant_type'
  | 'unsupported_media_type'
  | 'unknown_kid'
  | 'validation_error';

export interface ErrorResponse {
  error: ErrorCode;
  error_description: string;
  errors?: Array<{
    field: string;
    message: string;
    code: string;
    expected?: string;
    received?: string;
  }>;
}

export const ERROR_CODES: Record<ErrorCode, ErrorCodeDefinition> = {
  bad_request: {
    httpStatus: 400,
    description: 'Generic bad request error',
    category: 'client_error',
  },
  client_error: {
    httpStatus: 400,
    description: 'Generic client error (fallback for 400-499 status codes)',
    category: 'client_error',
  },
  cnf_jkt_mismatch: {
    httpStatus: 401,
    description: 'Token binding validation failed',
    category: 'authentication',
    mappedTo: 'invalid_token',
  },
  conflict: {
    httpStatus: 409,
    description: 'A resource conflict occurred',
    category: 'resource',
  },
  dpop_ath_mismatch: {
    httpStatus: 401,
    description: 'DPoP proof access token hash mismatch',
    category: 'authentication',
    mappedTo: 'invalid_token',
  },
  dpop_htm_mismatch: {
    httpStatus: 400,
    description: 'DPoP HTTP method mismatch',
    category: 'authentication',
    mappedTo: 'invalid_request',
  },
  dpop_htu_mismatch: {
    httpStatus: 400,
    description: 'DPoP HTTP URI mismatch',
    category: 'authentication',
    mappedTo: 'invalid_request',
  },
  dpop_iat_out_of_range: {
    httpStatus: 400,
    description: 'DPoP proof issued time is out of range',
    category: 'authentication',
    mappedTo: 'invalid_request',
  },
  dpop_missing_jti: {
    httpStatus: 400,
    description: 'DPoP proof is missing JWT ID',
    category: 'authentication',
    mappedTo: 'invalid_request',
  },
  dpop_missing_jwk: {
    httpStatus: 400,
    description: 'DPoP proof is missing JWK',
    category: 'authentication',
    mappedTo: 'invalid_request',
  },
  dpop_missing_jwk_header: {
    httpStatus: 400,
    description: 'DPoP proof header is missing JWK',
    category: 'authentication',
    mappedTo: 'invalid_request',
  },
  dpop_replay: {
    httpStatus: 400,
    description: 'DPoP proof has been replayed',
    category: 'authentication',
    mappedTo: 'invalid_request',
  },
  duplicate_entry: {
    httpStatus: 409,
    description: 'A message with the specified messageId already exists',
    category: 'resource',
  },
  forbidden: {
    httpStatus: 403,
    description: 'Generic forbidden error',
    category: 'authorization',
  },
  insufficient_scope: {
    httpStatus: 403,
    description: 'The access token does not have the required scope',
    category: 'authorization',
  },
  internal_error: {
    httpStatus: 500,
    description: 'Internal server error or configuration issue',
    category: 'server_error',
  },
  invalid_client: {
    httpStatus: 400,
    description: 'Client authentication failed',
    category: 'authentication',
  },
  invalid_request: {
    httpStatus: 400,
    description: 'The request is malformed or missing required parameters',
    category: 'client_error',
  },
  invalid_scope: {
    httpStatus: 400,
    description: 'The requested scope is invalid or not granted',
    category: 'oauth',
  },
  invalid_token: {
    httpStatus: 401,
    description: 'The access token is invalid or missing',
    category: 'authentication',
  },
  invalid_token_type: {
    httpStatus: 401,
    description: 'Invalid token type. Expected DPoP',
    category: 'authentication',
    mappedTo: 'invalid_token',
  },
  method_not_allowed: {
    httpStatus: 405,
    description: 'HTTP method not allowed for this endpoint',
    category: 'client_error',
  },
  missing_dpop_proof: {
    httpStatus: 400,
    description: 'DPoP proof is required',
    category: 'authentication',
    mappedTo: 'invalid_request',
  },
  missing_exp: {
    httpStatus: 401,
    description: 'Token is missing expiration',
    category: 'authentication',
    mappedTo: 'invalid_token',
  },
  missing_jti: {
    httpStatus: 401,
    description: 'Token is missing JWT ID',
    category: 'authentication',
    mappedTo: 'invalid_token',
  },
  missing_kid: {
    httpStatus: 400,
    description: 'Missing key identifier (kid)',
    category: 'authentication',
    mappedTo: 'invalid_request',
  },
  missing_sub: {
    httpStatus: 401,
    description: 'Token is missing subject (vasp_id)',
    category: 'authentication',
    mappedTo: 'invalid_token',
  },
  missing_token: {
    httpStatus: 401,
    description: 'The access token is missing',
    category: 'authentication',
    mappedTo: 'invalid_token',
  },
  not_found: {
    httpStatus: 404,
    description: 'The requested resource was not found',
    category: 'resource',
  },
  replayed_assertion: {
    httpStatus: 401,
    description: 'Token has been replayed',
    category: 'authentication',
    mappedTo: 'invalid_token',
  },
  service_unavailable: {
    httpStatus: 503,
    description: 'A required service is unavailable',
    category: 'server_error',
  },
  unauthorized: {
    httpStatus: 401,
    description: 'Generic unauthorized error',
    category: 'authentication',
  },
  unsupported_grant_type: {
    httpStatus: 400,
    description: 'The authorization grant type is not supported',
    category: 'oauth',
  },
  unsupported_media_type: {
    httpStatus: 415,
    description: 'Content-Type must be application/json',
    category: 'client_error',
  },
  unknown_kid: {
    httpStatus: 400,
    description: 'Unknown key identifier',
    category: 'authentication',
    mappedTo: 'invalid_request',
  },
  validation_error: {
    httpStatus: 422,
    description: 'Request validation failed',
    category: 'client_error',
  },
};

export const ERROR_CATEGORIES: Record<
  ErrorCategory,
  {
    description: string;
    retryable: boolean;
    requiresAction: string;
  }
> = {
  authentication: {
    description: 'Errors related to authentication and token validation',
    retryable: false,
    requiresAction: 'refresh_token_or_authenticate',
  },
  authorization: {
    description: 'Errors related to authorization and permissions',
    retryable: false,
    requiresAction: 'check_permissions',
  },
  client_error: {
    description: 'Errors caused by invalid client requests',
    retryable: false,
    requiresAction: 'fix_request',
  },
  oauth: {
    description: 'OAuth 2.0 specific errors',
    retryable: false,
    requiresAction: 'fix_oauth_request',
  },
  resource: {
    description: 'Errors related to resource availability',
    retryable: false,
    requiresAction: 'check_resource',
  },
  server_error: {
    description: 'Errors caused by server issues',
    retryable: true,
    requiresAction: 'retry_or_contact_support',
  },
};

export function getErrorCode(errorCode: string): ErrorCodeDefinition | undefined {
  return ERROR_CODES[errorCode as ErrorCode];
}

export function getErrorCategory(category: ErrorCategory) {
  return ERROR_CATEGORIES[category];
}

export function isRetryableError(errorCode: string): boolean {
  const definition = getErrorCode(errorCode);
  if (!definition) return false;
  return ERROR_CATEGORIES[definition.category].retryable;
}

export function getCanonicalErrorCode(errorCode: string): ErrorCode {
  const definition = getErrorCode(errorCode);
  if (!definition) return errorCode as ErrorCode;
  return (definition.mappedTo as ErrorCode) || (errorCode as ErrorCode);
}

export function getErrorCodesByStatus(status: number): ErrorCode[] {
  return Object.entries(ERROR_CODES)
    .filter(([, def]) => def.httpStatus === status)
    .map(([code]) => code as ErrorCode);
}

export function getErrorCodesByCategory(category: ErrorCategory): ErrorCode[] {
  return Object.entries(ERROR_CODES)
    .filter(([, def]) => def.category === category)
    .map(([code]) => code as ErrorCode);
}
