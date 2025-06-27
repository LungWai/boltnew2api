/**
 * Monitoring and metrics utilities
 */

import { logger } from './logger';

export interface Metric {
  name: string;
  value: number;
  timestamp: Date;
  tags?: Record<string, string>;
  type: 'counter' | 'gauge' | 'histogram' | 'timer';
}

export interface PerformanceMetrics {
  requestCount: number;
  averageResponseTime: number;
  errorRate: number;
  successRate: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
}

export class MetricsCollector {
  private static instance: MetricsCollector;
  private metrics: Map<string, Metric[]> = new Map();
  private responseTimes: number[] = [];
  private requestCounts: Map<string, number> = new Map();
  private errorCounts: Map<string, number> = new Map();

  private constructor() {
    // Clean up old metrics every hour
    setInterval(() => this.cleanupOldMetrics(), 60 * 60 * 1000);
  }

  static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    return MetricsCollector.instance;
  }

  private cleanupOldMetrics(): void {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    for (const [key, metrics] of this.metrics.entries()) {
      const filtered = metrics.filter(m => m.timestamp > oneHourAgo);
      if (filtered.length === 0) {
        this.metrics.delete(key);
      } else {
        this.metrics.set(key, filtered);
      }
    }

    // Keep only last 1000 response times
    if (this.responseTimes.length > 1000) {
      this.responseTimes = this.responseTimes.slice(-1000);
    }
  }

  recordMetric(metric: Metric): void {
    const key = `${metric.name}_${metric.type}`;
    const existing = this.metrics.get(key) || [];
    existing.push(metric);
    this.metrics.set(key, existing);

    // Log metric if debug enabled
    logger.debug('Metric recorded', {
      name: metric.name,
      value: metric.value,
      type: metric.type,
      tags: metric.tags
    });
  }

  incrementCounter(name: string, tags?: Record<string, string>): void {
    this.recordMetric({
      name,
      value: 1,
      timestamp: new Date(),
      tags,
      type: 'counter'
    });

    // Update internal counters
    const key = this.createKey(name, tags);
    this.requestCounts.set(key, (this.requestCounts.get(key) || 0) + 1);
  }

  recordGauge(name: string, value: number, tags?: Record<string, string>): void {
    this.recordMetric({
      name,
      value,
      timestamp: new Date(),
      tags,
      type: 'gauge'
    });
  }

  recordTimer(name: string, duration: number, tags?: Record<string, string>): void {
    this.recordMetric({
      name,
      value: duration,
      timestamp: new Date(),
      tags,
      type: 'timer'
    });

    // Track response times for performance metrics
    if (name.includes('response_time')) {
      this.responseTimes.push(duration);
    }
  }

  recordError(endpoint: string, errorType: string, statusCode?: number): void {
    const tags = {
      endpoint,
      error_type: errorType,
      status_code: statusCode?.toString() || 'unknown'
    };

    this.incrementCounter('api_errors', tags);
    
    const key = this.createKey('errors', tags);
    this.errorCounts.set(key, (this.errorCounts.get(key) || 0) + 1);
  }

  recordRequest(endpoint: string, method: string, statusCode: number, duration: number): void {
    const tags = {
      endpoint,
      method,
      status_code: statusCode.toString(),
      status_class: `${Math.floor(statusCode / 100)}xx`
    };

    this.incrementCounter('api_requests', tags);
    this.recordTimer('api_response_time', duration, tags);

    // Record success/error
    if (statusCode >= 200 && statusCode < 400) {
      this.incrementCounter('api_requests_success', tags);
    } else {
      this.incrementCounter('api_requests_error', tags);
    }
  }

  private createKey(name: string, tags?: Record<string, string>): string {
    if (!tags) return name;
    const tagString = Object.entries(tags)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join(',');
    return `${name}[${tagString}]`;
  }

  getPerformanceMetrics(): PerformanceMetrics {
    const totalRequests = Array.from(this.requestCounts.values()).reduce((a, b) => a + b, 0);
    const totalErrors = Array.from(this.errorCounts.values()).reduce((a, b) => a + b, 0);
    
    const sortedResponseTimes = [...this.responseTimes].sort((a, b) => a - b);
    const averageResponseTime = sortedResponseTimes.length > 0 
      ? sortedResponseTimes.reduce((a, b) => a + b, 0) / sortedResponseTimes.length 
      : 0;

    const p95Index = Math.floor(sortedResponseTimes.length * 0.95);
    const p99Index = Math.floor(sortedResponseTimes.length * 0.99);

    return {
      requestCount: totalRequests,
      averageResponseTime,
      errorRate: totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0,
      successRate: totalRequests > 0 ? ((totalRequests - totalErrors) / totalRequests) * 100 : 100,
      p95ResponseTime: sortedResponseTimes[p95Index] || 0,
      p99ResponseTime: sortedResponseTimes[p99Index] || 0
    };
  }

  getMetricsSummary(): Record<string, any> {
    const summary: Record<string, any> = {};
    
    for (const [key, metrics] of this.metrics.entries()) {
      const values = metrics.map(m => m.value);
      const sum = values.reduce((a, b) => a + b, 0);
      const avg = values.length > 0 ? sum / values.length : 0;
      const max = values.length > 0 ? Math.max(...values) : 0;
      const min = values.length > 0 ? Math.min(...values) : 0;

      summary[key] = {
        count: values.length,
        sum,
        average: avg,
        max,
        min,
        latest: values[values.length - 1] || 0
      };
    }

    return summary;
  }

  exportMetrics(): Metric[] {
    const allMetrics: Metric[] = [];
    for (const metrics of this.metrics.values()) {
      allMetrics.push(...metrics);
    }
    return allMetrics.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }
}

// Export singleton instance
export const metrics = MetricsCollector.getInstance();

// Convenience functions
export const recordApiRequest = (endpoint: string, method: string, statusCode: number, duration: number) =>
  metrics.recordRequest(endpoint, method, statusCode, duration);

export const recordApiError = (endpoint: string, errorType: string, statusCode?: number) =>
  metrics.recordError(endpoint, errorType, statusCode);

export const incrementCounter = (name: string, tags?: Record<string, string>) =>
  metrics.incrementCounter(name, tags);

export const recordGauge = (name: string, value: number, tags?: Record<string, string>) =>
  metrics.recordGauge(name, value, tags);

export const recordTimer = (name: string, duration: number, tags?: Record<string, string>) =>
  metrics.recordTimer(name, duration, tags);

// Performance monitoring decorator
export function monitorPerformance(target: any, propertyName: string, descriptor: PropertyDescriptor) {
  const method = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    const startTime = Date.now();
    const methodName = `${target.constructor.name}.${propertyName}`;
    
    try {
      const result = await method.apply(this, args);
      const duration = Date.now() - startTime;
      
      recordTimer('method_execution_time', duration, {
        method: methodName,
        status: 'success'
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      recordTimer('method_execution_time', duration, {
        method: methodName,
        status: 'error'
      });
      
      recordApiError(methodName, error instanceof Error ? error.name : 'unknown_error');
      throw error;
    }
  };

  return descriptor;
}
