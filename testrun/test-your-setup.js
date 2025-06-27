#!/usr/bin/env node

/**
 * Bolt2API Setup Verification Script
 * 
 * This script helps you verify that your bolt.new API setup is working correctly.
 * 
 * Usage:
 * 1. Extract your cookies using the Tampermonkey script
 * 2. Replace 'YOUR_COOKIES_HERE' with your actual cookies
 * 3. Run: node test-your-setup.js
 */

const https = require('https');

// Configuration
const CONFIG = {
  apiUrl: 'https://bolt2api-rf6frxmcca-ew.a.run.app',
  healthEndpoint: '/health',
  chatEndpoint: '/api/chat',
  timeout: 30000 // 30 seconds
};

// Replace this with your actual cookies from the Tampermonkey script
const YOUR_COOKIES = 'YOUR_COOKIES_HERE';

// Test scenarios
const TEST_SCENARIOS = [
  {
    name: 'Simple Greeting',
    message: 'Hello! Can you help me with a coding question?'
  },
  {
    name: 'JavaScript Function',
    message: 'Write a JavaScript function that reverses a string'
  },
  {
    name: 'React Component',
    message: 'Create a simple React button component'
  }
];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

// Make HTTP request
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', reject);
    req.setTimeout(CONFIG.timeout, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

// Test health endpoint
async function testHealth() {
  console.log(colorize('\n🏥 Testing Health Endpoint...', 'cyan'));
  
  try {
    const response = await makeRequest(`${CONFIG.apiUrl}${CONFIG.healthEndpoint}`, {
      method: 'GET'
    });

    if (response.status === 200) {
      const data = JSON.parse(response.data);
      console.log(colorize('✅ Health Check: PASSED', 'green'));
      console.log(`   Status: ${response.status}`);
      console.log(`   Message: ${data.message}`);
      console.log(`   Version: ${data.version}`);
      return true;
    } else {
      console.log(colorize('❌ Health Check: FAILED', 'red'));
      console.log(`   Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(colorize('❌ Health Check: ERROR', 'red'));
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

// Test cookie validation
async function testCookies() {
  console.log(colorize('\n🍪 Testing Cookie Authentication...', 'cyan'));
  
  if (YOUR_COOKIES === 'YOUR_COOKIES_HERE') {
    console.log(colorize('❌ Cookie Test: SKIPPED', 'yellow'));
    console.log('   Please replace YOUR_COOKIES_HERE with your actual cookies');
    return false;
  }

  const testPayload = {
    id: 'test-' + Date.now(),
    messages: [{
      id: 'msg-' + Date.now(),
      role: 'user',
      content: 'Hello, this is a test message'
    }],
    projectId: '49956303',
    promptMode: 'discussion',
    framework: 'DEFAULT_TO_DEV',
    isFirstPrompt: false,
    featurePreviews: { diffs: false, reasoning: false },
    metrics: { importFilesLength: 0, fileChangesLength: 0 },
    stripeStatus: 'not-configured',
    supportIntegrations: true,
    usesInspectedElement: false
  };

  try {
    const response = await makeRequest(`${CONFIG.apiUrl}${CONFIG.chatEndpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': YOUR_COOKIES
      },
      body: JSON.stringify(testPayload)
    });

    if (response.status === 200) {
      console.log(colorize('✅ Cookie Authentication: PASSED', 'green'));
      console.log(`   Status: ${response.status}`);
      console.log(`   Cookie Length: ${YOUR_COOKIES.length} characters`);
      return true;
    } else if (response.status === 401) {
      console.log(colorize('❌ Cookie Authentication: FAILED', 'red'));
      console.log('   Status: 401 Unauthorized');
      console.log('   Solution: Re-extract cookies from bolt.new');
      return false;
    } else {
      console.log(colorize('❌ Cookie Authentication: FAILED', 'red'));
      console.log(`   Status: ${response.status}`);
      console.log(`   Response: ${response.data.substring(0, 200)}...`);
      return false;
    }
  } catch (error) {
    console.log(colorize('❌ Cookie Authentication: ERROR', 'red'));
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

// Test chat functionality
async function testChat(scenario, index) {
  console.log(colorize(`\n💬 Testing Chat ${index + 1}/3: ${scenario.name}`, 'cyan'));
  
  const testPayload = {
    id: `test-${index}-${Date.now()}`,
    messages: [{
      id: `msg-${index}-${Date.now()}`,
      role: 'user',
      content: scenario.message
    }],
    projectId: '49956303',
    promptMode: 'discussion',
    framework: 'DEFAULT_TO_DEV',
    isFirstPrompt: false,
    featurePreviews: { diffs: false, reasoning: false },
    metrics: { importFilesLength: 0, fileChangesLength: 0 },
    stripeStatus: 'not-configured',
    supportIntegrations: true,
    usesInspectedElement: false
  };

  const startTime = Date.now();

  try {
    const response = await makeRequest(`${CONFIG.apiUrl}${CONFIG.chatEndpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': YOUR_COOKIES,
        'X-Bolt-Client-Revision': 'd65f6d0',
        'X-Bolt-Project-Id': '49956303'
      },
      body: JSON.stringify(testPayload)
    });

    const responseTime = Date.now() - startTime;

    if (response.status === 200) {
      const data = JSON.parse(response.data);
      console.log(colorize(`✅ Chat Test ${index + 1}: PASSED`, 'green'));
      console.log(`   Status: ${response.status}`);
      console.log(`   Response Time: ${responseTime}ms`);
      console.log(`   Success: ${data.success}`);
      
      if (data.data && data.data.content) {
        const preview = data.data.content.substring(0, 100).replace(/\n/g, ' ');
        console.log(`   Preview: ${preview}...`);
      }
      
      return true;
    } else {
      console.log(colorize(`❌ Chat Test ${index + 1}: FAILED`, 'red'));
      console.log(`   Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(colorize(`❌ Chat Test ${index + 1}: ERROR`, 'red'));
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log(colorize('🧪 Bolt2API Setup Verification', 'bright'));
  console.log(colorize('=====================================', 'bright'));
  
  const results = {
    health: false,
    cookies: false,
    chat: []
  };

  // Test 1: Health Check
  results.health = await testHealth();
  
  if (!results.health) {
    console.log(colorize('\n❌ Health check failed. Service may be down.', 'red'));
    process.exit(1);
  }

  // Test 2: Cookie Authentication
  results.cookies = await testCookies();
  
  if (!results.cookies) {
    console.log(colorize('\n❌ Cookie authentication failed. Please check your cookies.', 'red'));
    console.log(colorize('\n📋 Instructions:', 'yellow'));
    console.log('1. Visit https://bolt.new and log in');
    console.log('2. Use the Tampermonkey script to extract cookies');
    console.log('3. Replace YOUR_COOKIES_HERE in this script');
    console.log('4. Run the test again');
    process.exit(1);
  }

  // Test 3: Chat Functionality
  console.log(colorize('\n💬 Testing Chat Functionality...', 'cyan'));
  
  for (let i = 0; i < TEST_SCENARIOS.length; i++) {
    const success = await testChat(TEST_SCENARIOS[i], i);
    results.chat.push(success);
    
    // Wait between tests to avoid rate limiting
    if (i < TEST_SCENARIOS.length - 1) {
      console.log(colorize('   ⏳ Waiting 3 seconds...', 'yellow'));
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  // Final Results
  console.log(colorize('\n📊 Test Results Summary', 'bright'));
  console.log(colorize('========================', 'bright'));
  
  const chatPassed = results.chat.filter(Boolean).length;
  const chatTotal = results.chat.length;
  
  console.log(`🏥 Health Check: ${results.health ? colorize('PASSED', 'green') : colorize('FAILED', 'red')}`);
  console.log(`🍪 Authentication: ${results.cookies ? colorize('PASSED', 'green') : colorize('FAILED', 'red')}`);
  console.log(`💬 Chat Tests: ${colorize(`${chatPassed}/${chatTotal} PASSED`, chatPassed === chatTotal ? 'green' : 'yellow')}`);
  
  if (results.health && results.cookies && chatPassed === chatTotal) {
    console.log(colorize('\n🎉 All tests passed! Your setup is working correctly.', 'green'));
    console.log(colorize('\n📚 Next steps:', 'cyan'));
    console.log('• Read USAGE_GUIDE.md for detailed usage examples');
    console.log('• Integrate the API into your applications');
    console.log('• Monitor cookie expiry and re-extract when needed');
  } else {
    console.log(colorize('\n⚠️  Some tests failed. Please check the errors above.', 'yellow'));
  }
}

// Run the tests
if (require.main === module) {
  runTests().catch(error => {
    console.error(colorize('\n💥 Unexpected error:', 'red'), error);
    process.exit(1);
  });
}

module.exports = { runTests, testHealth, testCookies, testChat };
