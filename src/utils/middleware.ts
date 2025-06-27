/**
 * Middleware utilities for request validation, error handling, and logging
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import { v4 as uuidv4 } from 'uuid';
import { WrapperError, RequestLog, ResponseLog } from '../types/api';

/**
 * Validate incoming request
 */
export function validateRequest(req: VercelRequest): { valid: boolean; error?: string } {
  // Check content type for POST requests
  if (req.method === 'POST') {
    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.includes('application/json')) {
      return {
        valid: false,
        error: 'Content-Type must be application/json'
      };
    }
  }

  // Check for required headers
  const userAgent = req.headers['user-agent'];
  if (!userAgent) {
    return {
      valid: false,
      error: 'User-Agent header is required'
    };
  }

  // Validate request body size (max 1MB)
  const contentLength = req.headers['content-length'];
  if (contentLength && parseInt(contentLength) > 1024 * 1024) {
    return {
      valid: false,
      error: 'Request body too large (max 1MB)'
    };
  }

  return { valid: true };
}

/**
 * Handle errors and return appropriate response
 */
export function handleError(res: VercelResponse, error: any): VercelResponse {
  const requestId = uuidv4();
  
  let statusCode = 500;
  let errorCode = 'internal_error';
  let message = 'Internal server error';
  let details: any = undefined;

  if (error instanceof Error) {
    message = error.message;
    
    // Check for specific error types
    if (error.name === 'ApiError') {
      statusCode = (error as any).statusCode || 500;
      errorCode = 'api_error';
      details = (error as any).details;
    } else if (error.message.includes('timeout')) {
      statusCode = 408;
      errorCode = 'timeout_error';
    } else if (error.message.includes('authentication') || error.message.includes('unauthorized')) {
      statusCode = 401;
      errorCode = 'authentication_error';
    } else if (error.message.includes('validation') || error.message.includes('invalid')) {
      statusCode = 400;
      errorCode = 'validation_error';
    }
  }

  const errorResponse: WrapperError = {
    code: errorCode,
    message,
    details,
    requestId,
    timestamp: new Date()
  };

  // Log error (in production, this would go to a logging service)
  console.error('API Error:', {
    requestId,
    error: errorResponse,
    stack: error instanceof Error ? error.stack : undefined
  });

  return res.status(statusCode).json({
    success: false,
    error: errorResponse
  });
}

/**
 * Create standardized success response
 */
export function createSuccessResponse<T>(data: T, message?: string): any {
  return {
    success: true,
    data,
    message,
    timestamp: new Date()
  };
}

/**
 * Log request details
 */
export function logRequest(req: VercelRequest): RequestLog {
  const requestId = uuidv4();
  
  const log: RequestLog = {
    requestId,
    method: req.method || 'UNKNOWN',
    url: req.url || '',
    headers: sanitizeHeaders(req.headers),
    body: sanitizeBody(req.body),
    timestamp: new Date(),
    ip: getClientIP(req),
    userAgent: req.headers['user-agent'] || 'unknown'
  };

  // Log to console (in production, this would go to a logging service)
  console.log('Request:', {
    requestId: log.requestId,
    method: log.method,
    url: log.url,
    ip: log.ip,
    userAgent: log.userAgent
  });

  return log;
}

/**
 * Log response details
 */
export function logResponse(requestId: string, statusCode: number, headers: any, body?: any, startTime?: number): ResponseLog {
  const log: ResponseLog = {
    requestId,
    statusCode,
    headers: sanitizeHeaders(headers),
    body: sanitizeBody(body),
    timestamp: new Date(),
    processingTime: startTime ? Date.now() - startTime : 0
  };

  // Log to console (in production, this would go to a logging service)
  console.log('Response:', {
    requestId: log.requestId,
    statusCode: log.statusCode,
    processingTime: log.processingTime
  });

  return log;
}

/**
 * Sanitize headers for logging (remove sensitive data)
 */
function sanitizeHeaders(headers: any): Record<string, string> {
  const sanitized: Record<string, string> = {};
  const sensitiveHeaders = ['authorization', 'cookie', 'x-session-cookies', 'x-api-key'];
  
  for (const [key, value] of Object.entries(headers)) {
    if (sensitiveHeaders.includes(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = String(value);
    }
  }
  
  return sanitized;
}

/**
 * Sanitize request/response body for logging
 */
function sanitizeBody(body: any): any {
  if (!body) return undefined;
  
  if (typeof body === 'object') {
    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'sessionCookies', 'cookies'];
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }
  
  return body;
}

/**
 * Extract client IP address
 */
function getClientIP(req: VercelRequest): string {
  // Check various headers for the real IP
  const forwarded = req.headers['x-forwarded-for'];
  const realIP = req.headers['x-real-ip'];
  const cfConnectingIP = req.headers['cf-connecting-ip'];
  
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return String(forwarded).split(',')[0].trim();
  }
  
  if (realIP) {
    return String(realIP);
  }
  
  if (cfConnectingIP) {
    return String(cfConnectingIP);
  }
  
  // Fallback to connection remote address
  return req.connection?.remoteAddress || 'unknown';
}

/**
 * Rate limiting middleware (simple in-memory implementation)
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(
  identifier: string,
  limit: number = 100,
  windowMs: number = 60000 // 1 minute
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const key = identifier;
  
  // Clean up expired entries
  for (const [k, v] of rateLimitStore.entries()) {
    if (now > v.resetTime) {
      rateLimitStore.delete(k);
    }
  }
  
  const current = rateLimitStore.get(key);
  
  if (!current || now > current.resetTime) {
    // First request or window expired
    const resetTime = now + windowMs;
    rateLimitStore.set(key, { count: 1, resetTime });
    return { allowed: true, remaining: limit - 1, resetTime };
  }
  
  if (current.count >= limit) {
    // Rate limit exceeded
    return { allowed: false, remaining: 0, resetTime: current.resetTime };
  }
  
  // Increment count
  current.count++;
  rateLimitStore.set(key, current);
  
  return { allowed: true, remaining: limit - current.count, resetTime: current.resetTime };
}
