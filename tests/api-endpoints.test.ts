/**
 * Integration tests for API endpoints
 */

import { createMocks } from 'node-mocks-http';
import chatHandler from '../api/chat';
import authHandler from '../api/auth';
import healthHandler from '../api/health';
import { mockFetch, sampleChatRequest, sampleChatResponse, sampleAuthResponse } from './setup';

describe('API Endpoints', () => {
  describe('/api/chat', () => {
    it('should handle valid chat request', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'user-agent': 'test-agent',
          'x-session-cookies': sampleChatRequest.sessionCookies
        },
        body: {
          message: sampleChatRequest.message,
          mode: sampleChatRequest.mode
        }
      });

      // Mock successful bolt.new response
      mockFetch(sampleChatResponse);

      await chatHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const responseData = JSON.parse(res._getData());
      expect(responseData.success).toBe(true);
      expect(responseData.data.data.response).toBe(sampleChatResponse.response);
    });

    it('should reject requests without session cookies', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'user-agent': 'test-agent'
        },
        body: {
          message: 'Hello'
        }
      });

      await chatHandler(req, res);

      expect(res._getStatusCode()).toBe(401);
      const responseData = JSON.parse(res._getData());
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('authentication_required');
    });

    it('should reject requests without message', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'user-agent': 'test-agent',
          'x-session-cookies': sampleChatRequest.sessionCookies
        },
        body: {}
      });

      await chatHandler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const responseData = JSON.parse(res._getData());
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('validation_error');
    });

    it('should handle OPTIONS requests', async () => {
      const { req, res } = createMocks({
        method: 'OPTIONS'
      });

      await chatHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });

    it('should reject non-POST requests', async () => {
      const { req, res } = createMocks({
        method: 'GET'
      });

      await chatHandler(req, res);

      expect(res._getStatusCode()).toBe(405);
      const responseData = JSON.parse(res._getData());
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Method not allowed');
    });

    it('should handle session cookies in request body', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'user-agent': 'test-agent'
        },
        body: {
          message: 'Hello',
          sessionCookies: sampleChatRequest.sessionCookies
        }
      });

      mockFetch(sampleChatResponse);

      await chatHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });
  });

  describe('/api/auth', () => {
    it('should validate valid session cookies', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'user-agent': 'test-agent'
        },
        body: {
          cookies: sampleChatRequest.sessionCookies
        }
      });

      // Mock successful validation responses
      mockFetch({ token: 'valid' }); // token endpoint
      mockFetch({ chats: [] }); // organization endpoint
      mockFetch({ used: 1000000, remaining: 9000000, limit: 10000000 }); // token stats

      await authHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const responseData = JSON.parse(res._getData());
      expect(responseData.success).toBe(true);
      expect(responseData.data.valid).toBe(true);
    });

    it('should reject invalid session cookies', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'user-agent': 'test-agent'
        },
        body: {
          cookies: 'invalid_cookies'
        }
      });

      await authHandler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const responseData = JSON.parse(res._getData());
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('invalid_cookies');
    });

    it('should handle authentication failure', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'user-agent': 'test-agent'
        },
        body: {
          cookies: sampleChatRequest.sessionCookies
        }
      });

      // Mock failed authentication
      mockFetch({}, 401, false);

      await authHandler(req, res);

      expect(res._getStatusCode()).toBe(401);
      const responseData = JSON.parse(res._getData());
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('invalid_session');
    });

    it('should reject requests without cookies', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'user-agent': 'test-agent'
        },
        body: {}
      });

      await authHandler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const responseData = JSON.parse(res._getData());
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('validation_error');
    });
  });

  describe('/api/health', () => {
    it('should return healthy status', async () => {
      const { req, res } = createMocks({
        method: 'GET'
      });

      // Mock successful health check
      mockFetch({}, 200, true);

      await healthHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const responseData = JSON.parse(res._getData());
      expect(responseData.success).toBe(true);
      expect(responseData.data.status).toBe('healthy');
      expect(responseData.data.services.boltApi).toBe('up');
    });

    it('should return unhealthy status when bolt.new is down', async () => {
      const { req, res } = createMocks({
        method: 'GET'
      });

      // Mock failed health check
      mockFetch({}, 500, false);

      await healthHandler(req, res);

      expect(res._getStatusCode()).toBe(503);
      const responseData = JSON.parse(res._getData());
      expect(responseData.success).toBe(false);
      expect(responseData.data.status).toBe('unhealthy');
      expect(responseData.data.services.boltApi).toBe('down');
    });

    it('should reject non-GET requests', async () => {
      const { req, res } = createMocks({
        method: 'POST'
      });

      await healthHandler(req, res);

      expect(res._getStatusCode()).toBe(405);
      const responseData = JSON.parse(res._getData());
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Method not allowed');
    });

    it('should include performance metrics', async () => {
      const { req, res } = createMocks({
        method: 'GET'
      });

      mockFetch({}, 200, true);

      await healthHandler(req, res);

      const responseData = JSON.parse(res._getData());
      expect(responseData.data.responseTime).toBeDefined();
      expect(responseData.data.boltApiResponseTime).toBeDefined();
      expect(responseData.data.timestamp).toBeDefined();
      expect(responseData.data.version).toBeDefined();
    });
  });
});
