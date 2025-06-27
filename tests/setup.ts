/**
 * Test setup and configuration
 */

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.BOLT_BASE_URL = 'https://bolt.new';
process.env.ALLOWED_ORIGINS = 'http://localhost:3000';
process.env.LOG_LEVEL = 'error'; // Reduce noise in tests

// Mock fetch globally
global.fetch = jest.fn();

// Mock console methods to reduce noise
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

// Test utilities
export const mockFetch = (response: any, status: number = 200, ok: boolean = true) => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok,
    status,
    statusText: ok ? 'OK' : 'Error',
    json: () => Promise.resolve(response),
    text: () => Promise.resolve(typeof response === 'string' ? response : JSON.stringify(response)),
    headers: new Map([['content-type', 'application/json']])
  });
};

export const mockFetchError = (error: Error) => {
  (global.fetch as jest.Mock).mockRejectedValueOnce(error);
};

// Sample test data
export const sampleCookies = '_stackblitz_session=abc123; sb_session=def456; sb_user_id=user123; sb_org_id=22851';

export const sampleChatRequest = {
  message: 'Create a React todo app',
  mode: 'build' as const,
  sessionCookies: sampleCookies
};

export const sampleChatResponse = {
  response: 'I\'ll help you create a React todo app...',
  projectId: 'sb1-abc123',
  files: [
    {
      path: 'src/App.tsx',
      content: 'import React from "react";\n\nexport default function App() {\n  return <div>Todo App</div>;\n}',
      type: 'file' as const,
      language: 'typescript'
    }
  ],
  actions: [
    {
      type: 'create' as const,
      target: 'src/App.tsx',
      content: 'React component content'
    }
  ]
};

export const sampleAuthResponse = {
  valid: true,
  organizationId: '22851',
  userId: 'user123',
  tokenUsage: {
    used: 1000000,
    remaining: 9000000,
    limit: 10000000
  }
};
