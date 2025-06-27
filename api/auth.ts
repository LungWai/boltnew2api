/**
 * Authentication validation endpoint
 * Vercel serverless function
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import cors from 'cors';
import { BoltAuth } from '../src/utils/auth';
import { validateRequest, handleError, createSuccessResponse } from '../src/utils/middleware';

// Configure CORS
const corsHandler = cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-Cookies']
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  await new Promise((resolve, reject) => {
    corsHandler(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      message: 'Only POST requests are supported'
    });
  }

  try {
    // Validate request
    const validation = validateRequest(req);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: 'validation_error',
        message: validation.error
      });
    }

    // Extract session cookies
    const sessionCookies = req.headers['x-session-cookies'] as string || req.body.cookies;
    
    if (!sessionCookies) {
      return res.status(400).json({
        success: false,
        error: 'validation_error',
        message: 'Session cookies are required'
      });
    }

    // Parse and validate session
    const session = BoltAuth.parseCookies(sessionCookies);
    
    // Check if session is expired
    if (BoltAuth.isSessionExpired(session)) {
      return res.status(401).json({
        success: false,
        error: 'session_expired',
        message: 'Session has expired'
      });
    }

    // Validate session with bolt.new API
    const authResponse = await BoltAuth.validateSession(session);

    if (authResponse.success && authResponse.valid) {
      return res.status(200).json(createSuccessResponse({
        valid: true,
        organizationId: authResponse.organizationId,
        userId: authResponse.userId,
        tokenUsage: authResponse.tokenUsage,
        sessionInfo: {
          expiresAt: session.expiresAt,
          organizationId: session.organizationId,
          userId: session.userId
        }
      }));
    } else {
      return res.status(401).json({
        success: false,
        error: 'invalid_session',
        message: authResponse.error || 'Session is not valid'
      });
    }

  } catch (error) {
    console.error('Auth validation error:', error);
    
    if (error instanceof Error && error.message.includes('Missing required cookies')) {
      return res.status(400).json({
        success: false,
        error: 'invalid_cookies',
        message: error.message
      });
    }
    
    return handleError(res, error);
  }
}

// Export for testing
export { handler };
