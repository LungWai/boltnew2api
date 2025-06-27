#!/usr/bin/env node

/**
 * Quick test for the model question: "What is your model and who do you based"
 * This is a simplified version for quick testing
 */

const fs = require('fs');

async function quickModelTest() {
  console.log('🤖 Quick Model Question Test');
  console.log('=' .repeat(50));
  
  // Load cookies
  let cookies;
  try {
    cookies = fs.readFileSync('./sample-cookies.txt', 'utf8').trim();
    console.log(`🍪 Loaded cookies (${cookies.length} chars)`);
  } catch (error) {
    console.error('❌ Could not load cookies from sample-cookies.txt');
    console.log('💡 Make sure you have extracted cookies using the Tampermonkey script');
    process.exit(1);
  }
  
  // Test question
  const question = "What is your model and who do you based";
  console.log(`❓ Question: "${question}"`);
  
  // Prepare request
  const requestBody = {
    messages: [{
      id: 'quick-test-' + Date.now(),
      role: 'user',
      content: question
    }],
    projectId: '49956303',
    promptMode: 'discussion'
  };
  
  // Test Cloud Run service
  console.log('\n🔍 Testing Cloud Run service (https://bolt2api-rf6frxmcca-ew.a.run.app)...');

  try {
    const response = await fetch('https://bolt2api-rf6frxmcca-ew.a.run.app/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(30000)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    
    const data = await response.json();
    console.log('✅ Request successful!');
    
    // Extract AI response
    let aiResponse = data.data.content;
    
    // Parse streaming format if present
    if (aiResponse.startsWith('0:"')) {
      try {
        const jsonPart = aiResponse.substring(2);
        const endQuote = jsonPart.lastIndexOf('"');
        if (endQuote > 0) {
          aiResponse = jsonPart.substring(0, endQuote);
          aiResponse = aiResponse.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        }
      } catch (e) {
        console.log('⚠️  Using raw response format');
      }
    }
    
    console.log('\n📝 AI Response:');
    console.log('-' .repeat(50));
    console.log(aiResponse);
    console.log('-' .repeat(50));
    
    // Quick analysis
    const lowerResponse = aiResponse.toLowerCase();
    const hasModelInfo = lowerResponse.includes('model') || lowerResponse.includes('claude') || lowerResponse.includes('gpt');
    const mentionsAI = lowerResponse.includes('ai') || lowerResponse.includes('artificial intelligence');
    
    console.log('\n🔍 Quick Analysis:');
    console.log(`   Response length: ${aiResponse.length} characters`);
    console.log(`   Contains model info: ${hasModelInfo ? '✅ Yes' : '❌ No'}`);
    console.log(`   Mentions AI: ${mentionsAI ? '✅ Yes' : '❌ No'}`);
    
    if (hasModelInfo || mentionsAI) {
      console.log('🎉 Test PASSED - Got relevant response about AI model!');
    } else {
      console.log('⚠️  Test PARTIAL - Response may not be about AI model');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('💡 Cloud Run service may be down or unreachable');
    } else if (error.message.includes('401')) {
      console.log('💡 Cookie issue - try re-extracting cookies from bolt.new');
    } else if (error.name === 'AbortError') {
      console.log('💡 Request timed out - this can happen with complex questions');
    }
    
    process.exit(1);
  }
}

// Run the test
quickModelTest().catch(console.error);
