// Corrected bolt2api that matches EXACTLY what the browser sends
const express = require('express');
const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cookie');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Utility functions
function generateRequestId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function parseBoltCookies(cookieString) {
  const cookies = {};
  let organizationId = null;
  let accountType = 'individual';
  let sessionToken = null;

  if (cookieString) {
    cookieString.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      if (name && value) {
        cookies[name] = value; // Keep original value without decoding

        // Check for session token
        if (name === '_session') {
          sessionToken = value;
        }

        // Check for organization ID to determine account type
        if (name === 'activeOrganizationId' && value && value !== 'null') {
          organizationId = value; // Keep URL-encoded value as-is
          accountType = 'team';
        }
      }
    });
  }

  return {
    cookies,
    organizationId,
    accountType,
    sessionToken
  };
}

function createBrowserHeaders(session, projectId = '49956303', additionalHeaders = {}) {
  const cookieString = Object.entries(session.cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');

  // Standard HTTP headers that match browser request (no HTTP/2 pseudo-headers)
  const headers = {
    'Host': 'bolt.new',
    'Accept': '*/*',
    'Accept-Encoding': 'gzip, deflate, br, zstd',
    'Accept-Language': 'en-US,en;q=0.9',
    'Content-Type': 'application/json',
    'Cookie': cookieString,
    'Origin': 'https://bolt.new',
    'Referer': 'https://bolt.new/',
    'Sec-Ch-Ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
  };

  // Add any additional headers (CSRF tokens, etc.)
  Object.assign(headers, additionalHeaders);

  return headers;
}

async function makeRequestToBolt(endpoint, options) {
  const url = `https://bolt.new${endpoint}`;

  console.log(`🌐 Making request to: ${url}`);
  console.log('📋 Headers:', JSON.stringify(options.headers, null, 2));
  console.log('📝 Body:', JSON.stringify(options.body, null, 2));

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers: options.headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  console.log(`📊 Response status: ${response.status}`);
  console.log('📋 Response headers:', Object.fromEntries(response.headers.entries()));

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Bolt.new error response:', errorText);
    throw new Error(`Bolt.new API error: ${response.status} - ${errorText}`);
  }

  // Check content type to handle different response formats
  const contentType = response.headers.get('content-type') || '';
  console.log('📄 Content-Type:', contentType);

  try {
    if (contentType.includes('application/json')) {
      const data = await response.json();
      console.log('✅ JSON response received');
      return data;
    } else {
      // Handle streaming or text response
      const text = await response.text();
      console.log('✅ Text/streaming response received:', text.substring(0, 200) + '...');

      // Try to parse as JSON if it looks like JSON
      if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
        try {
          return JSON.parse(text);
        } catch (e) {
          console.log('📝 Response is not valid JSON, returning as text');
          return { type: 'stream', content: text };
        }
      }

      return { type: 'stream', content: text };
    }
  } catch (parseError) {
    console.error('❌ Error parsing response:', parseError);
    const rawText = await response.text();
    console.log('📝 Raw response:', rawText.substring(0, 500));
    throw new Error(`Failed to parse response: ${parseError.message}`);
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'corrected bolt2api is running',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// Chat endpoint - CORRECTED to match browser exactly
app.post('/api/chat', async (req, res) => {
  try {
    console.log('📥 Received chat request');
    console.log('🍪 Raw cookies:', req.headers.cookie);
    console.log('📝 Request body:', JSON.stringify(req.body, null, 2));
    
    const sessionCookies = req.headers.cookie;
    if (!sessionCookies) {
      console.log('❌ No session cookies found');
      return res.status(401).json({
        success: false,
        error: 'missing_session',
        message: 'Session cookies required'
      });
    }
    
    const session = parseBoltCookies(sessionCookies);
    console.log(`💬 Chat request for ${session.accountType} account`);
    console.log(`🏢 Organization ID: ${session.organizationId}`);

    // Create the EXACT payload structure that the browser sends
    const chatRequest = {
      id: req.body.id || generateRequestId(),
      errorReasoning: req.body.errorReasoning || null,
      featurePreviews: req.body.featurePreviews || {
        diffs: false,
        reasoning: false
      },
      framework: req.body.framework || "DEFAULT_TO_DEV",
      isFirstPrompt: req.body.isFirstPrompt || false,
      messages: req.body.messages || [
        {
          id: "user-message",
          role: "user",
          content: req.body.message || "Hello"
        }
      ],
      metrics: req.body.metrics || {
        importFilesLength: 0,
        fileChangesLength: 0
      },
      projectId: req.body.projectId || "49956303",
      promptMode: req.body.promptMode || "discussion",
      stripeStatus: req.body.stripeStatus || "not-configured",
      supportIntegrations: req.body.supportIntegrations !== undefined ? req.body.supportIntegrations : true,
      usesInspectedElement: req.body.usesInspectedElement || false
    };



    console.log('📤 Sending chat request:', JSON.stringify(chatRequest, null, 2));

    // Check for additional authentication headers from client
    const additionalHeaders = {};

    // Add required bolt-specific headers from browser request
    additionalHeaders['X-Bolt-Client-Revision'] = req.headers['x-bolt-client-revision'] || 'd65f6d0';
    additionalHeaders['X-Bolt-Project-Id'] = req.headers['x-bolt-project-id'] || chatRequest.projectId;

    // Forward CSRF token if provided
    if (req.headers['x-csrf-token']) {
      additionalHeaders['x-csrf-token'] = req.headers['x-csrf-token'];
    }

    // Forward authorization header if provided
    if (req.headers['authorization']) {
      additionalHeaders['authorization'] = req.headers['authorization'];
    }

    const headers = createBrowserHeaders(session, chatRequest.projectId, additionalHeaders);

    const response = await makeRequestToBolt('/api/chat', {
      method: 'POST',
      headers,
      body: chatRequest
    });

    res.json({
      success: true,
      data: response,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      error: 'chat_error',
      message: error.message
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'not_found',
    message: 'Endpoint not found',
    availableEndpoints: ['/api/chat', '/health']
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'internal_error',
    message: 'Internal server error'
  });
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Corrected bolt2api server running on port ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`💬 Chat API: http://localhost:${port}/api/chat`);
  console.log('🔧 Now matches EXACT browser request structure!');
});

module.exports = app;
