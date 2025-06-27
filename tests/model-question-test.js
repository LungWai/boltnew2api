#!/usr/bin/env node

/**
 * Test script for bolt2api using the specific question:
 * "What is your model and who do you based"
 * 
 * This test verifies that the API can handle questions about the AI model
 * and returns appropriate responses from bolt.new's AI.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  LOCAL_URL: 'http://localhost:8080',
  DEPLOYED_URL: 'https://bolt2api-rf6frxmcca-ew.a.run.app',
  COOKIES_FILE: path.join(__dirname, '..', 'sample-cookies.txt'),
  TIMEOUT: 30000,
  TEST_QUESTION: "What is your model and who do you based"
};

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
    console.log('💡 Make sure you have extracted cookies using the Tampermonkey script');
    process.exit(1);
  }
}

/**
 * Test the model question against a specific endpoint
 */
async function testModelQuestion(baseUrl, cookies) {
  try {
    console.log(`\n🤖 Testing model question against: ${baseUrl}`);
    console.log(`❓ Question: "${CONFIG.TEST_QUESTION}"`);
    
    const requestBody = {
      messages: [{
        id: 'model-test-' + Date.now(),
        role: 'user',
        content: CONFIG.TEST_QUESTION
      }],
      projectId: '49956303',
      promptMode: 'discussion',
      framework: 'DEFAULT_TO_DEV',
      isFirstPrompt: false
    };
    
    console.log('📤 Sending request...');
    const startTime = Date.now();
    
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies,
        'User-Agent': 'bolt2api-test/1.0'
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(CONFIG.TIMEOUT)
    });
    
    const responseTime = Date.now() - startTime;
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    
    console.log(`✅ Request successful (${responseTime}ms)`);
    console.log(`📊 Response status: ${response.status}`);
    console.log(`📏 Content length: ${data.data.content.length} characters`);
    
    // Extract and display the AI response
    let aiResponse = data.data.content;
    
    // Parse streaming format if present (starts with "0:")
    if (aiResponse.startsWith('0:"')) {
      try {
        // Remove the streaming prefix and parse
        const jsonPart = aiResponse.substring(2);
        const endQuote = jsonPart.lastIndexOf('"');
        if (endQuote > 0) {
          aiResponse = jsonPart.substring(0, endQuote);
          // Unescape JSON string
          aiResponse = aiResponse.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        }
      } catch (parseError) {
        console.log('⚠️  Could not parse streaming format, showing raw response');
      }
    }
    
    console.log('\n📝 AI Response:');
    console.log('=' .repeat(60));
    console.log(aiResponse.substring(0, 500) + (aiResponse.length > 500 ? '\n... (truncated)' : ''));
    console.log('=' .repeat(60));
    
    // Analyze the response
    const responseAnalysis = analyzeResponse(aiResponse);
    console.log('\n🔍 Response Analysis:');
    console.log(`   Contains model info: ${responseAnalysis.hasModelInfo ? '✅' : '❌'}`);
    console.log(`   Mentions AI/model: ${responseAnalysis.mentionsAI ? '✅' : '❌'}`);
    console.log(`   Response length: ${responseAnalysis.length} characters`);
    console.log(`   Estimated quality: ${responseAnalysis.quality}`);
    
    return {
      success: true,
      responseTime,
      contentLength: aiResponse.length,
      analysis: responseAnalysis,
      rawResponse: data.data.content
    };
    
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
    
    if (error.name === 'AbortError') {
      console.log('⏰ Request timed out - this might be normal for complex questions');
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Analyze the AI response for relevant content
 */
function analyzeResponse(response) {
  const lowerResponse = response.toLowerCase();
  
  const modelKeywords = ['model', 'claude', 'gpt', 'ai', 'artificial intelligence', 'language model', 'llm'];
  const companyKeywords = ['anthropic', 'openai', 'google', 'meta', 'microsoft', 'based on', 'created by', 'developed by'];
  
  const hasModelInfo = modelKeywords.some(keyword => lowerResponse.includes(keyword));
  const mentionsAI = lowerResponse.includes('ai') || lowerResponse.includes('artificial intelligence');
  const mentionsCompany = companyKeywords.some(keyword => lowerResponse.includes(keyword));
  
  let quality = 'Unknown';
  if (response.length > 200 && hasModelInfo) {
    quality = 'High';
  } else if (response.length > 100 && (hasModelInfo || mentionsAI)) {
    quality = 'Medium';
  } else if (response.length > 50) {
    quality = 'Low';
  } else {
    quality = 'Very Low';
  }
  
  return {
    hasModelInfo,
    mentionsAI,
    mentionsCompany,
    length: response.length,
    quality
  };
}

/**
 * Test health endpoint first
 */
async function testHealth(baseUrl) {
  try {
    console.log(`🏥 Testing health endpoint: ${baseUrl}/health`);
    
    const response = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`✅ Health check passed: ${data.message}`);
    return true;
  } catch (error) {
    console.error(`❌ Health check failed: ${error.message}`);
    return false;
  }
}

