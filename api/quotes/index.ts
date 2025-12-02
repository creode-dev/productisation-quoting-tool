import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCurrentUser } from '../lib/auth';
import { sql } from '../lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  if (req.method === 'GET') {
    try {
      const result = await sql`
        SELECT 
          id,
          user_id,
          company_name,
          company_xero_id,
          project_name,
          business_unit,
          target_completion_date,
          quote_data,
          status,
          created_at,
          updated_at,
          accepted_at,
          accepted_by
        FROM quotes
        ORDER BY created_at DESC
      `;

      return res.status(200).json({ quotes: result.rows });
    } catch (error) {
      console.error('Error fetching quotes:', error);
      return res.status(500).json({ error: 'Failed to fetch quotes' });
    }
  }

  if (req.method === 'POST') {
    try {
      const {
        companyName,
        companyXeroId,
        projectName,
        businessUnit,
        targetCompletionDate,
        quoteData,
      } = req.body;

      if (!companyName || !projectName || !quoteData) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const result = await sql`
        INSERT INTO quotes (
          user_id,
          company_name,
          company_xero_id,
          project_name,
          business_unit,
          target_completion_date,
          quote_data,
          status
        ) VALUES (
          ${user.email},
          ${companyName},
          ${companyXeroId || null},
          ${projectName},
          ${businessUnit || null},
          ${targetCompletionDate || null},
          ${JSON.stringify(quoteData)},
          'draft'
        )
        RETURNING id, created_at
      `;

      return res.status(200).json({
        quote: {
          id: result.rows[0].id,
          ...req.body,
          status: 'draft',
          createdAt: result.rows[0].created_at,
        },
      });
    } catch (error) {
      console.error('Error creating quote:', error);
      return res.status(500).json({ error: 'Failed to create quote' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
