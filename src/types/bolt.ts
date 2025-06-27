/**
 * TypeScript interfaces for bolt.new API structures
 * Based on network analysis from bolt-new-network-analysis.md
 */

// Chat API Types
export interface ChatRequest {
  message: string;
  projectId?: string;
  context?: string;
  mode?: 'build' | 'discuss';
  organizationId?: string;
}

export interface ChatResponse {
  response: string;
  projectId?: string;
  files?: BoltFile[];
  actions?: BoltAction[];
  tokenUsage?: TokenUsage;
}

export interface BoltFile {
  path: string;
  content: string;
  type: 'file' | 'directory';
  language?: string;
}

export interface BoltAction {
  type: 'create' | 'update' | 'delete' | 'run';
  target: string;
  content?: string;
  command?: string;
}

export interface TokenUsage {
  used: number;
  remaining: number;
  total: number;
}

// Authentication Types
export interface BoltSession {
  cookies: Record<string, string>;
  organizationId?: string;
  userId?: string;
  expiresAt?: Date;
  accountType?: 'individual' | 'team';
  sessionToken?: string;
  rememberToken?: string;
  oauthProvider?: string;
}

export interface AuthHeaders {
  'Cookie': string;
  'Content-Type': string;
  'User-Agent': string;
  'Referer': string;
  'Origin': string;
  'Accept'?: string;
  'Accept-Language'?: string;
  'Accept-Encoding'?: string;
  'Sec-Ch-Ua'?: string;
  'Sec-Ch-Ua-Mobile'?: string;
  'Sec-Ch-Ua-Platform'?: string;
  'Sec-Fetch-Dest'?: string;
  'Sec-Fetch-Mode'?: string;
  'Sec-Fetch-Site'?: string;
  'Priority'?: string;
  'X-Requested-With'?: string;
  'X-Bolt-Client-Revision'?: string;
  'X-Bolt-Project-Id'?: string;
  [key: string]: string | undefined;
}

// Project Types
export interface BoltProject {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  organizationId?: string;
  url?: string;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  framework: string;
  files: BoltFile[];
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface BoltApiError {
  error: string;
  message: string;
  statusCode: number;
  details?: any;
}

// Organization Types
export interface Organization {
  id: string;
  name: string;
  plan: 'free' | 'pro' | 'team';
  tokenLimit: number;
  tokenUsed: number;
}

// Secrets/API Keys Types
export interface BoltSecrets {
  anthropic?: string;
  openai?: string;
  google?: string;
  stripe?: string;
  supabase?: {
    url: string;
    anonKey: string;
  };
}

// Analytics Types
export interface AnalyticsEvent {
  event: string;
  properties: Record<string, any>;
  timestamp: Date;
  userId?: string;
  organizationId?: string;
}

// Streaming Response Types
export interface StreamChunk {
  type: 'text' | 'file' | 'action' | 'error' | 'done';
  content: string;
  metadata?: Record<string, any>;
}

// Request Context Types
export interface RequestContext {
  session: BoltSession;
  organizationId?: string;
  projectId?: string;
  userAgent: string;
  ip: string;
}
