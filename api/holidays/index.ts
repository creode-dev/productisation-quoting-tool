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
      const { team_id, status, employee_id } = req.query;

      let query = sql`
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
          e.team_id,
          t.name as team_name,
          a.name as approver_name
        FROM holiday_requests h
        JOIN employees e ON h.employee_id = e.id
        LEFT JOIN teams t ON e.team_id = t.id
        LEFT JOIN employees a ON h.approver_id = a.id
        WHERE 1=1
      `;

      if (team_id) {
        query = sql`
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
            e.team_id,
            t.name as team_name,
            a.name as approver_name
          FROM holiday_requests h
          JOIN employees e ON h.employee_id = e.id
          LEFT JOIN teams t ON e.team_id = t.id
          LEFT JOIN employees a ON h.approver_id = a.id
          WHERE e.team_id = ${team_id as string}
        `;
      }

      if (status) {
        const baseQuery = team_id 
          ? sql`SELECT * FROM (${query}) AS filtered WHERE status = ${status as string}`
          : sql`${query} AND h.status = ${status as string}`;
        query = baseQuery;
      }

      if (employee_id) {
        const baseQuery = team_id || status
          ? sql`SELECT * FROM (${query}) AS filtered WHERE employee_id = ${employee_id as string}`
          : sql`${query} AND h.employee_id = ${employee_id as string}`;
        query = baseQuery;
      }

      query = sql`${query} ORDER BY h.start_date DESC`;

      const result = await query;

      return res.status(200).json({ holidays: result.rows });
    } catch (error) {
      console.error('Error fetching holidays:', error);
      return res.status(500).json({ error: 'Failed to fetch holidays' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { startDate, endDate, daysRequested } = req.body;

      if (!startDate || !endDate || daysRequested === undefined) {
        return res.status(400).json({ error: 'startDate, endDate, and daysRequested are required' });
      }

      // Get employee
      const employee = await sql`
        SELECT id, team_id, approver_id FROM employees WHERE user_id = ${user.email} LIMIT 1
      `;

      if (employee.rows.length === 0) {
        return res.status(404).json({ error: 'Employee profile not found' });
      }

      const emp = employee.rows[0];
      let approverId = emp.approver_id;
      let status = 'pending';

      // If no approver configured, auto-approve
      if (!approverId) {
        status = 'approved';
      }

      const result = await sql`
        INSERT INTO holiday_requests (
          employee_id,
          start_date,
          end_date,
          days_requested,
          status,
          approver_id
        ) VALUES (
          ${emp.id},
          ${startDate},
          ${endDate},
          ${daysRequested},
          ${status},
          ${approverId}
        )
        RETURNING *
      `;

      return res.status(200).json({ holiday: result.rows[0] });
    } catch (error) {
      console.error('Error creating holiday request:', error);
      return res.status(500).json({ error: 'Failed to create holiday request' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

