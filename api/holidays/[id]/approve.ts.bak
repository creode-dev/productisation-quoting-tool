import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCurrentUser } from '../../lib/auth';
import { sql } from '../../lib/db';
import { createCalendarEvent, getCentralCalendarId } from '../../lib/googleCalendar';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

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

      // Create event in employee's calendar (using their email as calendar ID)
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
        // Continue even if employee calendar fails
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
      // Continue even if calendar creation fails
    }

    return res.status(200).json({ holiday: updatedHoliday });
  } catch (error) {
    console.error('Error approving holiday:', error);
    return res.status(500).json({ error: 'Failed to approve holiday' });
  }
}

