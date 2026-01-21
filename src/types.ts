export interface SDKConfig {
  endpoint: string;
  timeout?: number;
  headers?: Record<string, string>;
  debug?: boolean;
  logger?: (message: string, data?: unknown) => void;
}

export interface AccessTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

export interface SendMessageResponse {
  messageId: string;
  createdAt: string;
}

export interface GetMessageRawResponse {
  messageId: string;
  payloadJwe: string;
}
