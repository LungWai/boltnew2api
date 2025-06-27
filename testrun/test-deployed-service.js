const fs = require('fs');

const SERVICE_URL = 'https://bolt2api-corrected-rf6frxmcca-ew.a.run.app';

// Test the deployed bolt2api service
async function testDeployedService() {
  console.log('🧪 Testing deployed bolt2api service...');
  console.log('🌐 Service URL:', SERVICE_URL);
  
  // Test 1: Health endpoint
  console.log('\n📊 Testing health endpoint...');
  try {
    const healthResponse = await fetch(`${SERVICE_URL}/health`);
    console.log('Health status:', healthResponse.status);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Health check passed:', JSON.stringify(healthData, null, 2));
    } else {
      const errorText = await healthResponse.text();
      console.log('❌ Health check failed:', errorText);
    }
  } catch (error) {
    console.error('🚨 Health check error:', error.message);
  }
  
  // Test 2: Chat endpoint with corrected payload
  console.log('\n💬 Testing chat endpoint...');
  try {
    // Load test payload and cookies
    const testPayload = JSON.parse(fs.readFileSync('./test-team-chat-corrected.json', 'utf8'));
    const cookies = fs.readFileSync('./sample-cookies.txt', 'utf8').trim();
    
    console.log('📋 Using payload:', JSON.stringify(testPayload, null, 2));
    console.log('🍪 Using cookies (length):', cookies.length);
    
    const chatResponse = await fetch(`${SERVICE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      },
      body: JSON.stringify(testPayload)
    });
    
    console.log('Chat response status:', chatResponse.status);
    
    if (chatResponse.ok) {
      const chatData = await chatResponse.json();
      console.log('✅ Chat request successful:', JSON.stringify(chatData, null, 2));
    } else {
      const errorText = await chatResponse.text();
      console.log('❌ Chat request failed:', errorText);
    }
    
  } catch (error) {
    console.error('🚨 Chat test error:', error.message);
  }
  
  console.log('\n🏁 Testing completed!');
}

// Run the tests
testDeployedService().catch(console.error);
