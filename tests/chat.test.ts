/**
 * Tests for chat service
 */

import { ChatService } from '../src/services/chat';
import { mockFetch, mockFetchError, sampleChatRequest, sampleChatResponse } from './setup';

describe('ChatService', () => {
  describe('sendMessage', () => {
    it('should send chat message successfully', async () => {
      // Mock successful response
      mockFetch(sampleChatResponse);
      
      const result = await ChatService.sendMessage(sampleChatRequest);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(sampleChatResponse);
      expect(result.requestId).toBeDefined();
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.processingTime).toBeGreaterThan(0);
    });

    it('should handle API errors', async () => {
      // Mock API error
      mockFetch({ error: 'API Error', message: 'Something went wrong' }, 500, false);
      
      const result = await ChatService.sendMessage(sampleChatRequest);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('API Error (500)');
      expect(result.requestId).toBeDefined();
    });

    it('should handle network errors', async () => {
      // Mock network error
      mockFetchError(new Error('Network timeout'));
      
      const result = await ChatService.sendMessage(sampleChatRequest);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Network timeout');
    });

    it('should handle invalid cookies', async () => {
      const invalidRequest = {
        ...sampleChatRequest,
        sessionCookies: 'invalid_cookies'
      };
      
      const result = await ChatService.sendMessage(invalidRequest);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required cookies');
    });

    it('should handle expired session', async () => {
      const expiredRequest = {
        ...sampleChatRequest,
        sessionCookies: '_stackblitz_session=expired; sb_session=expired; sb_user_id=user123'
      };
      
      // Mock the session parsing to simulate expired session
      jest.spyOn(require('../src/utils/auth').BoltAuth, 'isSessionExpired').mockReturnValue(true);
      
      const result = await ChatService.sendMessage(expiredRequest);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Session has expired');
      
      // Restore mock
      jest.restoreAllMocks();
    });

    it('should include organization ID in request', async () => {
      mockFetch(sampleChatResponse);
      
      await ChatService.sendMessage(sampleChatRequest);
      
      // Verify fetch was called with correct parameters
      expect(global.fetch).toHaveBeenCalledWith(
        'https://bolt.new/api/chat',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"organizationId":"22851"')
        })
      );
    });

    it('should handle streaming requests', async () => {
      const streamingRequest = {
        ...sampleChatRequest,
        stream: true
      };
      
      // Mock streaming response
      const mockResponse = {
        ok: true,
        status: 200,
        body: {
          getReader: () => ({
            read: jest.fn()
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode('data: {"type":"text","content":"Hello"}\n')
              })
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode('data: {"type":"done","content":""}\n')
              })
              .mockResolvedValueOnce({
                done: true,
                value: undefined
              }),
            releaseLock: jest.fn()
          })
        }
      };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);
      
      const result = await ChatService.sendMessage(streamingRequest);
      
      expect(result.success).toBe(true);
      expect(result.data?.response).toBe('Hello');
    });
  });

  describe('getChatHistory', () => {
    it('should fetch chat history successfully', async () => {
      const mockHistory = {
        chats: [
          { id: '1', message: 'Hello', timestamp: new Date() },
          { id: '2', message: 'Hi there', timestamp: new Date() }
        ]
      };
      
      mockFetch(mockHistory);
      
      const result = await ChatService.getChatHistory(sampleChatRequest.sessionCookies, '22851');
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockHistory);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://bolt.new/api/chats?organization=22851&limit=50',
        expect.objectContaining({
          method: 'GET'
        })
      );
    });

    it('should handle missing organization ID', async () => {
      const cookiesWithoutOrg = '_stackblitz_session=abc123; sb_session=def456; sb_user_id=user123';
      
      const result = await ChatService.getChatHistory(cookiesWithoutOrg);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Organization ID is required for chat history');
    });

    it('should use custom limit', async () => {
      mockFetch({ chats: [] });
      
      await ChatService.getChatHistory(sampleChatRequest.sessionCookies, '22851', 100);
      
      expect(global.fetch).toHaveBeenCalledWith(
        'https://bolt.new/api/chats?organization=22851&limit=100',
        expect.any(Object)
      );
    });
  });

  describe('createProject', () => {
    it('should create project successfully', async () => {
      const mockProject = {
        id: 'sb1-new123',
        name: 'New Project',
        template: 'react-vite'
      };
      
      mockFetch(mockProject);
      
      const result = await ChatService.createProject(
        sampleChatRequest.sessionCookies,
        'react-vite',
        'New Project'
      );
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockProject);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://bolt.new/api/template',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"template":"react-vite"')
        })
      );
    });

    it('should use default template and name', async () => {
      mockFetch({ id: 'sb1-default' });
      
      await ChatService.createProject(sampleChatRequest.sessionCookies);
      
      expect(global.fetch).toHaveBeenCalledWith(
        'https://bolt.new/api/template',
        expect.objectContaining({
          body: expect.stringContaining('"template":"react-vite"')
        })
      );
    });

    it('should handle project creation errors', async () => {
      mockFetch({ error: 'Template not found' }, 404, false);
      
      const result = await ChatService.createProject(sampleChatRequest.sessionCookies, 'invalid-template');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('API Error (404)');
    });
  });
});
