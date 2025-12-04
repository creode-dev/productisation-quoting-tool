import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const BASE_URL = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}` 
  : 'https://productisation.vercel.app';
const REDIRECT_URI = `${BASE_URL}/api/auth/google/callback`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!GOOGLE_CLIENT_ID) {
    return res.status(500).json({ error: 'GOOGLE_CLIENT_ID not configured' });
  }

  // Generate state for CSRF protection
  const state = crypto.randomBytes(32).toString('base64url');
  
  // Store state in cookie (HttpOnly, Secure, SameSite)
  const isProduction = process.env.VERCEL_ENV === 'production';
  const secureFlag = isProduction ? '; Secure' : '';
  res.setHeader('Set-Cookie', `oauth-state=${state}; HttpOnly${secureFlag}; SameSite=Lax; Path=/; Max-Age=600`);

  // Build OAuth URL
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile',
    state: state,
    access_type: 'offline',
    prompt: 'consent',
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  
  // Redirect to Google
  res.redirect(302, authUrl);
}

