#!/usr/bin/env node

/**
 * Test utility for bolt2api service
 * Tests both local and deployed endpoints
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  LOCAL_URL: 'http://localhost:8080',
  DEPLOYED_URL: 'https://bolt2api-rf6frxmcca-ew.a.run.app',
  COOKIES_FILE: path.join(__dirname, '..', 'sample-cookies.txt'),
  TIMEOUT: 30000
};

// Test scenarios
const TEST_SCENARIOS = [
  {
    name: "Simple React Component",
    message: "Create a simple React component that displays 'Hello World'"
  },
  {
    name: "JavaScript Function", 
    message: "Write a JavaScript function that returns the sum of two numbers"
  },
  {
    name: "CSS Styling",
    message: "Create CSS for a responsive navigation bar"
  }
];

/**
 * Load cookies from file
 */
function loadCookies() {
  try {
    if (!fs.existsSync(CONFIG.COOKIES_FILE)) {
      throw new Error(`Cookies file not found: ${CONFIG.COOKIES_FILE}`);
    }
    
    const cookies = fs.readFileSync(CONFIG.COOKIES_FILE, 'utf8').trim();
    if (!cookies) {
      throw new Error('Cookies file is empty');
    }
    
    console.log(`🍪 Loaded cookies (${cookies.length} characters)`);
    return cookies;
  } catch (error) {
    console.error('❌ Failed to load cookies:', error.message);
    process.exit(1);
  }
}

/**
 * Test health endpoint
 */
async function testHealth(baseUrl) {
  try {
    console.log(`🏥 Testing health endpoint: ${baseUrl}/health`);
    
    const response = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      timeout: 5000
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ Health check passed:', data.message);
    return true;
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return false;
  }
}

/**
 * Test chat endpoint
 */
async function testChat(baseUrl, cookies, scenario) {
  try {
    console.log(`💬 Testing chat: ${scenario.name}`);
    
    const requestBody = {
      messages: [{
        id: 'test-' + Date.now(),
        role: 'user',
        content: scenario.message
      }],
      projectId: '49956303',
      promptMode: 'discussion'
    };
    
    console.log('📤 Sending request...');
    const startTime = Date.now();
    
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      },
      body: JSON.stringify(requestBody),
      timeout: CONFIG.TIMEOUT
    });
    
    const responseTime = Date.now() - startTime;
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    
    console.log(`✅ Chat test passed (${responseTime}ms)`);
    console.log('📥 Response preview:', data.data.content.substring(0, 100) + '...');
    
    return {
      success: true,
      responseTime,
      contentLength: data.data.content.length
    };
    
  } catch (error) {
    console.error(`❌ Chat test failed: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Run comprehensive test suite
 */
async function runTests() {
  console.log('🧪 Starting bolt2api Test Suite\n');
  
  // Load cookies
  const cookies = loadCookies();
  
  // Test both local and deployed services
  const services = [
    { name: 'Local', url: CONFIG.LOCAL_URL },
    { name: 'Deployed', url: CONFIG.DEPLOYED_URL }
  ];
  
  const results = {};
  
  for (const service of services) {
    console.log(`\n🔍 Testing ${service.name} Service (${service.url})`);
    console.log('='.repeat(60));
    
    results[service.name] = {
      health: false,
      chat: []
    };
    
    // Test health endpoint
    results[service.name].health = await testHealth(service.url);
    
    if (!results[service.name].health) {
      console.log(`⚠️  Skipping chat tests for ${service.name} (health check failed)`);
      continue;
    }
    
    // Test chat scenarios
    for (const scenario of TEST_SCENARIOS) {
      const result = await testChat(service.url, cookies, scenario);
      results[service.name].chat.push({
        scenario: scenario.name,
        ...result
      });
      
      // Add delay between requests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // Print summary
  console.log('\n📊 Test Summary');
  console.log('='.repeat(60));
  
  for (const [serviceName, serviceResults] of Object.entries(results)) {
    console.log(`\n${serviceName} Service:`);
    console.log(`  Health: ${serviceResults.health ? '✅ Pass' : '❌ Fail'}`);
    
    const chatPassed = serviceResults.chat.filter(r => r.success).length;
    const chatTotal = serviceResults.chat.length;
    console.log(`  Chat Tests: ${chatPassed}/${chatTotal} passed`);
    
    if (chatPassed > 0) {
      const avgResponseTime = serviceResults.chat
        .filter(r => r.success)
        .reduce((sum, r) => sum + r.responseTime, 0) / chatPassed;
      console.log(`  Avg Response Time: ${Math.round(avgResponseTime)}ms`);
    }
  }
  
  console.log('\n🎉 Test suite completed!');
}

/**
 * Main execution
 */
if (require.main === module) {
  runTests().catch(error => {
    console.error('💥 Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = {
  testHealth,
  testChat,
  runTests,
  CONFIG
};
