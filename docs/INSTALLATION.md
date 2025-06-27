# Bolt2API Installation Guide

Quick setup guide for using the bolt.new API wrapper.

## 🚀 Quick Setup (5 minutes)

### 1. Install Tampermonkey Extension

Choose your browser and install Tampermonkey:

| Browser | Installation Link |
|---------|------------------|
| **Chrome** | [Install from Chrome Web Store](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) |
| **Firefox** | [Install from Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/) |
| **Safari** | [Install from App Store](https://apps.apple.com/us/app/tampermonkey/id1482490089) |
| **Edge** | [Install from Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd) |

### 2. Install Cookie Extractor Script

1. **Open Tampermonkey Dashboard**
   - Click the Tampermonkey icon in your browser
   - Select "Dashboard"

2. **Create New Script**
   - Click the "+" tab or "Create a new script"
   - Delete the default template

3. **Install the Script**
   - Copy the entire contents of `bolt-cookie-extractor.user.js`
   - Paste into the Tampermonkey editor
   - Press `Ctrl+S` (or `Cmd+S` on Mac) to save

4. **Verify Installation**
   - You should see "Bolt.new Cookie Extractor" in your scripts list
   - Make sure it's enabled (green dot)

### 3. Extract Your Cookies

1. **Visit bolt.new**
   - Go to [https://bolt.new](https://bolt.new)
   - **Important**: Make sure you're logged in to your bolt.new account

2. **Extract Cookies**
   - Look for the green "🍪 Extract Cookies" button in the top-right corner
   - Click the button to open the extraction modal

3. **Copy Cookie String**
   - Click "📋 Copy to Clipboard" in the modal
   - Your cookies are now ready to use!

### 4. Test Your Setup

Test with curl:
```bash
curl -X POST https://bolt2api-rf6frxmcca-ew.a.run.app/api/chat \
  -H "Content-Type: application/json" \
  -H "Cookie: YOUR_COOKIES_HERE" \
  -d '{
    "messages": [{"id": "test-1", "role": "user", "content": "Hello, create a simple React component"}],
    "projectId": "49956303",
    "promptMode": "discussion"
  }'
```

Or test with JavaScript:
```javascript
const response = await fetch('https://bolt2api-rf6frxmcca-ew.a.run.app/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Cookie': 'YOUR_COOKIES_HERE'
  },
  body: JSON.stringify({
    messages: [{
      id: 'test-' + Date.now(),
      role: 'user',
      content: 'Create a Python function to sort a list'
    }],
    projectId: '49956303',
    promptMode: 'discussion'
  })
});

const data = await response.json();
console.log(data);
```

## ✅ Verification Checklist

- [ ] Tampermonkey extension installed
- [ ] Cookie extractor script installed and enabled
- [ ] Logged into bolt.new
- [ ] Green cookie button visible on bolt.new
- [ ] Cookies extracted successfully (✅ Valid status)
- [ ] Test request returns 200 status
- [ ] Received AI response from bolt.new

## 🔧 Troubleshooting

### Cookie Extractor Button Not Visible
- **Solution**: Refresh the bolt.new page
- **Check**: Make sure Tampermonkey is enabled
- **Verify**: Script is installed and active in Tampermonkey dashboard

### Invalid Cookies (❌ Status)
- **Cause**: Not logged into bolt.new
- **Solution**: Log into your bolt.new account first
- **Check**: Try making a chat request on bolt.new to verify login

### 401 Unauthorized Error
- **Cause**: Cookies expired or invalid
- **Solution**: Re-extract cookies from bolt.new
- **Note**: Cookies typically expire after 24 hours

### 404 Not Found Error
- **Cause**: Wrong API endpoint
- **Check**: Verify you're using `https://bolt2api-rf6frxmcca-ew.a.run.app/api/chat`

### No Response or Timeout
- **Cause**: bolt.new may be slow or rate limiting
- **Solution**: Wait 10-15 seconds for response
- **Retry**: Try again after a few minutes

## 📋 Quick Reference

### API Endpoint
```
POST https://bolt2api-rf6frxmcca-ew.a.run.app/api/chat
```

### Required Headers
```
Content-Type: application/json
Cookie: your_bolt_cookies_here
```

### Minimal Request Body
```json
{
  "messages": [{"id": "msg-1", "role": "user", "content": "Your question"}],
  "projectId": "49956303",
  "promptMode": "discussion"
}
```

### Health Check
```
GET https://bolt2api-rf6frxmcca-ew.a.run.app/health
```

## 🎯 Next Steps

1. **Read the Full Guide**: Check `USAGE_GUIDE.md` for detailed usage examples
2. **Integrate into Your App**: Use the API in your applications
3. **Monitor Cookie Expiry**: Re-extract cookies when they expire
4. **Explore Features**: Try different prompt modes and request options

## 🆘 Need Help?

If you encounter issues:

1. **Check Service Status**: Visit the health check endpoint
2. **Verify Cookies**: Use the extractor to check cookie validity
3. **Test with curl**: Isolate issues with simple curl commands
4. **Check Browser Console**: Look for JavaScript errors
5. **Review Logs**: Check Tampermonkey console for script errors

---

**🎉 You're all set!** Your bolt.new API wrapper is ready to use.
