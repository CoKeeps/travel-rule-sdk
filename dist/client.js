import axios from 'axios';
import { validateVaspKeysWithError, validateMessageFormData } from './utils/validate';
import { genClientAssertion, genDpopProof, generateBody } from './utils/generate';
import { SDKError, ValidationError } from './errors';
import { decryptJwePayload } from './utils/decrypt';
const API_PATHS = {
    TOKEN: '/api/oauth/token',
    MESSAGE: '/api/message',
    MESSAGES: (id) => `/api/messages/${id}`,
};
export class TravelSDKClient {
    constructor(config) {
        this.validateEndpoint(config.endpoint);
        this.endpoint = config.endpoint.endsWith('/')
            ? config.endpoint.slice(0, -1)
            : config.endpoint;
        this.debug = config.debug ?? false;
        this.logger = config.logger ?? ((message, data) => {
            if (this.debug) {
                console.log(`[TravelSDK] ${message}`, data || '');
            }
        });
        this.logger('TravelSDKClient initialized', {
            endpoint: this.endpoint,
        });
        this.client = axios.create({
            baseURL: this.endpoint,
            timeout: config.timeout || 30000,
            headers: {
                'Content-Type': 'application/json',
                ...config.headers,
            },
        });
        this.client.interceptors.request.use((config) => {
            this.logger('Request', {
                method: config.method?.toUpperCase(),
                url: config.url,
                baseURL: config.baseURL,
            });
            return config;
        }, (error) => {
            this.logger('Request error', error);
            return Promise.reject(error);
        });
    }
    validateEndpoint(endpoint, fieldName = 'endpoint') {
        if (!endpoint) {
            throw new ValidationError(`${fieldName} is required`, fieldName);
        }
        if (typeof endpoint !== 'string' || !endpoint.trim()) {
            throw new ValidationError(`${fieldName} must be a non-empty string`, fieldName);
        }
        try {
            new URL(endpoint);
        }
        catch {
            throw new ValidationError(`${fieldName} must be a valid URL`, fieldName);
        }
    }
    validateNonEmptyString(value, fieldName) {
        if (!value || typeof value !== 'string' || !value.trim()) {
            throw new ValidationError(`${fieldName} must be a non-empty string`, fieldName);
        }
    }
    ensureVaspKeysSet() {
        if (!this.vaspKeys) {
            throw new ValidationError('vaspKeys must be set using setVaspKeys() before calling this method', 'vaspKeys');
        }
    }
    handleError(error, defaultMessage) {
        if (error instanceof SDKError || error instanceof ValidationError) {
            throw error;
        }
        throw new SDKError(error instanceof Error ? error.message : defaultMessage, error instanceof Error ? error : undefined);
    }
    getTargetUrl(purpose, messageID) {
        switch (purpose) {
            case 'token':
                return `${this.endpoint}${API_PATHS.TOKEN}`;
            case 'get-message':
                if (!messageID) {
                    throw new ValidationError('messageID is required for get-message purpose', 'messageID');
                }
                return `${this.endpoint}${API_PATHS.MESSAGES(messageID)}`;
            case 'send-message':
                return `${this.endpoint}${API_PATHS.MESSAGE}`;
            default:
                throw new ValidationError(`Invalid purpose: ${purpose}. Must be 'token', 'get-message', or 'send-message'`, 'purpose');
        }
    }
    updateEndpoint(endpoint) {
        this.validateEndpoint(endpoint);
        this.endpoint = endpoint.endsWith('/')
            ? endpoint.slice(0, -1)
            : endpoint;
        this.client.defaults.baseURL = this.endpoint;
        this.logger('Endpoint updated', { endpoint: this.endpoint });
        return this.endpoint;
    }
    setVaspKeys(vaspKeys) {
        if (!vaspKeys) {
            throw new ValidationError('vaspKeys is required', 'vaspKeys');
        }
        const validation = validateVaspKeysWithError(vaspKeys);
        if (!validation.valid) {
            throw new ValidationError(validation.error || 'Invalid VASP keys structure', 'vaspKeys');
        }
        this.vaspKeys = vaspKeys;
        this.logger('VASP keys set', { vasp_id: vaspKeys.vasp_id });
    }
    getVaspKeys() {
        return this.vaspKeys;
    }
    validateVaspKeys(data) {
        if (!data) {
            throw new ValidationError('VASP keys data is required', 'vaspKeys');
        }
        const validation = validateVaspKeysWithError(data);
        if (!validation.valid) {
            throw new ValidationError(validation.error || 'Invalid VASP keys structure', 'vaspKeys');
        }
        return data;
    }
    async getClientAssertion(client_id) {
        this.ensureVaspKeysSet();
        this.validateNonEmptyString(client_id, 'client_id');
        try {
            const tokenEndpoint = `${this.endpoint}${API_PATHS.TOKEN}`;
            const clientAssertion = await genClientAssertion(this.vaspKeys, client_id, tokenEndpoint);
            return clientAssertion;
        }
        catch (error) {
            this.handleError(error, 'Failed to generate client assertion');
        }
    }
    async getDpopProof(purpose, accessToken, messageID, htm) {
        this.ensureVaspKeysSet();
        if (purpose === 'get-message') {
            this.validateNonEmptyString(messageID, 'messageID');
        }
        try {
            const targetUrl = this.getTargetUrl(purpose, messageID);
            const dpopProof = await genDpopProof(this.vaspKeys, targetUrl, accessToken, htm);
            return dpopProof;
        }
        catch (error) {
            this.handleError(error, 'Failed to generate DPoP proof');
        }
    }
    async getAccessToken() {
        this.ensureVaspKeysSet();
        try {
            const dpopProof = await this.getDpopProof('token');
            const clientAssertion = await this.getClientAssertion(this.vaspKeys.vasp_id);
            const body = generateBody('token', this.vaspKeys.vasp_id, clientAssertion, dpopProof);
            const response = await this.client.post(API_PATHS.TOKEN, body, {
                headers: {
                    'DPoP': dpopProof,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });
            if (!response.data || typeof response.data !== 'object') {
                throw new SDKError('Invalid response structure from token endpoint');
            }
            return response.data;
        }
        catch (error) {
            this.handleError(error, 'Unknown error occurred');
        }
    }
    async getMessage(accessToken, messageID) {
        this.ensureVaspKeysSet();
        this.validateNonEmptyString(accessToken, 'accessToken');
        this.validateNonEmptyString(messageID, 'messageID');
        try {
            const dpopProof = await this.getDpopProof('get-message', accessToken, messageID);
            const url = API_PATHS.MESSAGES(messageID);
            const response = await this.client.get(url, {
                headers: {
                    'Authorization': `DPoP ${accessToken}`,
                    'DPoP': dpopProof,
                },
            });
            if (!response.data || typeof response.data !== 'object') {
                throw new SDKError('Invalid response structure from message endpoint');
            }
            const rawMessage = response.data;
            const payloadJWE = rawMessage.payloadJwe;
            if (!payloadJWE) {
                throw new SDKError('Payload JWE not found in response');
            }
            const messageDecrypted = await decryptJwePayload(this.vaspKeys, payloadJWE);
            return messageDecrypted;
        }
        catch (error) {
            this.handleError(error, 'Unknown error occurred');
        }
    }
    async sendMessage(messageData, accessToken) {
        this.ensureVaspKeysSet();
        if (!messageData) {
            throw new ValidationError('messageData is required', 'messageData');
        }
        this.validateNonEmptyString(accessToken, 'accessToken');
        const validation = validateMessageFormData(messageData);
        if (!validation.valid) {
            throw new ValidationError(validation.error || 'Invalid message form data structure', 'messageData');
        }
        try {
            const dpopProof = await this.getDpopProof('send-message', accessToken, messageData.messageId, 'POST');
            const body = JSON.stringify({ messageData });
            const response = await this.client.post(API_PATHS.MESSAGE, body, {
                headers: {
                    'Authorization': `DPoP ${accessToken}`,
                    'DPoP': dpopProof,
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
            });
            return response.data;
        }
        catch (error) {
            this.handleError(error, 'Unknown error occurred');
        }
    }
    getEndpoint() {
        return this.endpoint;
    }
    async authenticate(vaspKeys) {
        this.setVaspKeys(vaspKeys);
        return this.getAccessToken();
    }
    async getMessageWithAuth(vaspKeys, messageID) {
        const token = await this.authenticate(vaspKeys);
        return this.getMessage(token.access_token, messageID);
    }
    async sendMessageWithAuth(vaspKeys, messageData) {
        const token = await this.authenticate(vaspKeys);
        return this.sendMessage(messageData, token.access_token);
    }
}
//# sourceMappingURL=client.js.map