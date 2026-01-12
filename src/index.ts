import { TravelSDKClient } from './client';
import { SDKConfig } from './types';

export function createTravelSDK(config: SDKConfig): TravelSDKClient {
  return new TravelSDKClient(config);
}

export { SDKError, ValidationError } from './errors';
export { TravelSDKClient } from './client';
export type { SDKConfig, AccessTokenResponse, SendMessageResponse, GetMessageRawResponse } from './types';
export type { VaspKeys } from './utils/type';
export type { MessageFormData } from './utils/validate';