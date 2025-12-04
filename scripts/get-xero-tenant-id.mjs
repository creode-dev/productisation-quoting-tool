#!/usr/bin/env node
/**
 * Script to get Xero Tenant ID
 * 
 * Usage: node scripts/get-xero-tenant-id.mjs [access_token]
 * 
 * If access_token is provided, it will directly fetch the tenant ID.
 * Otherwise, it will guide you through the OAuth flow.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
function loadEnv() {
  const envFiles = ['.env.local', '.env'];
  const env = {};
  
  for (const file of envFiles) {
    try {
      const content = readFileSync(join(__dirname, '..', file), 'utf-8');
      content.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...valueParts] = trimmed.split('=');
          if (key && valueParts.length > 0) {
            env[key.trim()] = valueParts.join('=').trim();
          }
        }
      });
    } catch (e) {
      // File doesn't exist, continue
    }
  }
  
  return { ...env, ...process.env };
}

const env = loadEnv();
const XERO_CLIENT_ID = env.XERO_CLIENT_ID || '58143CBE02F74BFBB286C6679871FA1C';
const XERO_CLIENT_SECRET = env.XERO_CLIENT_SECRET || 'tfmVdS82RLEM_9ueiyP3wa9mpISRB3Okkp8VBoGELGqFGkDE';
// Use production URL for OAuth redirect
const PRODUCTION_URL = 'https://agency.creode.dev';
const REDIRECT_URI = `${PRODUCTION_URL}/api/auth/xero/callback`;

async function getTenantIdFromToken(accessToken) {
  try {
    const response = await fetch('https://api.xero.com/connections', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to get connections: ${error.Detail || response.statusText}`);
    }

    const connections = await response.json();
    
    if (!connections || connections.length === 0) {
      throw new Error('No tenants found. Make sure you have authorized the app.');
    }

    console.log('\n✅ Found tenants:');
    connections.forEach((conn, index) => {
      console.log(`\n${index + 1}. Tenant ID: ${conn.tenantId}`);
      console.log(`   Name: ${conn.tenantName || 'N/A'}`);
      console.log(`   Type: ${conn.tenantType || 'N/A'}`);
    });

    if (connections.length === 1) {
      return connections[0].tenantId;
    }

    console.log('\n📝 Using the first tenant ID:', connections[0].tenantId);
    return connections[0].tenantId;
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

async function exchangeCodeForToken(code) {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: REDIRECT_URI,
    client_id: XERO_CLIENT_ID,
    client_secret: XERO_CLIENT_SECRET,
  });

  const response = await fetch('https://identity.xero.com/connect/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  return await response.json();
}

function startCallbackServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const code = url.searchParams.get('code');
      const error = url.searchParams.get('error');

      if (error) {
        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.end(`<h1>Error: ${error}</h1><p>Please try again.</p>`);
        server.close();
        reject(new Error(error));
        return;
      }

      if (code) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<h1>Authorization successful!</h1><p>You can close this window and return to the terminal.</p>');
        server.close();
        resolve(code);
      } else {
        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.end('<h1>No authorization code received</h1>');
      }
    });

    server.listen(3000, () => {
      console.log('✅ Callback server started on http://localhost:3000');
    });

    // Timeout after 5 minutes
    setTimeout(() => {
      server.close();
      reject(new Error('Timeout waiting for authorization'));
    }, 5 * 60 * 1000);
  });
}

async function openBrowser(url) {
  const platform = process.platform;
  let command;

  if (platform === 'darwin') {
    command = `open "${url}"`;
  } else if (platform === 'win32') {
    command = `start "${url}"`;
  } else {
    command = `xdg-open "${url}"`;
  }

  try {
    await execAsync(command);
  } catch (error) {
    console.log('⚠️  Could not open browser automatically. Please open the URL manually.');
  }
}

async function main() {
  console.log('🔐 Xero Tenant ID Helper\n');

  // Check if access token was provided as argument
  const accessToken = process.argv[2];

  if (accessToken) {
    console.log('Using provided access token...\n');
    const tenantId = await getTenantIdFromToken(accessToken);
    console.log(`\n✅ Your Xero Tenant ID is: ${tenantId}`);
    console.log('\nAdd this to your .env.local file:');
    console.log(`XERO_TENANT_ID=${tenantId}`);
    return;
  }

  // Otherwise, start OAuth flow
  if (!XERO_CLIENT_ID || !XERO_CLIENT_SECRET) {
    console.error('❌ Error: XERO_CLIENT_ID and XERO_CLIENT_SECRET must be set');
    console.log('\nPlease set these in your .env.local file or as environment variables');
    process.exit(1);
  }

  console.log('Step 1: Starting OAuth flow...\n');
  
  const authUrl = new URL('https://login.xero.com/identity/connect/authorize');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', XERO_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.set('scope', 'accounting.contacts.read offline_access');
  authUrl.searchParams.set('state', 'xero-tenant-helper');

  console.log('Step 2: Opening browser for authorization...');
  console.log(`If the browser doesn't open, visit this URL:\n${authUrl.toString()}\n`);

  const codePromise = startCallbackServer();
  await openBrowser(authUrl.toString());

  console.log('\nWaiting for authorization...');
  const code = await codePromise;

  console.log('\nStep 3: Exchanging authorization code for access token...');
  const tokenData = await exchangeCodeForToken(code);

  console.log('✅ Access token received!');
  console.log(`\nAccess Token: ${tokenData.access_token.substring(0, 20)}...`);
  if (tokenData.refresh_token) {
    console.log(`Refresh Token: ${tokenData.refresh_token.substring(0, 20)}...`);
  }

  console.log('\nStep 4: Fetching tenant ID...');
  const tenantId = await getTenantIdFromToken(tokenData.access_token);

  console.log(`\n✅ Your Xero Tenant ID is: ${tenantId}`);
  console.log('\n📝 Add these to your .env.local file:');
  console.log(`XERO_TENANT_ID=${tenantId}`);
  console.log(`XERO_ACCESS_TOKEN=${tokenData.access_token}`);
  if (tokenData.refresh_token) {
    console.log(`XERO_REFRESH_TOKEN=${tokenData.refresh_token}`);
  }
}

main().catch(error => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});

