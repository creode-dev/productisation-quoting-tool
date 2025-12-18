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
      // Get employee ID
      const employee = await sql`
        SELECT id FROM employees WHERE user_id = ${user.email} LIMIT 1
      `;

      if (employee.rows.length === 0) {
        return res.status(404).json({ error: 'Employee profile not found' });
      }

      const employeeId = employee.rows[0].id;

      const result = await sql`
        SELECT 
          h.id,
          h.employee_id,
          h.start_date,
          h.end_date,
          h.days_requested,
          h.status,
          h.approver_id,
          h.approved_at,
          h.rejection_reason,
          h.google_calendar_event_id,
          h.employee_calendar_event_id,
          h.created_at,
          h.updated_at,
          e.name as employee_name,
          a.name as approver_name
        FROM holiday_requests h
        LEFT JOIN employees e ON h.employee_id = e.id
        LEFT JOIN employees a ON h.approver_id = a.id
        WHERE h.employee_id = ${employeeId}
        ORDER BY h.start_date DESC
      `;

      return res.status(200).json({ holidays: result.rows });
    } catch (error) {
      console.error('Error fetching holidays:', error);
      return res.status(500).json({ error: 'Failed to fetch holidays' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}





