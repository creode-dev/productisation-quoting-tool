import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCurrentUser } from '../lib/auth';
import { sql } from '../lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { id } = req.query;

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
        WHERE id = ${id as string}
      `;

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Quote not found' });
      }

      return res.status(200).json({ quote: result.rows[0] });
    } catch (error) {
      console.error('Error fetching quote:', error);
      return res.status(500).json({ error: 'Failed to fetch quote' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const result = await sql`
        DELETE FROM quotes
        WHERE id = ${id as string}
        RETURNING id
      `;

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Quote not found' });
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting quote:', error);
      return res.status(500).json({ error: 'Failed to delete quote' });
    }
  }

  if (req.method === 'PATCH') {
    try {
      const updates: any = {};

      if (req.body.companyName !== undefined) updates.company_name = req.body.companyName;
      if (req.body.companyXeroId !== undefined) updates.company_xero_id = req.body.companyXeroId;
      if (req.body.projectName !== undefined) updates.project_name = req.body.projectName;
      if (req.body.businessUnit !== undefined) updates.business_unit = req.body.businessUnit;
      if (req.body.targetCompletionDate !== undefined) updates.target_completion_date = req.body.targetCompletionDate;
      if (req.body.quoteData !== undefined) updates.quote_data = JSON.stringify(req.body.quoteData);
      if (req.body.status !== undefined) updates.status = req.body.status;

      updates.updated_at = new Date();

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      const setClause = Object.keys(updates)
        .map((key, index) => `${key} = $${index + 1}`)
        .join(', ');

      const values = Object.values(updates);
      values.push(id);

      const result = await sql.query(
        `UPDATE quotes SET ${setClause} WHERE id = $${values.length} RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Quote not found' });
      }

      return res.status(200).json({ quote: result.rows[0] });
    } catch (error) {
      console.error('Error updating quote:', error);
      return res.status(500).json({ error: 'Failed to update quote' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
