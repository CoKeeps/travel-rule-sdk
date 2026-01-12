import { TravelSDKClient } from './client';
export function createTravelSDK(config) {
    return new TravelSDKClient(config);
}
export { SDKError, ValidationError } from './errors';
export { TravelSDKClient } from './client';
//# sourceMappingURL=index.js.map