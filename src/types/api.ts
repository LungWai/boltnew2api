/**
 * API wrapper specific types
 */

import { ChatRequest, ChatResponse, BoltProject, BoltSecrets } from './bolt';

// API Wrapper Request/Response Types
export interface WrapperChatRequest extends Omit<ChatRequest, 'organizationId'> {
  // Additional wrapper-specific fields
  sessionCookies: string;
  timeout?: number;
  stream?: boolean;
}

export interface WrapperChatResponse {
  success: boolean;
  data?: ChatResponse;
  error?: string;
  requestId: string;
  timestamp: Date;
  processingTime: number;
}

export interface WrapperAuthRequest {
  cookies: string;
  organizationId?: string;
}

export interface WrapperAuthResponse {
  success: boolean;
  valid: boolean;
  organizationId?: string;
  userId?: string;
  tokenUsage?: {
    used: number;
    remaining: number;
    limit: number;
  };
  error?: string;
}

// Health Check Types
export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: Date;
  version: string;
  uptime: number;
  services: {
    boltApi: 'up' | 'down';
    database?: 'up' | 'down';
  };
}

// Error Types
export interface WrapperError {
  code: string;
  message: string;
  details?: any;
  requestId?: string;
  timestamp: Date;
}

// Configuration Types
export interface ApiConfig {
  boltBaseUrl: string;
  timeout: number;
  retries: number;
  rateLimit: {
    requests: number;
    window: number; // in seconds
  };
  cors: {
    origins: string[];
    credentials: boolean;
  };
}

// Middleware Types
export interface RequestLog {
  requestId: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: any;
  timestamp: Date;
  ip: string;
  userAgent: string;
}

export interface ResponseLog {
  requestId: string;
  statusCode: number;
  headers: Record<string, string>;
  body?: any;
  timestamp: Date;
  processingTime: number;
}

// Rate Limiting Types
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: Date;
  retryAfter?: number;
}

export interface RateLimitExceeded {
  error: 'rate_limit_exceeded';
  message: string;
  retryAfter: number;
  limit: RateLimitInfo;
}
