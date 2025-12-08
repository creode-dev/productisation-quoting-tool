import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomBytes } from 'crypto';

const XERO_CLIENT_ID = process.env.XERO_CLIENT_ID?.trim();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!XERO_CLIENT_ID) {
    return res.status(500).send(`
      <html>
        <head><title>Xero OAuth Error</title></head>
        <body>
          <h1>Configuration Error</h1>
          <p>XERO_CLIENT_ID not configured</p>
        </body>
      </html>
    `);
  }

  try {
    // Generate CSRF state token
    const state = randomBytes(32).toString('hex');
    
    // Store state in secure cookie (expires in 10 minutes)
    const isProduction = process.env.VERCEL_ENV === 'production';
    res.setHeader('Set-Cookie', [
      `xero-oauth-state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600${isProduction ? '' : ''}`,
    ]);

    // Build authorization URL
    const redirectUri = process.env.VERCEL_ENV === 'production'
      ? 'https://agency.creode.dev/api/auth/xero/callback'
      : `http://localhost:${process.env.PORT || 3000}/api/auth/xero/callback`;

    const scopes = [
      'accounting.transactions',
      'accounting.contacts.read',
      'accounting.settings.read',
    ].join(' ');

    const authUrl = new URL('https://login.xero.com/identity/connect/authorize');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', XERO_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', scopes);
    authUrl.searchParams.set('state', state);

    // Redirect to Xero OAuth
    res.redirect(authUrl.toString());
  } catch (error: any) {
    console.error('Error initiating Xero OAuth:', error);
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