/**
 * Main test execution
 */
async function runModelQuestionTest() {
  console.log('🧪 Starting Model Question Test');
  console.log('=' .repeat(60));
  console.log(`❓ Test Question: "${CONFIG.TEST_QUESTION}"`);
  console.log('=' .repeat(60));
  
  // Load cookies
  const cookies = loadCookies();
  
  // Test endpoints
  const endpoints = [
    { name: 'Local', url: CONFIG.LOCAL_URL },
    { name: 'Deployed', url: CONFIG.DEPLOYED_URL }
  ];
  
  const results = {};
  
  for (const endpoint of endpoints) {
    console.log(`\n🔍 Testing ${endpoint.name} Service`);
    console.log('-' .repeat(40));
    
    // Test health first
    const healthOk = await testHealth(endpoint.url);
    
    if (!healthOk) {
      console.log(`⚠️  Skipping ${endpoint.name} service (health check failed)`);
      results[endpoint.name] = { health: false, test: null };
      continue;
    }
    
    // Test the model question
    const testResult = await testModelQuestion(endpoint.url, cookies);
    results[endpoint.name] = { health: true, test: testResult };
    
    // Add delay between tests
    if (endpoints.indexOf(endpoint) < endpoints.length - 1) {
      console.log('\n⏳ Waiting 3 seconds before next test...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  // Print final summary
  console.log('\n📊 Test Summary');
  console.log('=' .repeat(60));
  
  for (const [serviceName, result] of Object.entries(results)) {
    console.log(`\n${serviceName} Service:`);
    console.log(`  Health: ${result.health ? '✅ Pass' : '❌ Fail'}`);
    
    if (result.test) {
      console.log(`  Model Question: ${result.test.success ? '✅ Pass' : '❌ Fail'}`);
      
      if (result.test.success) {
        console.log(`  Response Time: ${result.test.responseTime}ms`);
        console.log(`  Content Length: ${result.test.contentLength} chars`);
        console.log(`  Quality: ${result.test.analysis.quality}`);
        console.log(`  Has Model Info: ${result.test.analysis.hasModelInfo ? '✅' : '❌'}`);
      } else {
        console.log(`  Error: ${result.test.error}`);
      }
    } else {
      console.log(`  Model Question: ⏭️  Skipped`);
    }
  }
  
  console.log('\n🎉 Model question test completed!');
  
  // Save results to file
  const resultsFile = path.join(__dirname, '..', 'testrun', `model-question-test-${Date.now()}.json`);
  try {
    fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
    console.log(`💾 Results saved to: ${resultsFile}`);
  } catch (error) {
    console.log(`⚠️  Could not save results: ${error.message}`);
  }
}

/**
 * Main execution
 */
if (require.main === module) {
  runModelQuestionTest().catch(error => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });
}

module.exports = {
  testModelQuestion,
  analyzeResponse,
  CONFIG
};
