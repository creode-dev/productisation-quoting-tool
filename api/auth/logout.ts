import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getClearAuthCookie, getCurrentUser } from '../lib/auth';
import { logSimpleAction } from '../lib/audit';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = getCurrentUser(req);
  
  // Log logout if user is authenticated
  if (user) {
    await logSimpleAction(req, user.email, 'auth.logout');
  }

  res.setHeader('Set-Cookie', getClearAuthCookie());
  
  return res.status(200).json({ success: true });
}
