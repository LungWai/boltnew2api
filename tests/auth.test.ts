/**
 * Tests for authentication utilities
 */

import { BoltAuth } from '../src/utils/auth';
import { mockFetch, mockFetchError, sampleCookies, sampleAuthResponse } from './setup';

describe('BoltAuth', () => {
  describe('parseCookies', () => {
    it('should parse valid cookies successfully', () => {
      const session = BoltAuth.parseCookies(sampleCookies);
      
      expect(session.cookies).toEqual({
        '_stackblitz_session': 'abc123',
        'sb_session': 'def456',
        'sb_user_id': 'user123',
        'sb_org_id': '22851'
      });
      expect(session.userId).toBe('user123');
      expect(session.organizationId).toBe('22851');
    });

    it('should throw error for missing required cookies', () => {
      const invalidCookies = 'some_other_cookie=value';
      
      expect(() => BoltAuth.parseCookies(invalidCookies)).toThrow(
        'Missing required cookies: _stackblitz_session, sb_session, sb_user_id'
      );
    });

    it('should handle partial cookies', () => {
      const partialCookies = '_stackblitz_session=abc123; sb_session=def456';
      
      expect(() => BoltAuth.parseCookies(partialCookies)).toThrow(
        'Missing required cookies: sb_user_id'
      );
    });
  });

  describe('createAuthHeaders', () => {
    it('should create proper auth headers', () => {
      const session = BoltAuth.parseCookies(sampleCookies);
      const headers = BoltAuth.createAuthHeaders(session);
      
      expect(headers).toEqual({
        'Cookie': '_stackblitz_session=abc123; sb_session=def456; sb_user_id=user123; sb_org_id=22851',
        'Content-Type': 'application/json',
        'User-Agent': expect.stringContaining('Mozilla'),
        'Referer': 'https://bolt.new/',
        'Origin': 'https://bolt.new',
        'X-Requested-With': 'XMLHttpRequest'
      });
    });

    it('should merge additional headers', () => {
      const session = BoltAuth.parseCookies(sampleCookies);
      const additionalHeaders = { 'Custom-Header': 'custom-value' };
      const headers = BoltAuth.createAuthHeaders(session, additionalHeaders);
      
      expect(headers['Custom-Header']).toBe('custom-value');
      expect(headers['Cookie']).toBeDefined();
    });
  });

  describe('validateSession', () => {
    it('should validate session successfully', async () => {
      const session = BoltAuth.parseCookies(sampleCookies);
      
      // Mock successful token response
      mockFetch({ token: 'valid-token' });
      
      // Mock successful organization response
      mockFetch({ chats: [] });
      
      // Mock token stats response
      mockFetch({
        used: 1000000,
        remaining: 9000000,
        limit: 10000000
      });
      
      const result = await BoltAuth.validateSession(session);
      
      expect(result.success).toBe(true);
      expect(result.valid).toBe(true);
      expect(result.organizationId).toBe('22851');
      expect(result.userId).toBe('user123');
    });

    it('should handle authentication failure', async () => {
      const session = BoltAuth.parseCookies(sampleCookies);
      
      // Mock failed token response
      mockFetch({}, 401, false);
      
      const result = await BoltAuth.validateSession(session);
      
      expect(result.success).toBe(false);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Authentication failed: 401');
    });

    it('should handle network errors', async () => {
      const session = BoltAuth.parseCookies(sampleCookies);
      
      // Mock network error
      mockFetchError(new Error('Network error'));
      
      const result = await BoltAuth.validateSession(session);
      
      expect(result.success).toBe(false);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Session validation failed: Network error');
    });
  });

  describe('isSessionExpired', () => {
    it('should return false for non-expired session', () => {
      const futureDate = new Date(Date.now() + 60000); // 1 minute in future
      const session = {
        cookies: {},
        expiresAt: futureDate
      };
      
      expect(BoltAuth.isSessionExpired(session)).toBe(false);
    });

    it('should return true for expired session', () => {
      const pastDate = new Date(Date.now() - 60000); // 1 minute in past
      const session = {
        cookies: {},
        expiresAt: pastDate
      };
      
      expect(BoltAuth.isSessionExpired(session)).toBe(true);
    });

    it('should return false for session without expiration', () => {
      const session = {
        cookies: {}
      };
      
      expect(BoltAuth.isSessionExpired(session)).toBe(false);
    });
  });

  describe('extractOrganizationId', () => {
    it('should extract organization ID from session', () => {
      const session = BoltAuth.parseCookies(sampleCookies);
      const orgId = BoltAuth.extractOrganizationId(session);
      
      expect(orgId).toBe('22851');
    });

    it('should return undefined for session without org ID', () => {
      const cookiesWithoutOrg = '_stackblitz_session=abc123; sb_session=def456; sb_user_id=user123';
      const session = BoltAuth.parseCookies(cookiesWithoutOrg);
      const orgId = BoltAuth.extractOrganizationId(session);
      
      expect(orgId).toBeUndefined();
    });
  });

  describe('sanitizeCookiesForLogging', () => {
    it('should sanitize sensitive cookies', () => {
      const cookies = {
        '_stackblitz_session': 'very-long-session-token-12345',
        'sb_session': 'another-long-token-67890',
        'sb_user_id': 'user123',
        'normal_cookie': 'normal_value'
      };
      
      const sanitized = BoltAuth.sanitizeCookiesForLogging(cookies);
      
      expect(sanitized['_stackblitz_session']).toBe('very-lon...');
      expect(sanitized['sb_session']).toBe('another-...');
      expect(sanitized['sb_user_id']).toBe('user123');
      expect(sanitized['normal_cookie']).toBe('normal_value');
    });
  });
});
