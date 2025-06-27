/**
 * Logging utilities for the API wrapper
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  requestId?: string;
  userId?: string;
  organizationId?: string;
  metadata?: Record<string, any>;
  error?: Error;
}

export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;
  private logFormat: 'json' | 'text';

  private constructor() {
    this.logLevel = this.parseLogLevel(process.env.LOG_LEVEL || 'info');
    this.logFormat = (process.env.LOG_FORMAT as 'json' | 'text') || 'json';
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private parseLogLevel(level: string): LogLevel {
    switch (level.toLowerCase()) {
      case 'error': return LogLevel.ERROR;
      case 'warn': return LogLevel.WARN;
      case 'info': return LogLevel.INFO;
      case 'debug': return LogLevel.DEBUG;
      default: return LogLevel.INFO;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.logLevel;
  }

  private formatLog(entry: LogEntry): string {
    if (this.logFormat === 'json') {
      return JSON.stringify({
        level: LogLevel[entry.level],
        message: entry.message,
        timestamp: entry.timestamp.toISOString(),
        requestId: entry.requestId,
        userId: entry.userId,
        organizationId: entry.organizationId,
        metadata: entry.metadata,
        error: entry.error ? {
          name: entry.error.name,
          message: entry.error.message,
          stack: entry.error.stack
        } : undefined
      });
    } else {
      const timestamp = entry.timestamp.toISOString();
      const level = LogLevel[entry.level].padEnd(5);
      const requestId = entry.requestId ? `[${entry.requestId}]` : '';
      return `${timestamp} ${level} ${requestId} ${entry.message}`;
    }
  }

  private log(level: LogLevel, message: string, metadata?: Record<string, any>, error?: Error): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      requestId: metadata?.requestId,
      userId: metadata?.userId,
      organizationId: metadata?.organizationId,
      metadata: metadata ? { ...metadata } : undefined,
      error
    };

    // Remove sensitive data from metadata
    if (entry.metadata) {
      entry.metadata = this.sanitizeMetadata(entry.metadata);
    }

    const logString = this.formatLog(entry);

    // Output to appropriate stream
    if (level === LogLevel.ERROR) {
      console.error(logString);
    } else {
      console.log(logString);
    }

    // In production, you might want to send logs to external services
    this.sendToExternalServices(entry);
  }

  private sanitizeMetadata(metadata: Record<string, any>): Record<string, any> {
    const sanitized = { ...metadata };
    const sensitiveKeys = [
      'password', 'token', 'secret', 'key', 'cookie', 'cookies',
      'sessionCookies', 'authorization', 'auth'
    ];

    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  private sendToExternalServices(entry: LogEntry): void {
    // Example: Send to external logging services
    // This would be implemented based on your logging infrastructure
    
    // Sentry for errors
    if (entry.level === LogLevel.ERROR && process.env.SENTRY_DSN) {
      // Sentry.captureException(entry.error || new Error(entry.message));
    }

    // DataDog for metrics
    if (process.env.DATADOG_API_KEY) {
      // Send metrics to DataDog
    }

    // Custom webhook
    if (process.env.LOG_WEBHOOK_URL) {
      // Send to custom webhook
    }
  }

  error(message: string, metadata?: Record<string, any>, error?: Error): void {
    this.log(LogLevel.ERROR, message, metadata, error);
  }

  warn(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, metadata);
  }

  info(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, metadata);
  }

  debug(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, metadata);
  }

  // Convenience methods for common scenarios
  requestStarted(requestId: string, method: string, url: string, ip: string): void {
    this.info('Request started', {
      requestId,
      method,
      url,
      ip,
      type: 'request_start'
    });
  }

  requestCompleted(requestId: string, statusCode: number, processingTime: number): void {
    this.info('Request completed', {
      requestId,
      statusCode,
      processingTime,
      type: 'request_complete'
    });
  }

  authenticationAttempt(requestId: string, success: boolean, userId?: string, organizationId?: string): void {
    this.info('Authentication attempt', {
      requestId,
      success,
      userId,
      organizationId,
      type: 'auth_attempt'
    });
  }

  chatMessageSent(requestId: string, messageLength: number, mode: string, projectId?: string): void {
    this.info('Chat message sent', {
      requestId,
      messageLength,
      mode,
      projectId,
      type: 'chat_message'
    });
  }

  apiError(requestId: string, endpoint: string, statusCode: number, error: Error): void {
    this.error('API error occurred', {
      requestId,
      endpoint,
      statusCode,
      type: 'api_error'
    }, error);
  }

  rateLimitExceeded(requestId: string, ip: string, limit: number): void {
    this.warn('Rate limit exceeded', {
      requestId,
      ip,
      limit,
      type: 'rate_limit'
    });
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Export convenience functions
export const logError = (message: string, metadata?: Record<string, any>, error?: Error) => 
  logger.error(message, metadata, error);

export const logWarn = (message: string, metadata?: Record<string, any>) => 
  logger.warn(message, metadata);

export const logInfo = (message: string, metadata?: Record<string, any>) => 
  logger.info(message, metadata);

export const logDebug = (message: string, metadata?: Record<string, any>) => 
  logger.debug(message, metadata);
