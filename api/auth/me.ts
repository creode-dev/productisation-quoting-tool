import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCurrentUser } from '../lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Log request details for debugging
    console.log('GET /api/auth/me - Request headers:', JSON.stringify(req.headers).substring(0, 300));
    console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
    console.log('JWT_SECRET length:', process.env.JWT_SECRET?.length || 0);
    
    const user = getCurrentUser(req);
    
    if (!user) {
      console.log('No user found - returning 401');
      return res.status(401).json({ error: 'Not authenticated' });
    }

    console.log('User authenticated:', user.email);
    return res.status(200).json({ user });
  } catch (error: any) {
    console.error('Error in /api/auth/me:', error);
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      code: error?.code
    });
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error?.message || 'Unknown error',
      type: error?.name || 'Error',
      stack: error?.stack ? error.stack.split('\n').slice(0, 5).join('\n') : undefined
    });
  }
}
