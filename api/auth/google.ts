import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateToken, getAuthCookie } from '../lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { credential } = req.body;

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
  } catch (error) {
    console.error('Google auth error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
}
