import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCurrentUser } from '../lib/auth';
import { searchXeroCompanies } from '../lib/xero';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Check authentication
    let user;
    try {
      user = getCurrentUser(req);
    } catch (authError) {
      console.error('Error in getCurrentUser:', authError);
      // Continue without auth for now - return empty results
      return res.status(200).json({ companies: [] });
    }

    if (!user) {
      // Return empty array instead of 401 to prevent UI errors
      console.warn('No authenticated user, returning empty companies list');
      return res.status(200).json({ companies: [] });
    }

    const query = req.query.q as string | undefined;

    if (!query) {
      console.log('[Xero Companies API] No query provided');
      return res.status(200).json({ companies: [] });
    }

    console.log(`[Xero Companies API] Searching for query: "${query}"`);
    const companies = await searchXeroCompanies(query);
    console.log(`[Xero Companies API] Returning ${companies.length} companies`);
    return res.status(200).json({ companies });
  } catch (error) {
    console.error('Error fetching Xero companies:', error);
    // Log full error details for debugging
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    // Always return 200 with empty array to prevent UI errors
    return res.status(200).json({ companies: [] });
  }
}
