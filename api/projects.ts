/**
 * Projects management endpoint
 * Vercel serverless function
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import cors from 'cors';
import { ChatService } from '../src/services/chat';
import { validateRequest, handleError, createSuccessResponse } from '../src/utils/middleware';

// Configure CORS
const corsHandler = cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
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
    const sessionCookies = req.headers['x-session-cookies'] as string || req.body?.sessionCookies;
    
    if (!sessionCookies) {
      return res.status(401).json({
        success: false,
        error: 'authentication_required',
        message: 'Session cookies are required'
      });
    }

    if (req.method === 'GET') {
      // Get chat history
      const organizationId = req.query.organizationId as string;
      const limit = parseInt(req.query.limit as string) || 50;

      const response = await ChatService.getChatHistory(sessionCookies, organizationId, limit);
      
      if (response.success) {
        return res.status(200).json(createSuccessResponse(response.data));
      } else {
        return res.status(500).json({
          success: false,
          error: 'fetch_error',
          message: response.error
        });
      }

    } else if (req.method === 'POST') {
      // Create new project
      const { template, name } = req.body;

      const response = await ChatService.createProject(sessionCookies, template, name);
      
      if (response.success) {
        return res.status(201).json(createSuccessResponse(response.data));
      } else {
        return res.status(500).json({
          success: false,
          error: 'creation_error',
          message: response.error
        });
      }

    } else {
      return res.status(405).json({
        success: false,
        error: 'method_not_allowed',
        message: 'Only GET and POST methods are supported'
      });
    }

  } catch (error) {
    console.error('Projects API error:', error);
    return handleError(res, error);
  }
}

// Export for testing
export { handler };
