import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateToken, getAuthCookie } from '../../lib/auth';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
// Always use production URL for OAuth redirects to avoid staging/preview URL issues
// This ensures the redirect URI matches what's configured in Google Cloud Console
const BASE_URL = 'https://productisation.vercel.app';
const REDIRECT_URI = `${BASE_URL}/api/auth/google/callback`;

// Manual cookie parser
function parseCookie(cookieString: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieString) return cookies;
  
  cookieString.split(';').forEach(cookie => {
    const [name, ...rest] = cookie.trim().split('=');
    if (name) {
      cookies[name] = decodeURIComponent(rest.join('='));
    }
  });
  
  return cookies;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code, state, error } = req.query;

    // Check for errors from Google
    if (error) {
      console.error('Google OAuth error:', error);
      return res.redirect(302, `/login?error=${encodeURIComponent(error as string)}`);
    }

    if (!code) {
      return res.redirect(302, '/login?error=no_code');
    }

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      console.error('OAuth credentials not configured');
      return res.redirect(302, '/login?error=config_error');
    }

    // Verify state (CSRF protection)
    const cookies = req.headers.cookie || '';
    const parsedCookies = parseCookie(cookies);
    const stateCookie = parsedCookies['oauth-state'];
    
    if (!state || state !== stateCookie) {
      console.error('State mismatch:', { state, stateCookie });
      return res.redirect(302, '/login?error=invalid_state');
    }

    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code: code as string,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Token exchange error:', error);
      return res.redirect(302, '/login?error=token_exchange_failed');
    }

    const tokens = await tokenResponse.json();
    const { id_token } = tokens;

    if (!id_token) {
      console.error('No ID token in response');
      return res.redirect(302, '/login?error=no_id_token');
    }

    // Verify ID token and get user info
    const userInfoResponse = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${id_token}`
    );

    if (!userInfoResponse.ok) {
      console.error('Token info verification failed');
      return res.redirect(302, '/login?error=invalid_token');
    }

    const googleUser = await userInfoResponse.json();

    // Verify email domain restriction
    if (!googleUser.email || !googleUser.email.endsWith('@creode.co.uk')) {
      console.log('Domain restriction failed for:', googleUser.email);
      return res.redirect(302, '/login?error=domain_restricted');
    }

    // Generate JWT token
    const user = {
      email: googleUser.email,
      name: googleUser.name,
      picture: googleUser.picture,
    };

    const token = generateToken(user);

    // Set httpOnly cookie and clear OAuth state
    const isProduction = process.env.VERCEL_ENV === 'production';
    const secureFlag = isProduction ? '; Secure' : '';
    res.setHeader('Set-Cookie', [
      getAuthCookie(token),
      `oauth-state=; HttpOnly${secureFlag}; SameSite=Lax; Path=/; Max-Age=0`,
    ]);

    // Redirect to app
    res.redirect(302, '/');
  } catch (error: any) {
    console.error('OAuth callback error:', error);
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name
    });
    res.redirect(302, `/login?error=${encodeURIComponent(error.message || 'unknown_error')}`);
  }
}

