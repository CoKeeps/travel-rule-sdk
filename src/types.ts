export interface SDKConfig {
  endpoint: string;
  timeout?: number;
  headers?: Record<string, string>;
  debug?: boolean;
  logger?: (message: string, data?: any) => void;
}

export interface TravelData {
  [key: string]: any;
}

export interface SDKResponse<T = any> {
  data?: T;
  error?: string;
}