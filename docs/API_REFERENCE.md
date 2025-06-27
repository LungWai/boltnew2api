# Bolt2API - Complete API Reference

A comprehensive reference for the bolt.new API wrapper that intercepts and proxies bolt.new's chat functionality.

## 🚀 Service Information

- **Service URL**: `https://bolt2api-rf6frxmcca-ew.a.run.app`
- **Local Development**: `http://localhost:8080`
- **Status**: ✅ Fully Working
- **Version**: 2.0.0

## 📋 Available Endpoints

### 1. Chat API - `/api/chat`
**Method**: `POST`  
**Purpose**: Send chat messages to bolt.new and receive AI responses

#### Request Headers
```javascript
{
  'Content-Type': 'application/json',
  'Cookie': 'your_bolt_session_cookies',
  // Optional but recommended:
  'X-Bolt-Client-Revision': 'd65f6d0',
  'X-Bolt-Project-Id': '49956303'
}
```

#### Request Body
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

#### Response Format
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

### 2. Health Check - `/health`
**Method**: `GET`  
**Purpose**: Check service status and availability

#### Response
```javascript
{
  "success": true,
  "message": "corrected bolt2api is running",
  "timestamp": "2025-06-17T08:12:30.840Z",
  "version": "2.0.0"
}
```

## 🍪 Authentication

### Cookie Requirements
The API requires valid bolt.new session cookies. Two account types are supported:

#### Individual Account Cookies
- `_stackblitz_session`
- `sb_session` 
- `sb_user_id`

#### Team Account Cookies (Recommended)
- `__session`
- `activeOrganizationId`
- Additional tracking cookies for full compatibility

### Sample Working Cookies
```
_fbp=fb.1.1749901457387.683074235251349705; _ga=GA1.1.687330784.1749901458; ajs_anonymous_id=ODdjMzk0MzctM2E0Yi00YjJiLWI0ZjgtODZhMGJiNTU3NWFm; hubspotutk=e388db2bbd055574895fe623abc00acc; activeOrganizationId=MjI4NTE%3D; _gcl_au=1.1.1806974786.1749901457.135721763.1749945803.1749945802; __hssrc=1; __session=eyJkIjoiZVR6SUdsdTlaZlh5cGJnblNjeWVsdVpmNTZlU0liRDRDL1k5VDB5cTJKMTNKU3o1bDRrS0RPa29FcHJDekRNSlo3cjBxRFVTelZpcVl0ajQySzZhU3l4Y29HQUtsbXFHVHk0NkRqcW8vb1RSbDl1TWQyYVdyVWY0YytvWjU1Z2Jnb0RJNXRFakIyVTFpOTdyRi9jK2VBdTYrT0dVaXlQUTM2SWVOdkJWdnAyYnh4Zi9zQ3NUSEMzc0w3eWJnbUlneU1hVDF4YXppejQvUjZwRXB1bXpKZ1VZYURUb0cwMGZsWUpRL25CWkF6UDAzYzJMc2dkcVFLL0xITkFoZ05KWEtDREdrbklOdUFidDRVVkpqV2hoMFRoTGtXbVh2dCtJTXVySjVueWozZWM9In0%3D.UVzs7gZ%2BrfXZZL8gW%2FqYnGdR%2FRhYK60tIwLMl%2FVV9Po; _ga_SLJ4P1NJFR=GS2.1.s1749952602$o5$g1$t1749952603$j59$l0$h0; _rdt_uuid=1749901458275.527a32b3-5d84-4634-819f-75fb14841ed3; __hstc=69929231.e388db2bbd055574895fe623abc00acc.1749901457549.1749947958589.1749952606059.6; __hssc=69929231.1.1749952606059
```

## 💡 Usage Examples

### Basic Chat Request
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

### Code Generation Example
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
    {
      id: 'msg-1',
      role: 'user', 
      content: 'Create a React component'
    },
    {
      id: 'msg-2',
      role: 'assistant',
      content: 'Here\'s a React component...'
    },
    {
      id: 'msg-3',
      role: 'user',
      content: 'Now add TypeScript types to it'
    }
  ],
  projectId: '49956303',
  promptMode: 'discussion'
};
```

## 🔧 Configuration Options

### Request Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `messages` | Array | ✅ | - | Array of message objects |
| `projectId` | String | ✅ | - | bolt.new project identifier |
| `promptMode` | String | ✅ | - | Chat mode: "discussion" |
| `id` | String | ❌ | auto-generated | Unique request ID |
| `framework` | String | ❌ | "DEFAULT_TO_DEV" | Development framework |
| `isFirstPrompt` | Boolean | ❌ | false | First message in conversation |
| `featurePreviews` | Object | ❌ | `{diffs: false, reasoning: false}` | Feature flags |
| `metrics` | Object | ❌ | `{importFilesLength: 0, fileChangesLength: 0}` | Usage metrics |
| `stripeStatus` | String | ❌ | "not-configured" | Payment status |
| `supportIntegrations` | Boolean | ❌ | true | Enable integrations |
| `usesInspectedElement` | Boolean | ❌ | false | UI inspection mode |
| `errorReasoning` | String/null | ❌ | null | Error context |

### Message Object Structure

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | String | ✅ | Unique message identifier |
| `role` | String | ✅ | "user" or "assistant" |
| `content` | String | ✅ | Message content |

## ⚠️ Error Handling

### Common Error Responses

#### 401 Unauthorized
```javascript
{
  "success": false,
  "error": "missing_session",
  "message": "Session cookies required"
}
```

#### 404 Not Found
```javascript
{
  "success": false,
  "error": "not_found",
  "message": "Endpoint not found",
  "availableEndpoints": ["/api/chat", "/health"]
}
```

#### 500 Internal Server Error
```javascript
{
  "success": false,
  "error": "chat_error",
  "message": "Error description"
}
```

### Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Expired/invalid cookies | Re-extract cookies from bolt.new |
| 404 Not Found | Wrong endpoint URL | Verify correct service URL |
| 500 Server Error | Invalid request format | Check request body structure |
| No response | bolt.new rate limiting | Wait and retry after delay |

## 🛠️ Development Tools

### Cookie Extraction
Use the provided Tampermonkey script (`bolt-cookie-extractor.user.js`):
1. Install Tampermonkey browser extension
2. Install the cookie extractor script
3. Visit bolt.new and click "🍪 Extract Cookies"
4. Copy the extracted cookie string

### Testing Commands

#### Health Check
```bash
curl https://bolt2api-rf6frxmcca-ew.a.run.app/health
```

#### Chat Test
```bash
curl -X POST https://bolt2api-rf6frxmcca-ew.a.run.app/api/chat \
  -H "Content-Type: application/json" \
  -H "Cookie: YOUR_COOKIES_HERE" \
  -d '{
    "messages": [{"id": "test-1", "role": "user", "content": "Hello"}],
    "projectId": "49956303",
    "promptMode": "discussion"
  }'
```

## 📊 Performance & Limits

- **Response Time**: 4-12 seconds typical
- **Cookie Expiry**: ~24 hours
- **Rate Limiting**: Handled by bolt.new
- **Max Request Size**: 10MB
- **Timeout**: 30 seconds default

## 🔒 Security Notes

- Keep cookies private and secure
- Use HTTPS in production
- Rotate cookies regularly
- Monitor for unauthorized usage
- Never expose cookies in client-side code

---

**Last Updated**: 2025-06-27  
**Status**: ✅ Production Ready  
**Compatibility**: bolt.new Team Accounts
