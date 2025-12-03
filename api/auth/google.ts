import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateToken, getAuthCookie } from '../lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Log request details for debugging
    console.log('Request method:', req.method);
    console.log('Request body type:', typeof req.body);
    console.log('Request body:', req.body ? JSON.stringify(req.body).substring(0, 200) : 'null');
    console.log('Request headers:', JSON.stringify(req.headers).substring(0, 200));
    
    // Handle body parsing - Vercel should auto-parse JSON, but let's be explicit
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        console.error('Failed to parse body as JSON:', e);
        return res.status(400).json({ error: 'Invalid JSON in request body' });
      }
    }
    
    const { credential } = body || {};

    if (!credential) {
      return res.status(400).json({ error: 'No credential provided' });
    }

    // Verify the Google ID token
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`
    );

    if (!response.ok) {
      return res.status(401).json({ error: 'Invalid Google token' });
    }

    const googleUser = await response.json();

    // Verify email domain restriction
    if (!googleUser.email || !googleUser.email.endsWith('@creode.co.uk')) {
      return res.status(403).json({
        error: 'Access restricted to creode.co.uk email addresses',
      });
    }

    // Generate JWT token
    const user = {
      email: googleUser.email,
      name: googleUser.name,
      picture: googleUser.picture,
    };

    const token = generateToken(user);

    // Set httpOnly cookie
    res.setHeader('Set-Cookie', getAuthCookie(token));

    return res.status(200).json({ user, success: true });
  } catch (error: any) {
    console.error('Google auth error:', error);
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      code: error?.code,
      cause: error?.cause
    });
    
    // Return more detailed error in production for debugging
    return res.status(500).json({ 
      error: 'Authentication failed',
      message: error?.message || 'Unknown error',
      type: error?.name || 'Error',
      // Include stack in production temporarily for debugging
      stack: error?.stack ? error.stack.split('\n').slice(0, 5).join('\n') : undefined
    });
  }
}
