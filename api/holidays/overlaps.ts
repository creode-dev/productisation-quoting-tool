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
      const { team_id, start_date, end_date, exclude_request_id } = req.query;

      if (!team_id || !start_date || !end_date) {
        return res.status(400).json({ error: 'team_id, start_date, and end_date are required' });
      }

      // Find all employees in the team
      const teamEmployees = await sql`
        SELECT id, name FROM employees WHERE team_id = ${team_id as string}
      `;

      if (teamEmployees.rows.length === 0) {
        return res.status(200).json({ overlaps: [] });
      }

      const employeeIds = teamEmployees.rows.map((e: any) => e.id);

      // Find overlapping holiday requests
      let query = sql`
        SELECT 
          h.id,
          h.employee_id,
          h.start_date,
          h.end_date,
          h.days_requested,
          h.status,
          e.name as employee_name
        FROM holiday_requests h
        JOIN employees e ON h.employee_id = e.id
        WHERE h.employee_id = ANY(${employeeIds})
          AND h.status IN ('approved', 'pending')
          AND (
            (h.start_date <= ${end_date as string} AND h.end_date >= ${start_date as string})
          )
      `;

      if (exclude_request_id) {
        query = sql`
          SELECT 
            h.id,
            h.employee_id,
            h.start_date,
            h.end_date,
            h.days_requested,
            h.status,
            e.name as employee_name
          FROM holiday_requests h
          JOIN employees e ON h.employee_id = e.id
          WHERE h.employee_id = ANY(${employeeIds})
            AND h.status IN ('approved', 'pending')
            AND h.id != ${exclude_request_id as string}
            AND (
              (h.start_date <= ${end_date as string} AND h.end_date >= ${start_date as string})
            )
        `;
      }

      const result = await query;

      return res.status(200).json({ overlaps: result.rows });
    } catch (error) {
      console.error('Error checking overlaps:', error);
      return res.status(500).json({ error: 'Failed to check overlaps' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

