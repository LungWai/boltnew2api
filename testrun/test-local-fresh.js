const fs = require('fs');

// Test with fresh cookies against local server
async function testLocalWithFreshCookies() {
  console.log('🧪 Testing Local Server with Fresh Cookies...\n');
  
  // Read cookies
  const cookies = fs.readFileSync('./sample-cookies.txt', 'utf8').trim();
  console.log('🍪 Cookie length:', cookies.length);
  
  // Test payload with exact structure from browser
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
  
  // Test 1: Direct bolt.new with exact headers
  console.log('🌐 Test 1: Direct bolt.new authentication');
  try {
    const directResponse = await fetch('https://bolt.new/api/chat', {
      method: 'POST',
      headers: {
        'Accept': '*/*',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Accept-Language': 'en-US,en;q=0.9',
        'Content-Type': 'application/json',
        'Cookie': cookies,
        'Origin': 'https://bolt.new',
        'Priority': 'u=1, i',
        'Referer': 'https://bolt.new/~/sb1-sum3bqy5',
        'Sec-Ch-Ua': '"Google Chrome";v="137", "Not/A)Brand";v="24"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
        'X-Bolt-Client-Revision': 'd65f6d0',
        'X-Bolt-Project-Id': '49956303'
      },
      body: JSON.stringify(testPayload)
    });
    
    console.log('Status:', directResponse.status);
    console.log('Content-Type:', directResponse.headers.get('content-type'));
    
    if (directResponse.status === 200) {
      console.log('✅ Direct authentication SUCCESSFUL!');
      
      // Handle different response types
      const contentType = directResponse.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await directResponse.json();
        console.log('📄 JSON Response received');
        console.log('Response keys:', Object.keys(data));
      } else {
        const text = await directResponse.text();
        console.log('📄 Text/Stream Response received');
        console.log('Response preview:', text.substring(0, 200) + '...');
      }
    } else {
      console.log('❌ Direct authentication FAILED');
      const errorText = await directResponse.text();
      console.log('Error:', errorText);
    }
  } catch (error) {
    console.error('❌ Direct test error:', error.message);
  }
  
  console.log('\n---\n');
  
  // Test 2: Local proxy
  console.log('🔄 Test 2: Local proxy authentication');
  try {
    const proxyResponse = await fetch('http://localhost:8080/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies,
        'X-Bolt-Client-Revision': 'd65f6d0',
        'X-Bolt-Project-Id': '49956303'
      },
      body: JSON.stringify(testPayload)
    });
    
    console.log('Status:', proxyResponse.status);
    
    if (proxyResponse.status === 200) {
      console.log('✅ Local proxy SUCCESSFUL!');
      const data = await proxyResponse.json();
      console.log('Response type:', typeof data);
      if (data.success) {
        console.log('✅ Proxy wrapper working correctly');
        console.log('Data type:', data.data?.type || 'unknown');
      }
    } else {
      console.log('❌ Local proxy FAILED');
      const errorText = await proxyResponse.text();
      console.log('Error:', errorText);
    }
  } catch (error) {
    console.error('❌ Local proxy test error:', error.message);
  }
  
  console.log('\n🏁 Testing completed!');
}

// Run tests
testLocalWithFreshCookies().catch(console.error);
