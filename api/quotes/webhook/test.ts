import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return res.status(200).json({ 
    success: true, 
    message: 'Test endpoint working',
    method: req.method,
    hasBody: !!req.body,
    bodyKeys: req.body ? Object.keys(req.body) : []
  });
}



