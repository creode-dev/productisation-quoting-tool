import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCurrentUser } from '../lib/auth';
import { sql } from '../lib/db';
import { createCalendarEvent, getCentralCalendarId } from '../lib/googleCalendar';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
    if (!id) {
      return res.status(400).json({ error: "ID is required" });
    }

  if (req.method === 'GET') {
    try {
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
          e.team_id,
          t.name as team_name,
          a.name as approver_name
        FROM holiday_requests h
        JOIN employees e ON h.employee_id = e.id
        LEFT JOIN teams t ON e.team_id = t.id
        LEFT JOIN employees a ON h.approver_id = a.id
        WHERE h.id = ${id}
        LIMIT 1
      `;

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Holiday request not found' });
      }

      return res.status(200).json({ holiday: result.rows[0] });
    } catch (error) {
      console.error('Error fetching holiday:', error);
      return res.status(500).json({ error: 'Failed to fetch holiday' });
    }
  }

  if (req.method === 'PUT') {
    try {
      // Get current request
      const current = await sql`
        SELECT employee_id, approver_id, status FROM holiday_requests WHERE id = ${id} LIMIT 1
      `;

      if (current.rows.length === 0) {
        return res.status(404).json({ error: 'Holiday request not found' });
      }

      const holiday = current.rows[0];

      // Get current user's employee record
      const userEmp = await sql`
        SELECT id FROM employees WHERE user_id = ${user.email} LIMIT 1
      `;

      if (userEmp.rows.length === 0) {
        return res.status(404).json({ error: 'Employee profile not found' });
      }

      const userId = userEmp.rows[0].id;
      const isOwner = holiday.employee_id === userId;
      const isApprover = holiday.approver_id === userId;

      // Only owner can update, and only if not approved/rejected
      if (!isOwner && !isApprover) {
        return res.status(403).json({ error: 'Not authorized to update this request' });
      }

      if (isOwner && holiday.status !== 'pending' && holiday.status !== 'cancelled') {
        return res.status(400).json({ error: 'Cannot update approved or rejected request' });
      }

      const { startDate, endDate, daysRequested } = req.body;

      const result = await sql`
        UPDATE holiday_requests
        SET 
          start_date = COALESCE(${startDate}, start_date),
          end_date = COALESCE(${endDate}, end_date),
          days_requested = COALESCE(${daysRequested}, days_requested),
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `;

      return res.status(200).json({ holiday: result.rows[0] });
    } catch (error) {
      console.error('Error updating holiday:', error);
      return res.status(500).json({ error: 'Failed to update holiday' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      // Get current request
      const current = await sql`
        SELECT employee_id, status FROM holiday_requests WHERE id = ${id} LIMIT 1
      `;

      if (current.rows.length === 0) {
        return res.status(404).json({ error: 'Holiday request not found' });
      }

      const holiday = current.rows[0];

      // Get current user's employee record
      const userEmp = await sql`
        SELECT id FROM employees WHERE user_id = ${user.email} LIMIT 1
      `;

      if (userEmp.rows.length === 0) {
        return res.status(404).json({ error: 'Employee profile not found' });
      }

      const userId = userEmp.rows[0].id;

      // Only owner can cancel
      if (holiday.employee_id !== userId) {
        return res.status(403).json({ error: 'Not authorized to cancel this request' });
      }

      // Update status to cancelled instead of deleting
      const result = await sql`
        UPDATE holiday_requests
        SET status = 'cancelled', updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `;

      return res.status(200).json({ holiday: result.rows[0] });
    } catch (error) {
      console.error('Error cancelling holiday:', error);
      return res.status(500).json({ error: 'Failed to cancel holiday' });
    }
  }

  if (req.method === 'POST') {
    // Handle approve/reject actions
    const { action } = req.body;

    if (action === 'approve') {
      try {
        // Get holiday request
        const holiday = await sql`
          SELECT 
            h.*,
            e.name as employee_name,
            e.user_id as employee_email,
            e.team_id
          FROM holiday_requests h
          JOIN employees e ON h.employee_id = e.id
          WHERE h.id = ${id}
          LIMIT 1
        `;

        if (holiday.rows.length === 0) {
          return res.status(404).json({ error: 'Holiday request not found' });
        }

        const reqData = holiday.rows[0];

        // Check if already approved/rejected
        if (reqData.status !== 'pending') {
          return res.status(400).json({ error: `Request is already ${reqData.status}` });
        }

        // Get current user's employee record
        const approver = await sql`
          SELECT id FROM employees WHERE user_id = ${user.email} LIMIT 1
        `;

        if (approver.rows.length === 0) {
          return res.status(404).json({ error: 'Approver profile not found' });
        }

        const approverId = approver.rows[0].id;

        // Check if user is the approver
        if (reqData.approver_id !== approverId) {
          return res.status(403).json({ error: 'Not authorized to approve this request' });
        }

        // Update status
        const updateResult = await sql`
          UPDATE holiday_requests
          SET 
            status = 'approved',
            approver_id = ${approverId},
            approved_at = NOW(),
            updated_at = NOW()
          WHERE id = ${id}
          RETURNING *
        `;

        const updatedHoliday = updateResult.rows[0];

        // Create calendar events
        try {
          const centralCalendarId = getCentralCalendarId();
          const eventSummary = `${reqData.employee_name} - Holiday`;

          // Create event in central calendar
          const centralEventId = await createCalendarEvent(centralCalendarId, {
            summary: eventSummary,
            description: `Holiday request for ${reqData.employee_name}`,
            start: { date: reqData.start_date },
            end: { date: reqData.end_date },
          });

          // Create event in employee's calendar
          let employeeEventId = null;
          try {
            employeeEventId = await createCalendarEvent(reqData.employee_email, {
              summary: 'Holiday',
              description: 'Approved holiday request',
              start: { date: reqData.start_date },
              end: { date: reqData.end_date },
            });
          } catch (error) {
            console.error('Error creating employee calendar event:', error);
          }

          // Update holiday request with calendar event IDs
          await sql`
            UPDATE holiday_requests
            SET 
              google_calendar_event_id = ${centralEventId},
              employee_calendar_event_id = ${employeeEventId}
            WHERE id = ${id}
          `;
        } catch (error) {
          console.error('Error creating calendar events:', error);
        }

        return res.status(200).json({ holiday: updatedHoliday });
      } catch (error) {
        console.error('Error approving holiday:', error);
        return res.status(500).json({ error: 'Failed to approve holiday' });
      }
    }

    if (action === 'reject') {
      try {
        const { rejectionReason } = req.body;

        // Get holiday request
        const holiday = await sql`
          SELECT * FROM holiday_requests WHERE id = ${id} LIMIT 1
        `;

        if (holiday.rows.length === 0) {
          return res.status(404).json({ error: 'Holiday request not found' });
        }

        const reqData = holiday.rows[0];

        // Check if already approved/rejected
        if (reqData.status !== 'pending') {
          return res.status(400).json({ error: `Request is already ${reqData.status}` });
        }

        // Get current user's employee record
        const approver = await sql`
          SELECT id FROM employees WHERE user_id = ${user.email} LIMIT 1
        `;

        if (approver.rows.length === 0) {
          return res.status(404).json({ error: 'Approver profile not found' });
        }

        const approverId = approver.rows[0].id;

        // Check if user is the approver
        if (reqData.approver_id !== approverId) {
          return res.status(403).json({ error: 'Not authorized to reject this request' });
        }

        // Update status
        const result = await sql`
          UPDATE holiday_requests
          SET 
            status = 'rejected',
            approver_id = ${approverId},
            rejection_reason = ${rejectionReason || null},
            updated_at = NOW()
          WHERE id = ${id}
          RETURNING *
        `;

        return res.status(200).json({ holiday: result.rows[0] });
      } catch (error) {
        console.error('Error rejecting holiday:', error);
        return res.status(500).json({ error: 'Failed to reject holiday' });
      }
    }

    return res.status(400).json({ error: 'Invalid action. Use "approve" or "reject"' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}


