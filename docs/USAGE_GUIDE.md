# Bolt2API Usage Guide

A comprehensive guide for using the bolt.new API wrapper deployed on Google Cloud Run.

## 🚀 Quick Start

### API Endpoint
```
POST https://bolt2api-rf6frxmcca-ew.a.run.app/api/chat
```

### Basic Request
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
      content: 'Create a React component for a todo list'
    }],
    projectId: '49956303',
    promptMode: 'discussion'
  })
});

const data = await response.json();
console.log(data.data.content); // AI response
```

## 🍪 Getting Your Cookies

### Method 1: Use the Tampermonkey Script
1. Install the provided Tampermonkey script (see `bolt-cookie-extractor.user.js`)
2. Visit bolt.new in your browser
3. The script will automatically extract and display your cookies
4. Copy the cookies for use in your API requests

### Method 2: Manual Extraction
1. Open bolt.new in your browser
2. Open Developer Tools (F12)
3. Go to Network tab
4. Make a chat request on bolt.new
5. Find the `/api/chat` request
6. Copy the `Cookie` header value

## 📋 Request Format

### Required Headers
```javascript
{
  'Content-Type': 'application/json',
  'Cookie': 'your_bolt_cookies_here'
}
```

### Optional Headers (Recommended)
```javascript
{
  'Content-Type': 'application/json',
  'Cookie': 'your_bolt_cookies_here',
  'X-Bolt-Client-Revision': 'd65f6d0',
  'X-Bolt-Project-Id': '49956303'
}
```

### Request Body Structure
```javascript
{
  // Required fields
  "messages": [
    {
      "id": "unique-message-id",
      "role": "user",
      "content": "Your question or request here"
    }
  ],
  "projectId": "49956303",
  "promptMode": "discussion",
  
  // Optional fields with defaults
  "id": "unique-request-id",
  "framework": "DEFAULT_TO_DEV",
  "isFirstPrompt": false,
  "featurePreviews": {
    "diffs": false,
    "reasoning": false
  },
  "metrics": {
    "importFilesLength": 0,
    "fileChangesLength": 0
  },
  "stripeStatus": "not-configured",
  "supportIntegrations": true,
  "usesInspectedElement": false,
  "errorReasoning": null
}
```

## 📤 Response Format

### Successful Response
```javascript
{
  "success": true,
  "data": {
    "type": "stream",
    "content": "0:\"AI response content here...\""
  },
  "timestamp": "2025-06-17T08:12:30.840Z"
}
```

### Error Response
```javascript
{
  "success": false,
  "error": "error_type",
  "message": "Error description"
}
```

## 💡 Usage Examples

### Example 1: Simple Code Generation
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

### Example 2: React Component Creation
```javascript
const reactRequest = {
  messages: [{
    id: 'react-' + Date.now(),
    role: 'user',
    content: 'Create a React component with a form that validates email addresses'
  }],
  projectId: '49956303',
  promptMode: 'discussion',
  framework: 'DEFAULT_TO_DEV'
};
```

### Example 3: CSS Styling Help
```javascript
const cssRequest = {
  messages: [{
    id: 'css-' + Date.now(),
    role: 'user',
    content: 'Create responsive CSS grid layout for a photo gallery'
  }],
  projectId: '49956303',
  promptMode: 'discussion'
};
```

## 🔧 Advanced Usage

### Custom Project ID
If you have a specific bolt.new project, use its ID:
```javascript
{
  "projectId": "your-project-id",
  "messages": [...]
}
```

### Conversation Context
For multi-turn conversations, include previous messages:
```javascript
{
  "messages": [
    {
      "id": "msg-1",
      "role": "user", 
      "content": "Create a React component"
    },
    {
      "id": "msg-2",
      "role": "assistant",
      "content": "Here's a React component..."
    },
    {
      "id": "msg-3",
      "role": "user",
      "content": "Now add TypeScript types to it"
    }
  ],
  "projectId": "49956303",
  "promptMode": "discussion"
}
```

## ⚠️ Important Notes

### Cookie Expiration
- Cookies typically expire after 24 hours
- You'll get 401 errors when cookies expire
- Re-extract cookies from bolt.new when this happens

### Rate Limiting
- bolt.new may rate limit requests
- Add delays between requests if needed
- Typical response time: 4-12 seconds

### Response Processing
- Responses are in streaming format starting with `0:"`
- Parse the content to extract the actual AI response
- Handle both text and structured responses

## 🛠️ Troubleshooting

### Common Issues

#### 401 Unauthorized
- **Cause**: Expired or invalid cookies
- **Solution**: Re-extract cookies from bolt.new

#### 404 Not Found
- **Cause**: Incorrect endpoint URL
- **Solution**: Verify you're using the correct Cloud Run URL

#### 500 Internal Server Error
- **Cause**: Invalid request format or server issue
- **Solution**: Check request body structure and headers

### Health Check
Test if the service is running:
```bash
curl https://bolt2api-rf6frxmcca-ew.a.run.app/health
```

Expected response:
```json
{
  "success": true,
  "message": "corrected bolt2api is running",
  "timestamp": "2025-06-17T08:12:30.840Z",
  "version": "2.0.0"
}
```

## 📊 Performance Tips

1. **Reuse Connections**: Use HTTP keep-alive for multiple requests
2. **Batch Requests**: Group related questions when possible
3. **Cache Responses**: Store responses to avoid duplicate requests
4. **Monitor Cookies**: Check cookie expiration proactively

## 🔒 Security Considerations

1. **Keep Cookies Private**: Never expose cookies in client-side code
2. **Use HTTPS**: Always use secure connections
3. **Rotate Cookies**: Regularly refresh your authentication cookies
4. **Monitor Usage**: Track API usage to detect unauthorized access

## 🛠️ Installation & Setup

### Step 1: Install Tampermonkey
1. Install Tampermonkey browser extension:
   - **Chrome**: [Chrome Web Store](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
   - **Firefox**: [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)
   - **Safari**: [App Store](https://apps.apple.com/us/app/tampermonkey/id1482490089)

### Step 2: Install Cookie Extractor Script
1. Open Tampermonkey dashboard
2. Click "Create a new script"
3. Copy the contents of `bolt-cookie-extractor.user.js`
4. Paste into the editor and save (Ctrl+S)

### Step 3: Extract Your Cookies
1. Visit [bolt.new](https://bolt.new) in your browser
2. Make sure you're logged in
3. Click the green "🍪 Extract Cookies" button (top-right corner)
4. Copy the cookie string from the modal

### Step 4: Test Your Setup
```bash
curl -X POST https://bolt2api-rf6frxmcca-ew.a.run.app/api/chat \
  -H "Content-Type: application/json" \
  -H "Cookie: your_cookies_here" \
  -d '{
    "messages": [{"id": "test", "role": "user", "content": "Hello"}],
    "projectId": "49956303",
    "promptMode": "discussion"
  }'
```

## 📞 Support

- **Service URL**: https://bolt2api-rf6frxmcca-ew.a.run.app
- **Health Check**: https://bolt2api-rf6frxmcca-ew.a.run.app/health
- **Available Endpoints**: `/api/chat`, `/health`
- **Cookie Extractor**: Use the provided Tampermonkey script
