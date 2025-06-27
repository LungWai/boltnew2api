# Bolt2API - bolt.new Chat API Wrapper

A production-ready API wrapper that intercepts and proxies bolt.new's chat functionality using session cookies for authentication.

## ✅ Status: Fully Working

- **Service URL**: `https://bolt2api-rf6frxmcca-ew.a.run.app`
- **Local Server**: `http://localhost:8080`
- **Version**: 2.0.0
- **Last Updated**: 2025-06-27

## 🚀 Features

- 🔐 **Cookie Authentication** - Works with bolt.new session cookies
- 💬 **Chat API Proxy** - Direct access to bolt.new's AI chat
- 🔄 **Streaming Support** - Handles bolt.new's streaming responses
- 🏢 **Team Account Support** - Works with both individual and team accounts
- 📊 **Request Logging** - Complete request/response monitoring
- ⚡ **Production Ready** - Deployed on Google Cloud Run

## 🎯 Quick Start

### 1. Get Your Cookies
1. Install the Tampermonkey browser extension
2. Install the cookie extractor script (`bolt-cookie-extractor.user.js`)
3. Visit [bolt.new](https://bolt.new) and login
4. Click the "🍪 Extract Cookies" button
5. Copy your session cookies

### 2. Make Your First Request
```javascript
const response = await fetch('https://bolt2api-rf6frxmcca-ew.a.run.app/api/chat', {
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
console.log(data.data.content); // AI response
```

### 3. Test the Service
```bash
# Health check
curl https://bolt2api-rf6frxmcca-ew.a.run.app/health

# Chat test
curl -X POST https://bolt2api-rf6frxmcca-ew.a.run.app/api/chat \
  -H "Content-Type: application/json" \
  -H "Cookie: YOUR_COOKIES_HERE" \
  -d '{
    "messages": [{"id": "test", "role": "user", "content": "Hello"}],
    "projectId": "49956303",
    "promptMode": "discussion"
  }'
```

## 📋 API Endpoints

### POST `/api/chat` - Send Chat Messages
Send messages to bolt.new's AI and receive responses.

**Request:**
```javascript
{
  "messages": [
    {"id": "msg-1", "role": "user", "content": "Your message"}
  ],
  "projectId": "49956303",
  "promptMode": "discussion"
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

### GET `/health` - Service Status
Check if the API service is running.

**Response:**
```javascript
{
  "success": true,
  "message": "corrected bolt2api is running",
  "timestamp": "2025-06-27T08:12:30.840Z",
  "version": "2.0.0"
}
```

## 🍪 Authentication

The API uses bolt.new session cookies for authentication. Two account types are supported:

### Individual Account Cookies
- `_stackblitz_session`
- `sb_session`
- `sb_user_id`

### Team Account Cookies (Recommended)
- `__session`
- `activeOrganizationId`
- Additional tracking cookies

### Cookie Extraction Methods

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

### Using Cookies
Include cookies in the `Cookie` header:
```bash
curl -X POST https://bolt2api-rf6frxmcca-ew.a.run.app/api/chat \
  -H "Content-Type: application/json" \
  -H "Cookie: your_extracted_cookies" \
  -d '{"messages": [{"id": "test", "role": "user", "content": "Hello"}], "projectId": "49956303", "promptMode": "discussion"}'
```

## ⚠️ Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Expired/invalid cookies | Re-extract cookies from bolt.new |
| 404 Not Found | Wrong endpoint URL | Use correct service URL |
| 500 Server Error | Invalid request format | Check request body structure |
| No response/timeout | bolt.new rate limiting | Wait 10-15 seconds and retry |

### Cookie Expiration
- Cookies typically expire after 24 hours
- Re-extract cookies when you get 401 errors
- The cookie extractor script shows validity status

## 📁 Project Structure

```
bolt2api/
├── corrected-bolt2api.js    # Main working server
├── bolt-cookie-extractor.user.js  # Tampermonkey script
├── API_REFERENCE.md         # Complete API documentation
├── INSTALLATION.md          # Quick setup guide
├── USAGE_GUIDE.md          # Detailed usage examples
├── sample-cookies.txt       # Example cookie format
├── api/                     # Serverless functions (TypeScript)
├── src/                     # Source code (TypeScript)
├── tests/                   # Test files
└── testrun/                 # Test results and utilities
```

## 🚀 Local Development

### Running the Server
```bash
# Install dependencies
npm install

# Start the local server
node corrected-bolt2api.js
# Server runs on http://localhost:8080
```

### Available Scripts
```bash
npm run dev          # Start development server (Vercel)
npm run build        # Build TypeScript
npm run test         # Run tests
npm run lint         # Lint code
npm run type-check   # Type checking
```

## 📚 Documentation

- **[API_REFERENCE.md](API_REFERENCE.md)** - Complete API documentation
- **[INSTALLATION.md](INSTALLATION.md)** - Quick setup guide
- **[USAGE_GUIDE.md](USAGE_GUIDE.md)** - Detailed usage examples
- **[SUCCESSFUL_REQUEST_FORMAT.md](SUCCESSFUL_REQUEST_FORMAT.md)** - Working request format

## 🔒 Security & Best Practices

- Keep session cookies private and secure
- Use HTTPS in production environments
- Rotate cookies regularly (they expire ~24 hours)
- Monitor API usage for unauthorized access
- Never expose cookies in client-side code

## 📊 Performance Notes

- **Response Time**: 4-12 seconds typical
- **Cookie Expiry**: ~24 hours
- **Rate Limiting**: Handled by bolt.new
- **Max Request Size**: 10MB
- **Timeout**: 30 seconds default

## 🆘 Support

- **Service Status**: Check `/health` endpoint
- **Cookie Issues**: Use the Tampermonkey extractor script
- **API Questions**: See `API_REFERENCE.md`
- **Setup Help**: See `INSTALLATION.md`

## 📄 License

MIT License - see LICENSE file for details.

---

**🎉 Ready to use!** Your bolt.new API wrapper is production-ready and fully functional.

Built with ❤️ for the bolt.new community
