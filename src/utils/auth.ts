/**
 * Authentication utilities for bolt.new cookie session management
 */

import { parse as parseCookie } from 'cookie';
import { BoltSession, AuthHeaders, WrapperAuthRequest, WrapperAuthResponse } from '../types';

export class BoltAuth {
  private static readonly BOLT_BASE_URL = 'https://bolt.new';
  private static readonly INDIVIDUAL_COOKIES = [
    '_stackblitz_session',
    'sb_session',
    'sb_user_id'
  ];
  private static readonly TEAM_COOKIES = [
    '__session',
    'activeOrganizationId'
  ];

  /**
   * Parse and validate bolt.new session cookies
   */
  static parseCookies(cookieString: string): BoltSession {
    const cookies = parseCookie(cookieString);

    // Check for individual account cookies first
    const missingIndividual = this.INDIVIDUAL_COOKIES.filter(name => !cookies[name]);
    const hasIndividualCookies = missingIndividual.length === 0;

    if (hasIndividualCookies) {
      console.log('🔑 Using individual account authentication');
      return {
        cookies,
        userId: cookies.sb_user_id,
        organizationId: cookies.sb_org_id,
        expiresAt: this.extractExpiration(cookies),
        accountType: 'individual'
      };
    }

    // Check for team account cookies
    const missingTeam = this.TEAM_COOKIES.filter(name => !cookies[name]);
    const hasTeamCookies = missingTeam.length === 0;

    if (hasTeamCookies) {
      console.log('🏢 Using team account authentication');
      return {
        cookies,
        userId: 'team_user', // Team accounts don't have individual user IDs
        organizationId: cookies.activeOrganizationId,
        expiresAt: this.extractExpiration(cookies),
        accountType: 'team',
        sessionToken: cookies.__session,
        rememberToken: cookies.remember_user_token,
        oauthProvider: cookies.bolt_oauth_provider
      };
    }

    // If neither type is found, throw error with helpful message
    throw new Error(`Missing required cookies. For individual accounts: ${missingIndividual.join(', ')}. For team accounts: ${missingTeam.join(', ')}`);
  }

  /**
   * Create authentication headers for bolt.new API requests
   */
  static createAuthHeaders(session: BoltSession, additionalHeaders: Record<string, string> = {}): AuthHeaders {
    const cookieString = Object.entries(session.cookies)
      .map(([name, value]) => `${name}=${value}`)
      .join('; ');

    const headers: AuthHeaders = {
      'Cookie': cookieString,
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
      'Referer': 'https://bolt.new/',
      'Origin': 'https://bolt.new',
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br, zstd',
      'Sec-Ch-Ua': '"Google Chrome";v="137", "Chromium";v="137", "Not/A)Brand";v="24"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
      'Priority': 'u=1, i'
    };

    // Add team-specific headers
    if (session.accountType === 'team') {
      headers['X-Bolt-Client-Revision'] = 'd65f6d0';
      // Project ID will be added by the caller if needed
    } else {
      headers['X-Requested-With'] = 'XMLHttpRequest';
    }

    return {
      ...headers,
      ...additionalHeaders
    };
  }

  /**
   * Validate session by checking with bolt.new API
   */
  static async validateSession(session: BoltSession): Promise<WrapperAuthResponse> {
    try {
      const headers = this.createAuthHeaders(session);
      
      // Test authentication with bolt.new's token endpoint
      const response = await fetch(`${this.BOLT_BASE_URL}/api/token`, {
        method: 'GET',
        headers,
        credentials: 'include'
      });

      if (!response.ok) {
        return {
          success: false,
          valid: false,
          error: `Authentication failed: ${response.status} ${response.statusText}`
        };
      }

      const tokenData = await response.json();
      
      // Get organization info if available
      let organizationId = session.organizationId;
      let tokenUsage;

      if (organizationId) {
        try {
          const orgResponse = await fetch(`${this.BOLT_BASE_URL}/api/chats?organization=${organizationId}`, {
            method: 'GET',
            headers,
            credentials: 'include'
          });

          if (orgResponse.ok) {
            // Try to get token stats
            const statsResponse = await fetch(`${this.BOLT_BASE_URL}/api/token-stats`, {
              method: 'GET',
              headers,
              credentials: 'include'
            });

            if (statsResponse.ok) {
              const stats = await statsResponse.json();
              tokenUsage = {
                used: stats.used || 0,
                remaining: stats.remaining || 0,
                limit: stats.limit || 0
              };
            }
          }
        } catch (error) {
          console.warn('Failed to fetch organization data:', error);
        }
      }

      return {
        success: true,
        valid: true,
        organizationId,
        userId: session.userId,
        tokenUsage
      };

    } catch (error) {
      return {
        success: false,
        valid: false,
        error: `Session validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Extract expiration date from cookies
   */
  private static extractExpiration(cookies: Record<string, string>): Date | undefined {
    // Try to extract expiration from session cookie (individual or team)
    const sessionCookie = cookies._stackblitz_session || cookies.__session;
    if (sessionCookie) {
      try {
        // Session cookies typically expire in 24 hours
        const expiration = new Date();
        expiration.setHours(expiration.getHours() + 24);
        return expiration;
      } catch (error) {
        console.warn('Failed to extract cookie expiration:', error);
      }
    }
    return undefined;
  }

  /**
   * Check if session is expired
   */
  static isSessionExpired(session: BoltSession): boolean {
    if (!session.expiresAt) {
      return false; // Assume valid if no expiration
    }
    return new Date() > session.expiresAt;
  }

  /**
   * Extract organization ID from cookies or API response
   */
  static extractOrganizationId(session: BoltSession): string | undefined {
    return session.organizationId || session.cookies.sb_org_id;
  }

  /**
   * Sanitize cookies for logging (remove sensitive values)
   */
  static sanitizeCookiesForLogging(cookies: Record<string, string>): Record<string, string> {
    const sanitized: Record<string, string> = {};
    
    for (const [name, value] of Object.entries(cookies)) {
      if (name.includes('session') || name.includes('token')) {
        sanitized[name] = `${value.substring(0, 8)}...`;
      } else {
        sanitized[name] = value;
      }
    }
    
    return sanitized;
  }
}
