import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Authentication is temporarily disabled
  // TODO: Re-enable JWT verification when Google OAuth is implemented
  // For now, return a mock user
  return res.status(200).json({
    user: {
      email: 'user@creode.co.uk',
      name: 'Demo User',
      picture: undefined,
    },
  });
}
