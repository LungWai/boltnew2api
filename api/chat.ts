/**
 * Serverless endpoint for bolt.new chat API interception
 * Vercel serverless function
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import cors from 'cors';
import { ChatService } from '../src/services/chat';
import { WrapperChatRequest } from '../src/types/api';
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

    // Extract session cookies from headers or body
    const sessionCookies = req.headers['x-session-cookies'] as string || req.body.sessionCookies;
    
    if (!sessionCookies) {
      return res.status(401).json({
        success: false,
        error: 'authentication_required',
        message: 'Session cookies are required. Provide them in X-Session-Cookies header or request body.'
      });
    }

    // Prepare chat request
    const chatRequest: WrapperChatRequest = {
      message: req.body.message,
      projectId: req.body.projectId,
      context: req.body.context,
      mode: req.body.mode || 'build',
      sessionCookies,
      timeout: req.body.timeout || 30000,
      stream: req.body.stream || false
    };

    // Validate required fields
    if (!chatRequest.message || typeof chatRequest.message !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'validation_error',
        message: 'Message is required and must be a string'
      });
    }

    // Send chat message
    const response = await ChatService.sendMessage(chatRequest);

    // Return response
    if (response.success) {
      return res.status(200).json(createSuccessResponse(response));
    } else {
      return res.status(500).json({
        success: false,
        error: 'chat_error',
        message: response.error,
        requestId: response.requestId
      });
    }

  } catch (error) {
    console.error('Chat API error:', error);
    return handleError(res, error);
  }
}

// Export for testing
export { handler };
