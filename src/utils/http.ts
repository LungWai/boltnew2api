/**
 * HTTP utilities for making requests to bolt.new API
 */

import { BoltSession, AuthHeaders, BoltApiError } from '../types';
import { BoltAuth } from './auth';

export class HttpClient {
  private static readonly BOLT_BASE_URL = 'https://bolt.new';
  private static readonly DEFAULT_TIMEOUT = 30000; // 30 seconds
  private static readonly MAX_RETRIES = 3;

  /**
   * Make authenticated request to bolt.new API
   */
  static async makeRequest<T = any>(
    endpoint: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
      body?: any;
      headers?: Record<string, string>;
      session: BoltSession;
      timeout?: number;
      retries?: number;
    }
  ): Promise<T> {
    const {
      method = 'GET',
      body,
      headers = {},
      session,
      timeout = this.DEFAULT_TIMEOUT,
      retries = this.MAX_RETRIES
    } = options;

    const authHeaders = BoltAuth.createAuthHeaders(session, headers);
    const url = `${this.BOLT_BASE_URL}${endpoint}`;

    let lastError: Error;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const requestOptions: RequestInit = {
          method,
          headers: authHeaders,
          credentials: 'include',
          signal: controller.signal
        };

        if (body && (method === 'POST' || method === 'PUT')) {
          requestOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
        }

        const response = await fetch(url, requestOptions);
        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          let errorData: BoltApiError;

          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = {
              error: 'api_error',
              message: errorText || `HTTP ${response.status}: ${response.statusText}`,
              statusCode: response.status
            };
          }

          throw new ApiError(errorData.message, response.status, errorData);
        }

        // Handle different content types
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          return await response.json();
        } else if (contentType?.includes('text/')) {
          return await response.text() as T;
        } else {
          return await response.arrayBuffer() as T;
        }

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry on authentication errors or client errors (4xx)
        if (error instanceof ApiError && error.statusCode >= 400 && error.statusCode < 500) {
          throw error;
        }

        // Don't retry on the last attempt
        if (attempt === retries) {
          break;
        }

        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  /**
   * Make streaming request to bolt.new API
   */
  static async makeStreamingRequest(
    endpoint: string,
    options: {
      method?: 'POST';
      body?: any;
      headers?: Record<string, string>;
      session: BoltSession;
      onChunk?: (chunk: string) => void;
      timeout?: number;
    }
  ): Promise<void> {
    const {
      method = 'POST',
      body,
      headers = {},
      session,
      onChunk,
      timeout = 60000 // 60 seconds for streaming
    } = options;

    const authHeaders = BoltAuth.createAuthHeaders(session, {
      ...headers,
      'Accept': 'text/event-stream',
      'Cache-Control': 'no-cache'
    });

    const url = `${this.BOLT_BASE_URL}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: authHeaders,
        body: body ? JSON.stringify(body) : undefined,
        credentials: 'include',
        signal: controller.signal
      });

      if (!response.ok) {
        throw new ApiError(`HTTP ${response.status}: ${response.statusText}`, response.status);
      }

      if (!response.body) {
        throw new Error('No response body for streaming request');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          if (onChunk) {
            onChunk(chunk);
          }
        }
      } finally {
        reader.releaseLock();
      }

    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Health check for bolt.new API
   */
  static async healthCheck(): Promise<{ status: 'up' | 'down'; responseTime: number }> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${this.BOLT_BASE_URL}/api/health`, {
        method: 'GET',
        timeout: 5000
      });

      const responseTime = Date.now() - startTime;
      
      return {
        status: response.ok ? 'up' : 'down',
        responseTime
      };
    } catch (error) {
      return {
        status: 'down',
        responseTime: Date.now() - startTime
      };
    }
  }
}

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details
    };
  }
}
