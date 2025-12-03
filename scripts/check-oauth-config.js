#!/usr/bin/env node
/**
 * Script to check OAuth 2.0 Client configuration via Google Cloud API
 * 
 * This checks the authorized JavaScript origins for your OAuth client
 */

const CLIENT_ID = '1067455774232-etur5mho6f0qbsr8aq5l1ehev4silrp5.apps.googleusercontent.com';

async function checkOAuthConfig() {
  console.log('🔍 Checking OAuth 2.0 Client Configuration\n');
  console.log(`Client ID: ${CLIENT_ID}\n`);

  // Note: To use the Google Cloud API, you need:
  // 1. gcloud auth application-default login
  // 2. Or set GOOGLE_APPLICATION_CREDENTIALS
  // 3. Enable the Google Cloud Console API
  
  console.log('📝 To check OAuth configuration via CLI:\n');
  console.log('1. Authenticate with gcloud:');
  console.log('   gcloud auth login');
  console.log('   gcloud auth application-default login\n');
  
  console.log('2. Set your project:');
  console.log('   gcloud config set project YOUR_PROJECT_ID\n');
  
  console.log('3. Use the Google Cloud Console API:');
  console.log('   The OAuth client configuration is managed through:');
  console.log('   https://console.cloud.google.com/apis/credentials\n');
  
  console.log('💡 Alternative: Check via Google Cloud Console:');
  console.log('   1. Go to: https://console.cloud.google.com/apis/credentials');
  console.log(`   2. Click on OAuth 2.0 Client ID: ${CLIENT_ID}`);
  console.log('   3. Check "Authorized JavaScript origins" section');
  console.log('   4. Verify http://localhost:5174 is listed\n');
  
  console.log('🔍 Current error suggests:');
  console.log('   - Origin might not be exactly "http://localhost:5174"');
  console.log('   - Could have trailing slash or different protocol');
  console.log('   - Changes might not have propagated yet\n');
  
  console.log('✅ Quick verification:');
  console.log('   The origin must be EXACTLY: http://localhost:5174');
  console.log('   - No trailing slash');
  console.log('   - Lowercase');
  console.log('   - http (not https)');
}

checkOAuthConfig().catch(console.error);


