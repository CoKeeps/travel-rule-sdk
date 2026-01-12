import { SDKConfig, AccessTokenResponse, SendMessageResponse } from './types';
import { MessageFormData } from './utils/validate';
import type { VaspKeys } from './index';
export declare class TravelSDKClient {
    private client;
    private endpoint;
    private debug;
    private logger;
    private vaspKeys?;
    constructor(config: SDKConfig);
    private validateEndpoint;
    private validateNonEmptyString;
    private ensureVaspKeysSet;
    private handleError;
    private getTargetUrl;
    updateEndpoint(endpoint: string): string;
    setVaspKeys(vaspKeys: VaspKeys): void;
    getVaspKeys(): VaspKeys | undefined;
    validateVaspKeys(data: unknown): VaspKeys;
    getClientAssertion(client_id: string): Promise<string>;
    getDpopProof(purpose: 'token' | 'get-message' | 'send-message', accessToken?: string, messageID?: string, htm?: string): Promise<string>;
    getAccessToken(): Promise<AccessTokenResponse>;
    getMessage(accessToken: string, messageID: string): Promise<MessageFormData>;
    sendMessage(messageData: MessageFormData, accessToken: string): Promise<SendMessageResponse>;
    getEndpoint(): string;
    authenticate(vaspKeys: VaspKeys): Promise<AccessTokenResponse>;
    getMessageWithAuth(vaspKeys: VaspKeys, messageID: string): Promise<MessageFormData>;
    sendMessageWithAuth(vaspKeys: VaspKeys, messageData: MessageFormData): Promise<SendMessageResponse>;
}
//# sourceMappingURL=client.d.ts.map