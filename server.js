// Main bolt2api server - Production ready implementation
// This is the working server that successfully proxies bolt.new chat API

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
        if (name === '__session') {
          sessionToken = value;
        }

        // Check for organization ID to determine account type
        if (name === 'activeOrganizationId') {
          organizationId = value;
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

function createBrowserHeaders(session, projectId, additionalHeaders = {}) {
  const baseHeaders = {
    'Accept': '*/*',
    'Accept-Encoding': 'gzip, deflate, br, zstd',
    'Accept-Language': 'en-US,en;q=0.9',
    'Content-Type': 'application/json',
    'Origin': 'https://bolt.new',
    'Priority': 'u=1, i',
    'Referer': `https://bolt.new/~/sb1-${projectId}`,
    'Sec-Ch-Ua': '"Google Chrome";v="137", "Not/A)Brand";v="24"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
    'X-Bolt-Client-Revision': 'd65f6d0',
    'X-Bolt-Project-Id': projectId
  };

  // Add cookies
  const cookieString = Object.entries(session.cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');
  
  baseHeaders['Cookie'] = cookieString;

  return { ...baseHeaders, ...additionalHeaders };
}

async function makeRequestToBolt(endpoint, options) {
  const url = `https://bolt.new${endpoint}`;
  
  console.log(`🌐 Making request to: ${url}`);
  console.log('📤 Request headers:', JSON.stringify(options.headers, null, 2));
  console.log('📤 Request body:', JSON.stringify(options.body, null, 2));

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers: options.headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  console.log(`📥 Response status: ${response.status} ${response.statusText}`);
  console.log('📥 Response headers:', JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Error response:', errorText);
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const responseText = await response.text();
  console.log('📥 Response body:', responseText.substring(0, 500) + (responseText.length > 500 ? '...' : ''));

  return {
    type: 'stream',
    content: responseText
  };
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'bolt2api server is running',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// Chat endpoint - Main functionality
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

    // Prepare chat request with exact browser format
    const chatRequest = {
      id: req.body.id || generateRequestId(),
      errorReasoning: req.body.errorReasoning || null,
      featurePreviews: req.body.featurePreviews || { 
        diffs: false, 
        reasoning: false 
      },
      framework: req.body.framework || "DEFAULT_TO_DEV",
      isFirstPrompt: req.body.isFirstPrompt || false,
      messages: req.body.messages || [],
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

    console.log('🔄 Prepared chat request:', JSON.stringify(chatRequest, null, 2));

    // Additional headers for team accounts
    const additionalHeaders = {};
    if (session.accountType === 'team' && session.organizationId) {
      additionalHeaders['X-Organization-Id'] = session.organizationId;
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

// Start server
app.listen(port, () => {
  console.log(`🚀 bolt2api server running on port ${port}`);
  console.log(`📍 Health check: http://localhost:${port}/health`);
  console.log(`💬 Chat endpoint: http://localhost:${port}/api/chat`);
  console.log(`📚 Documentation: See README.md and API_REFERENCE.md`);
});

module.exports = app;
