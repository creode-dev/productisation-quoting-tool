import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCurrentUser } from '../lib/auth';
import { getXeroTokens } from '../lib/xeroTokens';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  let user;
  try {
    user = getCurrentUser(req);
  } catch (error: any) {
    console.error('Auth error in token-status:', error);
    return res.status(401).json({ error: 'Not authenticated', details: error.message });
  }
  
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const tokens = await getXeroTokens();
    
    if (!tokens) {
      return res.status(200).json({
        authenticated: false,
        message: 'No Xero tokens found. Please authenticate at /api/auth/xero/redirect',
      });
    }

    // Check if token is expired
    let expiresAt: Date;
    if (tokens.expires_at) {
      expiresAt = new Date(tokens.expires_at);
    } else {
      expiresAt = new Date(Date.now() + (tokens.expires_in * 1000));
    }

    const now = new Date();
    const isExpired = expiresAt <= now;
    const expiresInMinutes = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000 / 60));

    return res.status(200).json({
      authenticated: true,
      expiresAt: expiresAt.toISOString(),
      expiresInMinutes,
      isExpired,
      hasRefreshToken: !!tokens.refresh_token,
      tenantIds: tokens.tenant_ids || [],
      scope: tokens.scope,
    });
  } catch (error: any) {
    console.error('Error checking Xero token status:', error);
    return res.status(500).json({ error: error.message || 'Failed to check token status' });
  }
}

