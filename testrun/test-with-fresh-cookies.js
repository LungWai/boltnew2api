const fs = require('fs');

// Test with fresh cookies - update sample-cookies.txt first
async function testWithFreshCookies() {
  console.log('🧪 Testing with Fresh Cookies...\n');
  
  // Read cookies
  const cookies = fs.readFileSync('./sample-cookies.txt', 'utf8').trim();
  console.log('🍪 Cookie length:', cookies.length);
  
  // Test payload
  const testPayload = {
    id: "fresh-test-" + Date.now(),
    errorReasoning: null,
    featurePreviews: { diffs: false, reasoning: false },
    framework: "DEFAULT_TO_DEV",
    isFirstPrompt: false,
    messages: [
      { id: "test-msg", role: "user", content: "Hello, can you help me create a simple React component?" }
    ],
    metrics: { importFilesLength: 0, fileChangesLength: 0 },
    projectId: "49956303",
    promptMode: "discussion",
    stripeStatus: "not-configured",
    supportIntegrations: true,
    usesInspectedElement: false
  };
  
  console.log('📋 Test payload ready\n');
  
  // Test 1: Direct bolt.new
  console.log('🌐 Test 1: Direct bolt.new authentication');
  try {
    const directResponse = await fetch('https://bolt.new/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies,
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Origin': 'https://bolt.new',
        'Referer': 'https://bolt.new/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
      },
      body: JSON.stringify(testPayload)
    });
    
    console.log('Status:', directResponse.status);
    
    if (directResponse.status === 200) {
      console.log('✅ Direct authentication SUCCESSFUL!');
      const data = await directResponse.json();
      console.log('Response type:', typeof data);
      console.log('Response keys:', Object.keys(data));
    } else {
      console.log('❌ Direct authentication FAILED');
      const errorText = await directResponse.text();
      console.log('Error:', errorText);
    }
  } catch (error) {
    console.error('❌ Direct test error:', error.message);
  }
  
  console.log('\n---\n');
  
  // Test 2: Proxy
  console.log('🔄 Test 2: Proxy authentication');
  try {
    const proxyResponse = await fetch('https://bolt2api-rf6frxmcca-ew.a.run.app/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      },
      body: JSON.stringify(testPayload)
    });
    
    console.log('Status:', proxyResponse.status);
    
    if (proxyResponse.status === 200) {
      console.log('✅ Proxy authentication SUCCESSFUL!');
      const data = await proxyResponse.json();
      console.log('Response type:', typeof data);
      if (data.success) {
        console.log('✅ Proxy wrapper working correctly');
      }
    } else {
      console.log('❌ Proxy authentication FAILED');
      const errorText = await proxyResponse.text();
      console.log('Error:', errorText);
    }
  } catch (error) {
    console.error('❌ Proxy test error:', error.message);
  }
  
  console.log('\n---\n');
  
  // Test 3: Proxy with additional headers (if needed)
  console.log('🔧 Test 3: Proxy with additional auth headers');
  try {
    const proxyWithHeadersResponse = await fetch('https://bolt2api-rf6frxmcca-ew.a.run.app/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies,
        // Add these if your browser request includes them:
        // 'x-csrf-token': 'your-csrf-token',
        // 'x-bolt-client-revision': 'd65f6d0',
        // 'x-bolt-project-id': '49956303'
      },
      body: JSON.stringify(testPayload)
    });
    
    console.log('Status:', proxyWithHeadersResponse.status);
    
    if (proxyWithHeadersResponse.status === 200) {
      console.log('✅ Proxy with headers SUCCESSFUL!');
    } else {
      console.log('❌ Proxy with headers FAILED');
      const errorText = await proxyWithHeadersResponse.text();
      console.log('Error:', errorText);
    }
  } catch (error) {
    console.error('❌ Proxy with headers test error:', error.message);
  }
  
  console.log('\n🏁 Testing completed!');
  console.log('\n📝 Instructions:');
  console.log('1. If all tests fail with 401: Update sample-cookies.txt with fresh cookies');
  console.log('2. If direct test passes but proxy fails: Check proxy logs');
  console.log('3. If you need CSRF token: Add it to Test 3 headers');
  console.log('\n🔧 To get fresh cookies:');
  console.log('1. Open bolt.new in browser');
  console.log('2. Open DevTools → Network');
  console.log('3. Make a chat request');
  console.log('4. Copy Cookie header from /api/chat request');
  console.log('5. Update sample-cookies.txt');
}

// Run tests
testWithFreshCookies().catch(console.error);
