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
      // For now, allow all authenticated users to view employees
      // In production, you might want to restrict this to admins/managers
      const result = await sql`
        SELECT 
          e.id,
          e.user_id,
          e.name,
          e.address,
          e.phone,
          e.next_of_kin_name,
          e.next_of_kin_relationship,
          e.next_of_kin_phone,
          e.start_date,
          e.holiday_entitlement_days,
          e.team_id,
          e.approver_id,
          e.created_at,
          e.updated_at,
          t.name as team_name,
          t.description as team_description,
          a.name as approver_name
        FROM employees e
        LEFT JOIN teams t ON e.team_id = t.id
        LEFT JOIN employees a ON e.approver_id = a.id
        ORDER BY e.name
      `;

      return res.status(200).json({ employees: result.rows });
    } catch (error) {
      console.error('Error fetching employees:', error);
      return res.status(500).json({ error: 'Failed to fetch employees' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

