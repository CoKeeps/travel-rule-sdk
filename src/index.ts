import { TravelSDKClient } from './client';
import { SDKConfig } from './types';

export function createTravelSDK(config: SDKConfig): TravelSDKClient {
  return new TravelSDKClient(config);
}

export { SDKError, ValidationError, APIError } from './errors';
export { TravelSDKClient } from './client';
export type {
  SDKConfig,
  AccessTokenResponse,
  SendMessageResponse,
  GetMessageRawResponse,
} from './types';
export type { VaspKeys } from './utils/type';
export type { MessageFormData } from './utils/validate';

export type { ErrorCode, ErrorCodeDefinition, ErrorCategory, ErrorResponse } from './error-codes';
export {
  ERROR_CODES,
  ERROR_CATEGORIES,
  getErrorCode,
  getErrorCategory,
  isRetryableError,
  getCanonicalErrorCode,
  getErrorCodesByStatus,
  getErrorCodesByCategory,
} from './error-codes';
