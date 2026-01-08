import axios, { AxiosInstance } from 'axios';
import { SDKConfig } from './types';

import { validateVaspKeysWithError, validateMessageFormData, MessageFormData } from './utils/validate';
import { genClientAssertion, genDpopProof, generateBody } from './utils/generate';
import { SDKError, ValidationError } from './errors';
import { decryptJwePayload } from './utils/decrypt';
import type { VaspKeys } from './index';

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

  constructor(config: SDKConfig) {
    if (!config.endpoint) {
      throw new ValidationError('Endpoint is required', 'endpoint');
    }

    if (typeof config.endpoint !== 'string' || !config.endpoint.trim()) {
      throw new ValidationError('Endpoint must be a non-empty string', 'endpoint');
    }

    try {
      new URL(config.endpoint);
    } catch {
      throw new ValidationError('Endpoint must be a valid URL', 'endpoint');
    }

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
  }

  updateEndpoint(endpoint: string) {
    this.endpoint = endpoint.endsWith('/') 
      ? endpoint.slice(0, -1) 
      : endpoint;

    this.client.defaults.baseURL = this.endpoint;

    return this.endpoint;
  }

  validateVaspKeys<T = any>(data: T): VaspKeys {
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

  async getClientAssertion<T = string>(vaspKeys: VaspKeys, client_id: string): Promise<T> {
    if (!vaspKeys) {
      throw new ValidationError('vaspKeys is required', 'vaspKeys');
    }
    if (!client_id || typeof client_id !== 'string' || !client_id.trim()) {
      throw new ValidationError('client_id must be a non-empty string', 'client_id');
    }

    try {
      const tokenEndpoint = `${this.endpoint}${API_PATHS.TOKEN}`;
      const clientAssertion = await genClientAssertion(vaspKeys, client_id, tokenEndpoint);
      return clientAssertion as T;
    } catch (error: any) {
      if (error instanceof SDKError || error instanceof ValidationError) {
        throw error;
      }
      throw new SDKError(
        error.message || 'Failed to generate client assertion',
        error instanceof Error ? error : undefined
      );
    }
  }

  async getDpopProof<T = string>(vaspKeys: VaspKeys, purpose: 'token' | 'get-message' | 'send-message', accessToken?: string, messageID?: string, htm?: string): Promise<T> {
    if (!vaspKeys) {
      throw new ValidationError('vaspKeys is required', 'vaspKeys');
    }

    if (purpose === 'get-message' && (!messageID || typeof messageID !== 'string' || !messageID.trim())) {
      throw new ValidationError('messageID is required for get-message purpose', 'messageID');
    }

    try {
      let targetUrl = '';
      if (purpose === 'token') {
        targetUrl = `${this.endpoint}${API_PATHS.TOKEN}`;
      } else if (purpose === 'get-message') {
        targetUrl = `${this.endpoint}${API_PATHS.MESSAGES(messageID!)}`;
      } else if (purpose === 'send-message') {
        targetUrl = `${this.endpoint}${API_PATHS.MESSAGE}`;
      } else {
        throw new ValidationError(`Invalid purpose: ${purpose}. Must be 'token', 'get-message', or 'send-message'`, 'purpose');
      }

      const dpopProof = await genDpopProof(vaspKeys, targetUrl, accessToken, htm);
      return dpopProof as T;
    } catch (error: any) {
      if (error instanceof SDKError || error instanceof ValidationError) {
        throw error;
      }
      throw new SDKError(
        error.message || 'Failed to generate DPoP proof',
        error instanceof Error ? error : undefined
      );
    }
  }

  async getAccessToken<T = any>(vaspKeys: VaspKeys, dpopProof: string): Promise<T> {
    if (!vaspKeys) {
      throw new ValidationError('vaspKeys is required', 'vaspKeys');
    }
    if (!dpopProof || typeof dpopProof !== 'string' || !dpopProof.trim()) {
      throw new ValidationError('dpopProof must be a non-empty string', 'dpopProof');
    }

    try {
      const clientAssertion = await this.getClientAssertion(vaspKeys, vaspKeys.vasp_id);

      const body = generateBody('token', vaspKeys.vasp_id, clientAssertion, dpopProof);
      
      const response = await this.client.post(API_PATHS.TOKEN, body, {
        headers: {
          'DPoP': dpopProof,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (!response.data || typeof response.data !== 'object') {
        throw new SDKError('Invalid response structure from token endpoint');
      }

      const tokenData = response.data.rdata ?? response.data;
      return tokenData as T;
    } catch (error: any) {
      if (error instanceof SDKError || error instanceof ValidationError) {
        throw error;
      }
      throw new SDKError(
        error.message || 'Unknown error occurred',
        error instanceof Error ? error : undefined
      );
    }
  }

  async getMessage<T = any>(dpopProof: string, accessToken: string, messageID: string, vaspKeys: VaspKeys): Promise<T> {
    if (!dpopProof || typeof dpopProof !== 'string' || !dpopProof.trim()) {
      throw new ValidationError('dpopProof must be a non-empty string', 'dpopProof');
    }
    if (!accessToken || typeof accessToken !== 'string' || !accessToken.trim()) {
      throw new ValidationError('accessToken must be a non-empty string', 'accessToken');
    }
    if (!messageID || typeof messageID !== 'string' || !messageID.trim()) {
      throw new ValidationError('messageID must be a non-empty string', 'messageID');
    }
    if (!vaspKeys) {
      throw new ValidationError('vaspKeys is required', 'vaspKeys');
    }

    try {
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

      const payloadJWE = response.data.rdata?.payloadJwe ?? response.data.payloadJwe;
      
      if (!payloadJWE) {
        throw new SDKError('Payload JWE not found in response');
      }

      const messageDecrypted = await decryptJwePayload(vaspKeys, payloadJWE);
      
      return messageDecrypted as T;
    } catch (error: any) {
      if (error instanceof SDKError || error instanceof ValidationError) {
        throw error;
      }
      throw new SDKError(
        error.message || 'Unknown error occurred',
        error instanceof Error ? error : undefined
      );
    }
  }

  async sendMessage<T = any>(messageData: MessageFormData, dpopProof: string, accessToken: string): Promise<T> {
    if (!messageData) {
      throw new ValidationError('messageData is required', 'messageData');
    }
    if (!dpopProof || typeof dpopProof !== 'string' || !dpopProof.trim()) {
      throw new ValidationError('dpopProof must be a non-empty string', 'dpopProof');
    }
    if (!accessToken || typeof accessToken !== 'string' || !accessToken.trim()) {
      throw new ValidationError('accessToken must be a non-empty string', 'accessToken');
    }

    const validation = validateMessageFormData(messageData);
    
    if (!validation.valid) {
      throw new ValidationError(
        validation.error || 'Invalid message form data structure',
        'messageData'
      );
    }

    try {
      const body = JSON.stringify({ messageData });
      
      const response = await this.client.post(API_PATHS.MESSAGE, body, {
        headers: {
          'Authorization': `DPoP ${accessToken}`,
          'DPoP': dpopProof,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
      });
      
      return response.data as T;
    } catch (error: any) {
      if (error instanceof SDKError || error instanceof ValidationError) {
        throw error;
      }
      throw new SDKError(
        error.message || 'Unknown error occurred',
        error instanceof Error ? error : undefined
      );
    }
  }

  getEndpoint(): string {
    return this.endpoint;
  }
}