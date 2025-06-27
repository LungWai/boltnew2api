// ==UserScript==
// @name         Bolt.new Cookie Extractor
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Extract bolt.new cookies for API usage
// @author       You
// @match        https://bolt.new/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        buttonId: 'bolt-cookie-extractor',
        modalId: 'bolt-cookie-modal',
        overlayId: 'bolt-cookie-overlay'
    };

    // Required cookies for bolt.new API
    const REQUIRED_COOKIES = [
        '__session',
        'activeOrganizationId',
        '_ga',
        '_fbp',
        'hubspotutk',
        '__hstc',
        '__hssc'
    ];

    // Create extraction button
    function createExtractionButton() {
        const button = document.createElement('button');
        button.id = CONFIG.buttonId;
        button.innerHTML = '🍪 Extract Cookies';
        button.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            background: #4CAF50;
            color: white;
            border: none;
            padding: 12px 16px;
            border-radius: 8px;
            cursor: pointer;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transition: all 0.2s ease;
        `;

        button.addEventListener('mouseenter', () => {
            button.style.background = '#45a049';
            button.style.transform = 'translateY(-1px)';
        });

        button.addEventListener('mouseleave', () => {
            button.style.background = '#4CAF50';
            button.style.transform = 'translateY(0)';
        });

        button.addEventListener('click', extractAndShowCookies);
        return button;
    }

    // Extract cookies from document
    function extractCookies() {
        const cookies = {};
        const cookieString = document.cookie;
        
        if (!cookieString) {
            return { cookies: {}, cookieString: '', valid: false, missing: REQUIRED_COOKIES };
        }

        // Parse cookies
        cookieString.split(';').forEach(cookie => {
            const [name, value] = cookie.trim().split('=');
            if (name && value) {
                cookies[name] = value;
            }
        });

        // Check for required cookies
        const missing = REQUIRED_COOKIES.filter(name => !cookies[name]);
        const valid = missing.length === 0;

        return {
            cookies,
            cookieString,
            valid,
            missing,
            count: Object.keys(cookies).length
        };
    }

    // Analyze cookie data
    function analyzeCookies(cookieData) {
        const analysis = {
            accountType: 'unknown',
            organizationId: null,
            sessionToken: null,
            expiry: null
        };

        if (cookieData.cookies.activeOrganizationId && cookieData.cookies.activeOrganizationId !== 'null') {
            analysis.accountType = 'team';
            analysis.organizationId = cookieData.cookies.activeOrganizationId;
        } else if (cookieData.cookies.sb_user_id) {
            analysis.accountType = 'individual';
        }

        if (cookieData.cookies.__session) {
            analysis.sessionToken = cookieData.cookies.__session.substring(0, 20) + '...';
        }

        // Estimate expiry (typically 24 hours for session cookies)
        analysis.expiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

        return analysis;
    }

    // Create modal for displaying cookies
    function createModal(cookieData, analysis) {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.id = CONFIG.overlayId;
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 10001;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        // Create modal
        const modal = document.createElement('div');
        modal.id = CONFIG.modalId;
        modal.style.cssText = `
            background: white;
            border-radius: 12px;
            padding: 24px;
            max-width: 800px;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;

        const statusIcon = cookieData.valid ? '✅' : '❌';
        const statusText = cookieData.valid ? 'Valid' : 'Invalid';
        const statusColor = cookieData.valid ? '#4CAF50' : '#f44336';

        modal.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="margin: 0; color: #333;">🍪 Bolt.new Cookie Extractor</h2>
                <button id="close-modal" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #666;">×</button>
            </div>
            
            <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                    <span style="font-size: 18px;">${statusIcon}</span>
                    <strong style="color: ${statusColor};">Status: ${statusText}</strong>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; font-size: 14px;">
                    <div><strong>Account Type:</strong> ${analysis.accountType}</div>
                    <div><strong>Cookie Count:</strong> ${cookieData.count}</div>
                    <div><strong>Cookie Length:</strong> ${cookieData.cookieString.length} chars</div>
                    <div><strong>Estimated Expiry:</strong> ${new Date(analysis.expiry).toLocaleString()}</div>
                </div>
            </div>

            ${!cookieData.valid ? `
                <div style="background: #ffebee; border: 1px solid #f44336; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                    <h3 style="margin: 0 0 8px 0; color: #d32f2f;">❌ Missing Required Cookies</h3>
                    <p style="margin: 0; color: #666;">The following cookies are required but missing:</p>
                    <ul style="margin: 8px 0 0 20px; color: #d32f2f;">
                        ${cookieData.missing.map(cookie => `<li><code>${cookie}</code></li>`).join('')}
                    </ul>
                    <p style="margin: 12px 0 0 0; color: #666; font-size: 14px;">
                        <strong>Solution:</strong> Make sure you're logged into bolt.new and try refreshing the page.
                    </p>
                </div>
            ` : ''}

            <div style="margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <h3 style="margin: 0;">Cookie String</h3>
                    <button id="copy-cookies" style="background: #2196F3; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px;">
                        📋 Copy to Clipboard
                    </button>
                </div>
                <textarea id="cookie-textarea" readonly style="width: 100%; height: 120px; padding: 12px; border: 1px solid #ddd; border-radius: 6px; font-family: monospace; font-size: 12px; resize: vertical; background: #f9f9f9;">${cookieData.cookieString}</textarea>
            </div>

            <div style="margin-bottom: 20px;">
                <h3 style="margin: 0 0 12px 0;">Usage Example</h3>
                <pre style="background: #f5f5f5; padding: 16px; border-radius: 8px; overflow-x: auto; font-size: 12px; margin: 0;"><code>const response = await fetch('https://bolt2api-rf6frxmcca-ew.a.run.app/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Cookie': '${cookieData.cookieString.substring(0, 50)}...'
  },
  body: JSON.stringify({
    messages: [{
      id: 'msg-' + Date.now(),
      role: 'user',
      content: 'Your question here'
    }],
    projectId: '49956303',
    promptMode: 'discussion'
  })
});</code></pre>
            </div>

            <div style="background: #e3f2fd; border: 1px solid #2196F3; border-radius: 8px; padding: 16px;">
                <h4 style="margin: 0 0 8px 0; color: #1976d2;">💡 Tips</h4>
                <ul style="margin: 0; padding-left: 20px; color: #666; font-size: 14px;">
                    <li>Cookies typically expire after 24 hours</li>
                    <li>Re-extract cookies when you get 401 errors</li>
                    <li>Keep cookies secure and never expose them publicly</li>
                    <li>Test your cookies with the health check endpoint first</li>
                </ul>
            </div>
        `;

        overlay.appendChild(modal);

        // Add event listeners
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                document.body.removeChild(overlay);
            }
        });

        modal.querySelector('#close-modal').addEventListener('click', () => {
            document.body.removeChild(overlay);
        });

        modal.querySelector('#copy-cookies').addEventListener('click', () => {
            const textarea = modal.querySelector('#cookie-textarea');
            textarea.select();
            document.execCommand('copy');
            
            const button = modal.querySelector('#copy-cookies');
            const originalText = button.innerHTML;
            button.innerHTML = '✅ Copied!';
            button.style.background = '#4CAF50';
            
            setTimeout(() => {
                button.innerHTML = originalText;
                button.style.background = '#2196F3';
            }, 2000);
        });

        return overlay;
    }

    // Main extraction function
    function extractAndShowCookies() {
        const cookieData = extractCookies();
        const analysis = analyzeCookies(cookieData);
        const modal = createModal(cookieData, analysis);
        
        document.body.appendChild(modal);
        
        // Log to console for debugging
        console.log('🍪 Bolt.new Cookie Extraction Results:', {
            cookieData,
            analysis
        });
    }

    // Initialize when page loads
    function initialize() {
        // Wait for page to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initialize);
            return;
        }

        // Add extraction button
        const button = createExtractionButton();
        document.body.appendChild(button);

        console.log('🍪 Bolt.new Cookie Extractor loaded! Click the green button to extract cookies.');
    }

    // Start initialization
    initialize();

})();
