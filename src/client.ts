import axios, { AxiosInstance, AxiosError } from 'axios';
import { SDKConfig, AccessTokenResponse, SendMessageResponse, GetMessageRawResponse } from './types';

import { validateVaspKeysWithError, validateMessageFormData, MessageFormData } from './utils/validate';
import { genClientAssertion, genDpopProof, generateBody } from './utils/generate';
import { SDKError, ValidationError, APIError } from './errors';
import { decryptJwePayload } from './utils/decrypt';
import type { VaspKeys } from './index';
import type { ErrorResponse } from './error-codes';

const API_PATHS = {
  TOKEN: '/api/oauth/token',
  MESSAGE: '/api/message',
  MESSAGES: (id: string) => `/api/messages/${id}`,
} as const;

export class TravelSDKClient {
  private client: AxiosInstance;
  private endpoint: string;
  private debug: boolean;
  private logger: (message: string, data?: any) => void;
  private vaspKeys?: VaspKeys;

  constructor(config: SDKConfig) {
    this.validateEndpoint(config.endpoint);
    
    this.endpoint = config.endpoint.endsWith('/') 
      ? config.endpoint.slice(0, -1) 
      : config.endpoint;

    this.debug = config.debug ?? false;
    this.logger = config.logger ?? ((message: string, data?: any) => {
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

    this.client.interceptors.request.use(
      (config) => {
        this.logger('Request', {
          method: config.method?.toUpperCase(),
          url: config.url,
          baseURL: config.baseURL,
        });
        return config;
      },
      (error) => {
        this.logger('Request error', error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        const apiError = this.parseApiError(error);
        this.logger('API error', {
          code: apiError instanceof APIError ? apiError.code : 'unknown',
          httpStatus: apiError instanceof APIError ? apiError.httpStatus : error.response?.status,
          message: apiError.message,
        });
        return Promise.reject(apiError);
      }
    );
  }

  private validateEndpoint(endpoint: string, fieldName: string = 'endpoint'): void {
    if (!endpoint) {
      throw new ValidationError(`${fieldName} is required`, fieldName);
    }

    if (typeof endpoint !== 'string' || !endpoint.trim()) {
      throw new ValidationError(`${fieldName} must be a non-empty string`, fieldName);
    }

    try {
      new URL(endpoint);
    } catch {
      throw new ValidationError(`${fieldName} must be a valid URL`, fieldName);
    }
  }

  private validateNonEmptyString(value: unknown, fieldName: string): void {
    if (!value || typeof value !== 'string' || !value.trim()) {
      throw new ValidationError(`${fieldName} must be a non-empty string`, fieldName);
    }
  }

  private ensureVaspKeysSet(): void {
    if (!this.vaspKeys) {
      throw new ValidationError('vaspKeys must be set using setVaspKeys() before calling this method', 'vaspKeys');
    }
  }


  private parseApiError(error: unknown): SDKError | APIError {
    if (error instanceof SDKError || error instanceof ValidationError || error instanceof APIError) {
      return error;
    }

    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ErrorResponse | any>;
      const response = axiosError.response;

      if (response?.data && typeof response.data === 'object' && 'error' in response.data) {
        const errorData = response.data as ErrorResponse;
        return new APIError(errorData, response);
      }

      if (!response) {
        return new SDKError(
          `Network error: ${axiosError.message}`,
          axiosError
        );
      }

      let errorMessage = axiosError.message;
      if (response.data) {
        if (typeof response.data === 'string') {
          errorMessage = response.data;
        } else if (typeof response.data === 'object' && response.data.message) {
          errorMessage = response.data.message;
        } else if (typeof response.data === 'object' && response.data.error_description) {
          errorMessage = response.data.error_description;
        }
      }

      const status = response.status;
      const statusText = response.statusText || 'Unknown error';
      
      const message = errorMessage !== axiosError.message 
        ? errorMessage 
        : `HTTP ${status} ${statusText}`;
      
      return new SDKError(
        message,
        axiosError
      );
    }

    return new SDKError(
      error instanceof Error ? error.message : 'Unknown error occurred',
      error instanceof Error ? error : undefined
    );
  }

  private handleError(error: unknown, defaultMessage: string): never {
    const parsedError = this.parseApiError(error);
    throw parsedError;
  }

  private getTargetUrl(purpose: 'token' | 'get-message' | 'send-message', messageID?: string): string {
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

  updateEndpoint(endpoint: string) {
    this.validateEndpoint(endpoint);
    
    this.endpoint = endpoint.endsWith('/') 
      ? endpoint.slice(0, -1) 
      : endpoint;

    this.client.defaults.baseURL = this.endpoint;

    this.logger('Endpoint updated', { endpoint: this.endpoint });

    return this.endpoint;
  }

  setVaspKeys(vaspKeys: VaspKeys): void {
    if (!vaspKeys) {
      throw new ValidationError('vaspKeys is required', 'vaspKeys');
    }

    const validation = validateVaspKeysWithError(vaspKeys);
    
    if (!validation.valid) {
      throw new ValidationError(
        validation.error || 'Invalid VASP keys structure',
        'vaspKeys'
      );
    }

    this.vaspKeys = vaspKeys;
    this.logger('VASP keys set', { vasp_id: vaspKeys.vasp_id });
  }

  getVaspKeys(): VaspKeys | undefined {
    return this.vaspKeys;
  }

  validateVaspKeys(data: unknown): VaspKeys {
    if (!data) {
      throw new ValidationError('VASP keys data is required', 'vaspKeys');
    }

    const validation = validateVaspKeysWithError(data);
    
    if (!validation.valid) {
      throw new ValidationError(
        validation.error || 'Invalid VASP keys structure',
        'vaspKeys'
      );
    }

    return data as unknown as VaspKeys;
  }

  async getClientAssertion(client_id: string): Promise<string> {
    this.ensureVaspKeysSet();
    this.validateNonEmptyString(client_id, 'client_id');

    try {
      const tokenEndpoint = `${this.endpoint}${API_PATHS.TOKEN}`;
      const clientAssertion = await genClientAssertion(this.vaspKeys!, client_id, tokenEndpoint);
      return clientAssertion;
    } catch (error: unknown) {
      this.handleError(error, 'Failed to generate client assertion');
    }
  }

  async getDpopProof(purpose: 'token' | 'get-message' | 'send-message', accessToken?: string, messageID?: string, htm?: string): Promise<string> {
    this.ensureVaspKeysSet();

    if (purpose === 'get-message') {
      this.validateNonEmptyString(messageID, 'messageID');
    }

    try {
      const targetUrl = this.getTargetUrl(purpose, messageID);
      const dpopProof = await genDpopProof(this.vaspKeys!, targetUrl, accessToken, htm);
      return dpopProof;
    } catch (error: unknown) {
      this.handleError(error, 'Failed to generate DPoP proof');
    }
  }

  async getAccessToken(): Promise<AccessTokenResponse> {
    this.ensureVaspKeysSet();

    try {
      const dpopProof = await this.getDpopProof('token');
      const clientAssertion = await this.getClientAssertion(this.vaspKeys!.vasp_id);

      const body = generateBody('token', this.vaspKeys!.vasp_id, clientAssertion, dpopProof);
      
      const response = await this.client.post(API_PATHS.TOKEN, body, {
        headers: {
          'DPoP': dpopProof,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (!response.data || typeof response.data !== 'object') {
        throw new SDKError('Invalid response structure from token endpoint');
      }

      return response.data as AccessTokenResponse;
    } catch (error: unknown) {
      this.handleError(error, 'Unknown error occurred');
    }
  }

  async getMessage(accessToken: string, messageID: string): Promise<MessageFormData> {
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

      const rawMessage = response.data as GetMessageRawResponse;
      const payloadJWE = rawMessage.payloadJwe;
      
      if (!payloadJWE) {
        throw new SDKError('Payload JWE not found in response');
      }

      const messageDecrypted = await decryptJwePayload(this.vaspKeys!, payloadJWE);
      
      return messageDecrypted as MessageFormData;
    } catch (error: unknown) {
      this.handleError(error, 'Unknown error occurred');
    }
  }

  async sendMessage(messageData: MessageFormData, accessToken: string): Promise<SendMessageResponse> {
    this.ensureVaspKeysSet();
    
    if (!messageData) {
      throw new ValidationError('messageData is required', 'messageData');
    }
    this.validateNonEmptyString(accessToken, 'accessToken');

    const validation = validateMessageFormData(messageData);
    
    if (!validation.valid) {
      throw new ValidationError(
        validation.error || 'Invalid message form data structure',
        'messageData'
      );
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
      
      return response.data as SendMessageResponse;
    } catch (error: unknown) {
      this.handleError(error, 'Unknown error occurred');
    }
  }

  getEndpoint(): string {
    return this.endpoint;
  }

  async authenticate(vaspKeys: VaspKeys): Promise<AccessTokenResponse> {
    this.setVaspKeys(vaspKeys);
    return this.getAccessToken();
  }

  async getMessageWithAuth(vaspKeys: VaspKeys, messageID: string): Promise<MessageFormData> {
    const token = await this.authenticate(vaspKeys);
    return this.getMessage(token.access_token, messageID);
  }

  async sendMessageWithAuth(vaspKeys: VaspKeys, messageData: MessageFormData): Promise<SendMessageResponse> {
    const token = await this.authenticate(vaspKeys);
    return this.sendMessage(messageData, token.access_token);
  }
}