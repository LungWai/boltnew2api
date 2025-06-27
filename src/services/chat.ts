/**
 * Chat service for intercepting and proxying bolt.new chat API
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  ChatRequest, 
  ChatResponse, 
  BoltSession,
  WrapperChatRequest,
  WrapperChatResponse,
  StreamChunk
} from '../types';
import { BoltAuth } from '../utils/auth';
import { HttpClient, ApiError } from '../utils/http';

export class ChatService {
  private static readonly CHAT_ENDPOINT = '/api/chat';
  private static readonly STREAM_ENDPOINT = '/api/chat/stream';

  /**
   * Send chat message to bolt.new API
   */
  static async sendMessage(request: WrapperChatRequest): Promise<WrapperChatResponse> {
    const requestId = uuidv4();
    const startTime = Date.now();

    try {
      // Parse and validate session cookies
      const session = BoltAuth.parseCookies(request.sessionCookies);
      
      // Validate session if not expired
      if (BoltAuth.isSessionExpired(session)) {
        throw new Error('Session has expired');
      }

      // Prepare chat request for bolt.new API
      const chatRequest: ChatRequest = {
        message: request.message,
        projectId: request.projectId,
        context: request.context,
        mode: request.mode || 'build',
        organizationId: BoltAuth.extractOrganizationId(session)
      };

      // Make request to bolt.new
      let response: ChatResponse;
      
      if (request.stream) {
        response = await this.sendStreamingMessage(session, chatRequest, request.timeout);
      } else {
        response = await HttpClient.makeRequest<ChatResponse>(this.CHAT_ENDPOINT, {
          method: 'POST',
          body: chatRequest,
          session,
          timeout: request.timeout
        });
      }

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        data: response,
        requestId,
        timestamp: new Date(),
        processingTime
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      let errorMessage = 'Unknown error occurred';
      if (error instanceof ApiError) {
        errorMessage = `API Error (${error.statusCode}): ${error.message}`;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage,
        requestId,
        timestamp: new Date(),
        processingTime
      };
    }
  }

  /**
   * Send streaming chat message
   */
  private static async sendStreamingMessage(
    session: BoltSession,
    chatRequest: ChatRequest,
    timeout?: number
  ): Promise<ChatResponse> {
    return new Promise((resolve, reject) => {
      let response: Partial<ChatResponse> = {
        response: '',
        files: [],
        actions: []
      };

      let chunks: string[] = [];

      HttpClient.makeStreamingRequest(this.STREAM_ENDPOINT, {
        method: 'POST',
        body: chatRequest,
        session,
        timeout,
        onChunk: (chunk: string) => {
          chunks.push(chunk);
          
          // Parse streaming chunks
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                this.processStreamChunk(data, response);
              } catch (error) {
                console.warn('Failed to parse stream chunk:', error);
              }
            }
          }
        }
      })
      .then(() => {
        resolve(response as ChatResponse);
      })
      .catch(reject);
    });
  }

  /**
   * Process individual stream chunk
   */
  private static processStreamChunk(chunk: StreamChunk, response: Partial<ChatResponse>): void {
    switch (chunk.type) {
      case 'text':
        response.response = (response.response || '') + chunk.content;
        break;
        
      case 'file':
        if (!response.files) response.files = [];
        try {
          const fileData = JSON.parse(chunk.content);
          response.files.push(fileData);
        } catch (error) {
          console.warn('Failed to parse file chunk:', error);
        }
        break;
        
      case 'action':
        if (!response.actions) response.actions = [];
        try {
          const actionData = JSON.parse(chunk.content);
          response.actions.push(actionData);
        } catch (error) {
          console.warn('Failed to parse action chunk:', error);
        }
        break;
        
      case 'error':
        throw new Error(`Stream error: ${chunk.content}`);
        
      case 'done':
        // Stream completed
        break;
        
      default:
        console.warn('Unknown chunk type:', chunk.type);
    }
  }

  /**
   * Get chat history for organization
   */
  static async getChatHistory(
    sessionCookies: string,
    organizationId?: string,
    limit: number = 50
  ): Promise<WrapperChatResponse> {
    const requestId = uuidv4();
    const startTime = Date.now();

    try {
      const session = BoltAuth.parseCookies(sessionCookies);
      const orgId = organizationId || BoltAuth.extractOrganizationId(session);

      if (!orgId) {
        throw new Error('Organization ID is required for chat history');
      }

      const response = await HttpClient.makeRequest(`/api/chats?organization=${orgId}&limit=${limit}`, {
        method: 'GET',
        session
      });

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        data: response,
        requestId,
        timestamp: new Date(),
        processingTime
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch chat history',
        requestId,
        timestamp: new Date(),
        processingTime
      };
    }
  }

  /**
   * Create new project template
   */
  static async createProject(
    sessionCookies: string,
    template?: string,
    name?: string
  ): Promise<WrapperChatResponse> {
    const requestId = uuidv4();
    const startTime = Date.now();

    try {
      const session = BoltAuth.parseCookies(sessionCookies);

      const templateRequest = {
        template: template || 'react-vite',
        name: name || `Project ${Date.now()}`
      };

      const response = await HttpClient.makeRequest('/api/template', {
        method: 'POST',
        body: templateRequest,
        session
      });

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        data: response,
        requestId,
        timestamp: new Date(),
        processingTime
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create project',
        requestId,
        timestamp: new Date(),
        processingTime
      };
    }
  }
}
