const fs = require('fs');

// Test the full chat functionality with the Cloud Run proxy
async function testChatFunctionality() {
  console.log('🧪 Testing Chat Functionality...\n');
  
  // Read cookies
  const cookies = fs.readFileSync('./sample-cookies.txt', 'utf8').trim();
  console.log('🍪 Cookie length:', cookies.length);
  
  // Test with a simple programming question
  const testPayload = {
    id: "chat-test-" + Date.now(),
    errorReasoning: null,
    featurePreviews: { diffs: false, reasoning: false },
    framework: "DEFAULT_TO_DEV",
    isFirstPrompt: false,
    messages: [
      { 
        id: "test-msg-" + Date.now(), 
        role: "user", 
        content: "Create a simple React component that displays 'Hello World'" 
      }
    ],
    metrics: { importFilesLength: 0, fileChangesLength: 0 },
    projectId: "49956303",
    promptMode: "discussion",
    stripeStatus: "not-configured",
    supportIntegrations: true,
    usesInspectedElement: false
  };
  
  console.log('📋 Test message: "Create a simple React component that displays \'Hello World\'"');
  console.log('🌐 Testing Cloud Run proxy...\n');
  
  try {
    const startTime = Date.now();
    
    const response = await fetch('https://bolt2api-rf6frxmcca-ew.a.run.app/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies,
        'X-Bolt-Client-Revision': 'd65f6d0',
        'X-Bolt-Project-Id': '49956303'
      },
      body: JSON.stringify(testPayload)
    });
    
    const responseTime = Date.now() - startTime;
    console.log('📊 Response Status:', response.status);
    console.log('⏱️ Response Time:', responseTime + 'ms');
    
    if (response.status === 200) {
      console.log('✅ Chat request SUCCESSFUL!\n');
      
      const data = await response.json();
      console.log('📦 Response Structure:');
      console.log('- success:', data.success);
      console.log('- timestamp:', data.timestamp);
      console.log('- data type:', typeof data.data);
      
      if (data.data && data.data.content) {
        console.log('\n💬 Chat Response Preview:');
        const preview = data.data.content.substring(0, 200);
        console.log(preview + (data.data.content.length > 200 ? '...' : ''));
      } else if (data.data && data.data.type === 'stream') {
        console.log('\n💬 Streaming Response Preview:');
        const preview = data.data.content.substring(0, 200);
        console.log(preview + (data.data.content.length > 200 ? '...' : ''));
      } else {
        console.log('\n📋 Full Response Data:');
        console.log(JSON.stringify(data.data, null, 2));
      }
      
      console.log('\n🎉 SUCCESS: The proxy is working correctly!');
      console.log('✅ You can now send messages to Cloud Run and get responses from bolt.new');
      
    } else {
      console.log('❌ Chat request FAILED');
      const errorText = await response.text();
      console.log('Error:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
  
  console.log('\n🏁 Chat functionality test completed!');
  console.log('\n📝 Usage Instructions:');
  console.log('Send POST requests to: https://bolt2api-rf6frxmcca-ew.a.run.app/api/chat');
  console.log('Include your bolt.new cookies in the Cookie header');
  console.log('Use the payload structure shown in SUCCESSFUL_REQUEST_FORMAT.md');
}

// Run the test
testChatFunctionality().catch(console.error);
