import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCurrentUser } from '../../lib/auth';
import { sql } from '../../lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { id } = req.query;

  try {
    const result = await sql`
      UPDATE quotes
      SET 
        status = 'accepted',
        accepted_at = NOW(),
        accepted_by = ${user.email},
        updated_at = NOW()
      WHERE id = ${id as string}
      RETURNING *
    `;

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    // TODO: Trigger workflow here (TBC)
    // This is a placeholder for future workflow implementation
    // Examples: send notification, create project, update CRM, etc.

    return res.status(200).json({ 
      quote: result.rows[0],
      message: 'Quote accepted successfully'
    });
  } catch (error) {
    console.error('Error accepting quote:', error);
    return res.status(500).json({ error: 'Failed to accept quote' });
  }
}
