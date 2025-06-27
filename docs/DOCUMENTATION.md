# Bolt2API - Complete Documentation

## 📋 Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [API Reference](#api-reference)
4. [Authentication](#authentication)
5. [Usage Examples](#usage-examples)
6. [Development](#development)
7. [Testing](#testing)
8. [Deployment](#deployment)
9. [Troubleshooting](#troubleshooting)
10. [File Structure](#file-structure)

## Overview

Bolt2API is a production-ready API wrapper that intercepts and proxies bolt.new's chat functionality. It allows you to programmatically access bolt.new's AI capabilities using session cookies for authentication.

### Key Features
- ✅ **Fully Working** - Production-ready implementation
- 🔐 **Cookie Authentication** - Works with bolt.new session cookies
- 🏢 **Team Account Support** - Supports both individual and team accounts
- 🔄 **Streaming Support** - Handles bolt.new's streaming responses
- 📊 **Request Logging** - Complete request/response monitoring
- ⚡ **High Performance** - Optimized for production use

### Service Information
- **Deployed Service**: `https://bolt2api-rf6frxmcca-ew.a.run.app`
- **Local Development**: `http://localhost:8080`
- **Version**: 2.0.0
- **Status**: ✅ Fully Operational

## Quick Start

### 1. Setup
```bash
# Clone the repository
git clone <repository-url>
cd bolt2api

# Install dependencies
npm install

# Start the server
npm start
# Server runs on http://localhost:8080
```

### 2. Get Your Cookies
1. Install Tampermonkey browser extension
2. Install the cookie extractor script (`bolt-cookie-extractor.user.js`)
3. Visit [bolt.new](https://bolt.new) and login
4. Click "🍪 Extract Cookies" button
5. Copy the extracted cookies

### 3. Test the Service
```bash
# Health check
curl http://localhost:8080/health

# Chat test
curl -X POST http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -H "Cookie: YOUR_COOKIES_HERE" \
  -d '{
    "messages": [{"id": "test", "role": "user", "content": "Hello"}],
    "projectId": "49956303",
    "promptMode": "discussion"
  }'
```

## API Reference

### Endpoints

#### POST `/api/chat`
Send chat messages to bolt.new's AI.

**Headers:**
```
Content-Type: application/json
Cookie: your_bolt_session_cookies
```

**Request Body:**
```javascript
{
  "messages": [
    {"id": "msg-1", "role": "user", "content": "Your message"}
  ],
  "projectId": "49956303",
  "promptMode": "discussion",
  // Optional fields:
  "id": "unique-request-id",
  "framework": "DEFAULT_TO_DEV",
  "isFirstPrompt": false,
  "featurePreviews": {"diffs": false, "reasoning": false},
  "metrics": {"importFilesLength": 0, "fileChangesLength": 0},
  "stripeStatus": "not-configured",
  "supportIntegrations": true,
  "usesInspectedElement": false,
  "errorReasoning": null
}
```

**Response:**
```javascript
{
  "success": true,
  "data": {
    "type": "stream",
    "content": "0:\"AI response content...\""
  },
  "timestamp": "2025-06-27T08:12:30.840Z"
}
```

#### GET `/health`
Check service status.

**Response:**
```javascript
{
  "success": true,
  "message": "bolt2api server is running",
  "timestamp": "2025-06-27T08:12:30.840Z",
  "version": "2.0.0"
}
```

## Authentication

### Cookie Types

#### Individual Account Cookies
- `_stackblitz_session`
- `sb_session`
- `sb_user_id`

#### Team Account Cookies (Recommended)
- `__session`
- `activeOrganizationId`
- Additional tracking cookies for full compatibility

### Cookie Extraction

#### Method 1: Tampermonkey Script (Recommended)
1. Install Tampermonkey browser extension
2. Install the provided script (`bolt-cookie-extractor.user.js`)
3. Visit bolt.new and login
4. Click "🍪 Extract Cookies" button
5. Copy the extracted cookies

#### Method 2: Browser DevTools
1. Open bolt.new and login
2. Open DevTools (F12) → Application → Cookies
3. Copy all cookie values for bolt.new domain

### Sample Working Cookies
```
_fbp=fb.1.1749901457387.683074235251349705; _ga=GA1.1.687330784.1749901458; ajs_anonymous_id=ODdjMzk0MzctM2E0Yi00YjJiLWI0ZjgtODZhMGJiNTU3NWFm; hubspotutk=e388db2bbd055574895fe623abc00acc; activeOrganizationId=MjI4NTE%3D; __session=eyJkIjoiZVR6SUdsdTlaZlh5cGJnblNjeWVsdVpmNTZlU0liRDRDL1k5VDB5cTJKMTNKU3o1bDRrS0RPa29FcHJDekRNSlo3cjBxRFVTelZpcVl0ajQySzZhU3l4Y29HQUtsbXFHVHk0NkRqcW8vb1RSbDl1TWQyYVdyVWY0YytvWjU1Z2Jnb0RJNXRFakIyVTFpOTdyRi9jK2VBdTYrT0dVaXlQUTM2SWVOdkJWdnAyYnh4Zi9zQ3NUSEMzc0w3eWJnbUlneU1hVDF4YXppejQvUjZwRXB1bXpKZ1VZYURUb0cwMGZsWUpRL25CWkF6UDAzYzJMc2dkcVFLL0xITkFoZ05KWEtDREdrbklOdUFidDRVVkpqV2hoMFRoTGtXbVh2dCtJTXVySjVueWozZWM9In0%3D.UVzs7gZ%2BrfXZZL8gW%2FqYnGdR%2FRhYK60tIwLMl%2FVV9Po
```

## Usage Examples

### Basic Chat Request
```javascript
const response = await fetch('http://localhost:8080/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Cookie': 'your_bolt_cookies_here'
  },
  body: JSON.stringify({
    messages: [{
      id: 'msg-' + Date.now(),
      role: 'user',
      content: 'Create a React todo app'
    }],
    projectId: '49956303',
    promptMode: 'discussion'
  })
});

const data = await response.json();
console.log(data.data.content);
```

### Code Generation
```javascript
const codeRequest = {
  messages: [{
    id: 'code-' + Date.now(),
    role: 'user',
    content: 'Write a Python function to calculate fibonacci numbers'
  }],
  projectId: '49956303',
  promptMode: 'discussion'
};
```

### Multi-turn Conversation
```javascript
const conversationRequest = {
  messages: [
    {id: 'msg-1', role: 'user', content: 'Create a React component'},
    {id: 'msg-2', role: 'assistant', content: 'Here\'s a React component...'},
    {id: 'msg-3', role: 'user', content: 'Now add TypeScript types'}
  ],
  projectId: '49956303',
  promptMode: 'discussion'
};
```

## Development

### Available Scripts
```bash
npm start           # Start production server
npm run dev         # Start development server (Vercel)
npm run build       # Build TypeScript
npm test            # Run Jest tests
npm run test:service # Run service integration tests
npm run lint        # Lint code
npm run type-check  # TypeScript type checking
```

### Local Development
```bash
# Start the server
npm start
# Server runs on http://localhost:8080

# In another terminal, test the service
npm run test:service
```

## Testing

### Automated Testing
```bash
# Run all tests
npm test

# Run service integration tests
npm run test:service

# Manual health check
curl http://localhost:8080/health
```

### Manual Testing
```bash
# Test deployed service
curl -X POST https://bolt2api-rf6frxmcca-ew.a.run.app/api/chat \
  -H "Content-Type: application/json" \
  -H "Cookie: YOUR_COOKIES_HERE" \
  -d '{
    "messages": [{"id": "test", "role": "user", "content": "Hello"}],
    "projectId": "49956303",
    "promptMode": "discussion"
  }'
```

## Deployment

### Google Cloud Run (Current)
The service is currently deployed on Google Cloud Run:
- **URL**: `https://bolt2api-rf6frxmcca-ew.a.run.app`
- **Status**: ✅ Active

### Local Deployment
```bash
# Using Docker
docker build -t bolt2api .
docker run -p 8080:8080 bolt2api

# Direct Node.js
npm start
```

### Vercel Deployment
```bash
npm install -g vercel
vercel login
vercel
```

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Expired/invalid cookies | Re-extract cookies from bolt.new |
| 404 Not Found | Wrong endpoint URL | Verify correct service URL |
| 500 Server Error | Invalid request format | Check request body structure |
| No response/timeout | bolt.new rate limiting | Wait 10-15 seconds and retry |

### Cookie Issues
- **Expiration**: Cookies expire after ~24 hours
- **Validation**: Use the cookie extractor to check validity
- **Format**: Ensure all required cookies are included

### Performance Notes
- **Response Time**: 4-12 seconds typical
- **Rate Limiting**: Handled by bolt.new
- **Max Request Size**: 10MB
- **Timeout**: 30 seconds default

## File Structure

```
bolt2api/
├── server.js                    # Main production server
├── corrected-bolt2api.js        # Legacy working server
├── bolt-cookie-extractor.user.js # Tampermonkey script
├── sample-cookies.txt           # Example cookie format
├── API_REFERENCE.md             # Complete API documentation
├── INSTALLATION.md              # Quick setup guide
├── USAGE_GUIDE.md              # Detailed usage examples
├── SUCCESSFUL_REQUEST_FORMAT.md # Working request format
├── WORKING_SOLUTION_SUMMARY.md  # Solution status
├── DOCUMENTATION.md             # This file
├── package.json                 # Node.js configuration
├── tsconfig.json               # TypeScript configuration
├── Dockerfile                  # Docker configuration
├── api/                        # Serverless functions (TypeScript)
│   ├── chat.ts                 # Chat endpoint
│   ├── auth.ts                 # Authentication
│   ├── health.ts               # Health check
│   └── projects.ts             # Projects management
├── src/                        # Source code (TypeScript)
│   ├── types/                  # TypeScript type definitions
│   ├── utils/                  # Utility functions
│   └── services/               # Business logic
├── tests/                      # Jest test files
├── testrun/                    # Test results and utilities
└── utils/                      # Development utilities
    └── test-service.js         # Service testing utility
```

---

**Last Updated**: 2025-06-27  
**Status**: ✅ Production Ready  
**Compatibility**: bolt.new Individual & Team Accounts
