import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storeXeroTokens } from '../../lib/xeroTokens';

const XERO_CLIENT_ID = process.env.XERO_CLIENT_ID?.trim();
const XERO_CLIENT_SECRET = process.env.XERO_CLIENT_SECRET?.trim();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { code, error, state } = req.query;

  if (error) {
    return res.status(400).send(`
      <html>
        <head><title>Xero OAuth Error</title></head>
        <body>
          <h1>OAuth Error</h1>
          <p>${error}</p>
          <p><a href="/">Return to app</a></p>
        </body>
      </html>
    `);
  }

  if (!code) {
    return res.status(400).send(`
      <html>
        <head><title>Xero OAuth</title></head>
        <body>
          <h1>No authorization code received</h1>
          <p><a href="/">Return to app</a></p>
        </body>
      </html>
    `);
  }

  // Verify CSRF state token
  const cookies = req.headers.cookie || '';
  const stateCookie = cookies.split(';').find(c => c.trim().startsWith('xero-oauth-state='));
  const storedState = stateCookie?.split('=')[1];
  
  if (!state || state !== storedState) {
    return res.status(400).send(`
      <html>
        <head><title>Xero OAuth Error</title></head>
        <body>
          <h1>Invalid State Token</h1>
          <p>CSRF verification failed. Please try again.</p>
          <p><a href="/">Return to app</a></p>
        </body>
      </html>
    `);
  }

  // Clear state cookie
  res.setHeader('Set-Cookie', 'xero-oauth-state=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0');

  if (!XERO_CLIENT_ID || !XERO_CLIENT_SECRET) {
    console.error('Xero credentials missing:', {
      hasClientId: !!XERO_CLIENT_ID,
      hasClientSecret: !!XERO_CLIENT_SECRET,
    });
    return res.status(500).send(`
      <html>
        <head><title>Xero OAuth Error</title></head>
        <body>
          <h1>Configuration Error</h1>
          <p>Xero credentials not configured</p>
          <p>Client ID: ${XERO_CLIENT_ID ? 'Set' : 'Missing'}</p>
          <p>Client Secret: ${XERO_CLIENT_SECRET ? 'Set' : 'Missing'}</p>
        </body>
      </html>
    `);
  }

  try {
    // Determine redirect URI based on environment
    const redirectUri = process.env.VERCEL_ENV === 'production'
      ? 'https://agency.creode.dev/api/auth/xero/callback'
      : `http://localhost:${process.env.PORT || 3000}/api/auth/xero/callback`;
    
    // Log what we're sending (without exposing the full secret)
    console.log('Exchanging token with:', {
      clientId: XERO_CLIENT_ID,
      clientSecretLength: XERO_CLIENT_SECRET?.length || 0,
      clientSecretStart: XERO_CLIENT_SECRET?.substring(0, 5) || 'missing',
      redirectUri,
      codeLength: (code as string).length,
    });

    // Build the request body
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code as string,
      redirect_uri: redirectUri,
      client_id: XERO_CLIENT_ID,
      client_secret: XERO_CLIENT_SECRET,
    });

    console.log('Request params (without secret):', {
      grant_type: 'authorization_code',
      code: (code as string).substring(0, 10) + '...',
      redirect_uri: redirectUri,
      client_id: XERO_CLIENT_ID,
      client_secret_length: XERO_CLIENT_SECRET?.length || 0,
    });

    // Exchange code for token
    const tokenResponse = await fetch('https://identity.xero.com/connect/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      let errorDetails;
      try {
        errorDetails = JSON.parse(errorText);
      } catch {
        errorDetails = errorText;
      }
      
      console.error('Token exchange failed:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: errorDetails,
        clientId: XERO_CLIENT_ID,
        clientSecretLength: XERO_CLIENT_SECRET?.length || 0,
        redirectUri,
      });
      
      return res.status(400).send(`
        <html>
          <head><title>Xero OAuth Error</title></head>
          <body>
            <h1>Token Exchange Failed</h1>
            <p><strong>Status:</strong> ${tokenResponse.status} ${tokenResponse.statusText}</p>
            <pre>${JSON.stringify(errorDetails, null, 2)}</pre>
            <h2>Debugging Info:</h2>
            <ul>
              <li>Redirect URI used: ${redirectUri}</li>
              <li>Client ID: ${XERO_CLIENT_ID}</li>
              <li>Client Secret length: ${XERO_CLIENT_SECRET?.length || 0} characters</li>
              <li>Client Secret starts with: ${XERO_CLIENT_SECRET?.substring(0, 5) || 'MISSING'}...</li>
            </ul>
            <h2>Checklist:</h2>
            <ul>
              <li>✓ Redirect URI in Xero must match exactly: ${redirectUri}</li>
              <li>✓ Client ID in Vercel must match: ${XERO_CLIENT_ID}</li>
              <li>✓ Client Secret in Vercel must match the ACTIVE secret in Xero</li>
              <li>⚠️ If you have multiple Client Secrets in Xero, make sure you're using the most recent one</li>
              <li>⚠️ Client Secrets are case-sensitive and must match exactly</li>
            </ul>
            <p><a href="/">Return to app</a></p>
          </body>
        </html>
      `);
    }

    const tokenData = await tokenResponse.json();

    // Get tenant IDs - prefer from env, fallback to API
    const XERO_TENANT_ID = process.env.XERO_TENANT_ID?.trim();
    let tenantIds: string[] = [];
    
    if (XERO_TENANT_ID) {
      // Use tenant IDs from environment variable
      tenantIds = XERO_TENANT_ID.split(',').map(id => id.trim()).filter(id => id.length > 0);
      console.log('Using tenant IDs from environment:', tenantIds);
    } else {
      // Fallback: fetch from Xero API
      const connectionsResponse = await fetch('https://api.xero.com/connections', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Accept': 'application/json',
        },
      });

      if (connectionsResponse.ok) {
        const connections = await connectionsResponse.json();
        tenantIds = connections.map((c: any) => c.tenantId);
        console.log('Fetched tenant IDs from Xero API:', tenantIds);
      }
    }

    const tenantInfo = tenantIds.length > 0 
      ? `Tenant IDs: ${tenantIds.join(', ')}`
      : 'Unable to fetch tenant information';

    // Store tokens in database for automatic refresh
    try {
      await storeXeroTokens({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || '',
        token_type: tokenData.token_type || 'Bearer',
        expires_in: tokenData.expires_in || 1800, // Default 30 minutes
        scope: tokenData.scope,
        tenant_ids: tenantIds,
      });
      console.log('Xero tokens stored successfully in database');
    } catch (storeError) {
      console.error('Error storing Xero tokens:', storeError);
      // Continue anyway - tokens are still displayed for manual setup
    }

    // Display the tokens
    return res.send(`
      <html>
        <head>
          <title>Xero OAuth Success</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
            .token-box { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0; }
            .token { font-family: monospace; word-break: break-all; }
            button { background: #0070f3; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }
            button:hover { background: #0051cc; }
            .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <h1>✅ Xero OAuth Successful!</h1>
          
          <div class="warning">
            <strong>⚠️ Important:</strong> Access tokens expire after 30 minutes. 
            For production, you should implement token refresh using the refresh token.
          </div>

          <h2>Access Token:</h2>
          <div class="token-box">
            <div class="token" id="accessToken">${tokenData.access_token}</div>
            <button onclick="copyToClipboard('accessToken')">Copy</button>
          </div>

          ${tokenData.refresh_token ? `
          <h2>Refresh Token:</h2>
          <div class="token-box">
            <div class="token" id="refreshToken">${tokenData.refresh_token}</div>
            <button onclick="copyToClipboard('refreshToken')">Copy</button>
          </div>
          ` : ''}

          <h2>Tenant Information:</h2>
          <div class="token-box">
            <div>${tenantInfo}</div>
          </div>

          <h2>Next Steps:</h2>
          <ol>
            <li><strong>✅ Tokens have been automatically stored in the database</strong></li>
            <li>The system will now automatically refresh tokens when they expire</li>
            <li>No manual token updates are required</li>
            <li>You can close this page and return to the app</li>
          </ol>
          
          <div class="warning">
            <strong>Note:</strong> If token storage failed, you can still manually set 
            <code>XERO_ACCESS_TOKEN</code> in Vercel, but automatic refresh will not work.
          </div>

          <p><a href="/">Return to app</a></p>

          <script>
            function copyToClipboard(elementId) {
              const element = document.getElementById(elementId);
              const text = element.textContent;
              navigator.clipboard.writeText(text).then(() => {
                alert('Copied to clipboard!');
              });
            }
          </script>
        </body>
      </html>
    `);
  } catch (error: any) {
    return res.status(500).send(`
      <html>
        <head><title>Xero OAuth Error</title></head>
        <body>
          <h1>Error</h1>
          <pre>${error.message}</pre>
          <p><a href="/">Return to app</a></p>
        </body>
      </html>
    `);
  }
}

