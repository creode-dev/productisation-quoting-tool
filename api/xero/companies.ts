import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCurrentUser } from '../lib/auth';
import { searchXeroCompanies } from '../lib/xero';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check authentication
  const user = getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const query = req.query.q as string | undefined;

  if (!query) {
    return res.status(200).json({ companies: [] });
  }

  try {
    const companies = await searchXeroCompanies(query);
    return res.status(200).json({ companies });
  } catch (error) {
    console.error('Error fetching Xero companies:', error);
    // Log full error details for debugging
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    // Return empty array instead of 500 to prevent UI errors
    return res.status(200).json({ companies: [] });
  }
}
