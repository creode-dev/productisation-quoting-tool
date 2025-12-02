import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getClearAuthCookie } from '../lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Set-Cookie', getClearAuthCookie());
  
  return res.status(200).json({ success: true });
}
