/**
 * Health check endpoint
 * Vercel serverless function
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import { HttpClient } from '../src/utils/http';
import { HealthCheckResponse } from '../src/types/api';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      message: 'Only GET requests are supported'
    });
  }

  const startTime = Date.now();

  try {
    // Check bolt.new API health
    const boltHealth = await HttpClient.healthCheck();
    
    const uptime = process.uptime ? process.uptime() : 0;
    const response: HealthCheckResponse = {
      status: boltHealth.status === 'up' ? 'healthy' : 'unhealthy',
      timestamp: new Date(),
      version: process.env.npm_package_version || '1.0.0',
      uptime,
      services: {
        boltApi: boltHealth.status
      }
    };

    // Add response time
    const responseTime = Date.now() - startTime;
    (response as any).responseTime = responseTime;
    (response as any).boltApiResponseTime = boltHealth.responseTime;

    const statusCode = response.status === 'healthy' ? 200 : 503;
    return res.status(statusCode).json({
      success: response.status === 'healthy',
      data: response
    });

  } catch (error) {
    console.error('Health check error:', error);
    
    const response: HealthCheckResponse = {
      status: 'unhealthy',
      timestamp: new Date(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime ? process.uptime() : 0,
      services: {
        boltApi: 'down'
      }
    };

    return res.status(503).json({
      success: false,
      data: response,
      error: error instanceof Error ? error.message : 'Health check failed'
    });
  }
}

// Export for testing
export { handler };
