const fs = require('fs');

// Script to check if the current setup is using a team plan
async function checkTeamPlan() {
  console.log('🔍 Checking Team Plan Status...\n');
  
  // Read cookies
  const cookies = fs.readFileSync('./sample-cookies.txt', 'utf8').trim();
  console.log('🍪 Cookie length:', cookies.length);
  
  // Parse cookies to check for team indicators
  const cookieObj = {};
  cookies.split(';').forEach(cookie => {
    const [name, value] = cookie.trim().split('=');
    if (name && value) {
      cookieObj[name] = value;
    }
  });
  
  console.log('📋 Cookie Analysis:');
  
  // Check for team account indicators
  const hasActiveOrganizationId = cookieObj.activeOrganizationId && cookieObj.activeOrganizationId !== 'null';
  const hasSessionToken = !!cookieObj.__session;
  const hasTeamCookies = hasActiveOrganizationId && hasSessionToken;
  
  console.log(`   activeOrganizationId: ${cookieObj.activeOrganizationId ? '✅ Present' : '❌ Missing'}`);
  console.log(`   __session: ${cookieObj.__session ? '✅ Present' : '❌ Missing'}`);
  
  if (hasActiveOrganizationId) {
    // Decode the organization ID
    try {
      const decodedOrgId = decodeURIComponent(cookieObj.activeOrganizationId);
      const orgIdBuffer = Buffer.from(decodedOrgId, 'base64');
      console.log(`   Decoded Org ID: ${orgIdBuffer.toString()}`);
    } catch (e) {
      console.log(`   Raw Org ID: ${cookieObj.activeOrganizationId}`);
    }
  }
  
  // Determine account type
  let accountType = 'unknown';
  if (hasTeamCookies) {
    accountType = 'team';
  } else if (cookieObj.sb_user_id || cookieObj._stackblitz_session) {
    accountType = 'individual';
  }
  
  console.log(`\n🏢 Account Type: ${accountType.toUpperCase()}`);
  
  // Test with a specific team-focused request
  console.log('\n🧪 Testing Team Plan Features...');
  
  const testPayload = {
    id: "team-test-" + Date.now(),
    errorReasoning: null,
    featurePreviews: { diffs: false, reasoning: false },
    framework: "DEFAULT_TO_DEV",
    isFirstPrompt: false,
    messages: [
      { 
        id: "team-msg-" + Date.now(), 
        role: "user", 
        content: "What are the benefits of using bolt.new team plan? Can you create a complex React application with multiple components?" 
      }
    ],
    metrics: { importFilesLength: 0, fileChangesLength: 0 },
    projectId: "49956303",
    promptMode: "discussion",
    stripeStatus: "not-configured", // This might be different for team plans
    supportIntegrations: true,
    usesInspectedElement: false
  };
  
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
      const data = await response.json();
      console.log('✅ Team Plan Test: SUCCESSFUL\n');
      
      console.log('📦 Response Analysis:');
      console.log('- success:', data.success);
      console.log('- timestamp:', data.timestamp);
      console.log('- data type:', typeof data.data);
      
      if (data.data && data.data.content) {
        const content = data.data.content;
        console.log('- content length:', content.length);
        
        // Look for team plan indicators in the response
        const teamIndicators = [
          'team plan',
          'team features',
          'collaboration',
          'shared workspace',
          'organization',
          'premium features'
        ];
        
        const foundIndicators = teamIndicators.filter(indicator => 
          content.toLowerCase().includes(indicator)
        );
        
        if (foundIndicators.length > 0) {
          console.log('🎯 Team Plan Indicators Found:', foundIndicators);
        }
        
        console.log('\n💬 Response Preview:');
        const preview = content.substring(0, 300).replace(/\n/g, ' ');
        console.log(preview + (content.length > 300 ? '...' : ''));
        
      } else {
        console.log('📋 Full Response Data:');
        console.log(JSON.stringify(data.data, null, 2));
      }
      
    } else {
      console.log('❌ Team Plan Test: FAILED');
      const errorText = await response.text();
      console.log('Error:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
  
  // Final determination
  console.log('\n🎯 FINAL ASSESSMENT:');
  console.log('==================');
  
  if (accountType === 'team') {
    console.log('✅ CONFIRMED: Running on TEAM PLAN');
    console.log('🏢 Features Available:');
    console.log('   • Team collaboration');
    console.log('   • Shared workspaces');
    console.log('   • Organization management');
    console.log('   • Enhanced project limits');
    console.log('   • Priority support');
  } else if (accountType === 'individual') {
    console.log('ℹ️  CONFIRMED: Running on INDIVIDUAL PLAN');
    console.log('👤 Features Available:');
    console.log('   • Personal projects');
    console.log('   • Standard limits');
    console.log('   • Basic features');
  } else {
    console.log('❓ UNKNOWN: Could not determine plan type');
    console.log('🔍 Please check:');
    console.log('   • Are you logged into bolt.new?');
    console.log('   • Are the cookies fresh?');
    console.log('   • Try re-extracting cookies');
  }
  
  console.log('\n📊 Cookie Summary:');
  console.log(`   Account Type: ${accountType}`);
  console.log(`   Organization ID: ${hasActiveOrganizationId ? 'Present' : 'Not Present'}`);
  console.log(`   Session Token: ${hasSessionToken ? 'Present' : 'Not Present'}`);
  console.log(`   Total Cookies: ${Object.keys(cookieObj).length}`);
}

// Run the check
checkTeamPlan().catch(console.error);
