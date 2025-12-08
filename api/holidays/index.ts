import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCurrentUser } from '../lib/auth';
import { sql } from '../lib/db';
import { createCalendarEvent, getCentralCalendarId } from '../lib/googleCalendar';
import { logAction, createChangesObject } from '../lib/audit';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  if (req.method === 'GET') {
    try {
      const queryParams = req.query;
      const me = Array.isArray(queryParams.me) ? queryParams.me[0] : queryParams.me;
      const remaining = Array.isArray(queryParams.remaining) ? queryParams.remaining[0] : queryParams.remaining;
      const overlaps = Array.isArray(queryParams.overlaps) ? queryParams.overlaps[0] : queryParams.overlaps;

      // Handle /me endpoint - get current user's holidays
      if (me === 'true') {
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
      }

      // Handle /remaining endpoint
      if (remaining === 'true') {
        const employee = await sql`
          SELECT 
            id,
            start_date,
            holiday_entitlement_days
          FROM employees 
          WHERE user_id = ${user.email} 
          LIMIT 1
        `;

        if (employee.rows.length === 0) {
          return res.status(404).json({ error: 'Employee profile not found' });
        }

        const emp = employee.rows[0];
        const currentYear = new Date().getFullYear();
        const annualEntitlement = emp.holiday_entitlement_days || 25;

        // Calculate pro-rata entitlement
        function calculateProRataEntitlement(
          annualEntitlement: number,
          startDate: Date | null,
          currentYear: number
        ): number {
          if (!startDate) {
            return annualEntitlement;
          }

          const start = new Date(startDate);
          const yearStart = new Date(currentYear, 0, 1);
          const yearEnd = new Date(currentYear, 11, 31);

          if (start < yearStart) {
            return annualEntitlement;
          }

          if (start > yearEnd) {
            return 0;
          }

          const daysInYear = 365;
          const daysRemaining = Math.ceil((yearEnd.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          const proRata = (daysRemaining / daysInYear) * annualEntitlement;

          return Math.round(proRata * 10) / 10;
        }

        const proRataEntitlement = calculateProRataEntitlement(
          annualEntitlement,
          emp.start_date ? new Date(emp.start_date) : null,
          currentYear
        );

        const yearStart = `${currentYear}-01-01`;
        const yearEnd = `${currentYear}-12-31`;

        const holidays = await sql`
          SELECT 
            days_requested,
            status
          FROM holiday_requests
          WHERE employee_id = ${emp.id}
            AND start_date >= ${yearStart}
            AND start_date <= ${yearEnd}
            AND status IN ('approved', 'pending')
        `;

        let usedDays = 0;
        let pendingDays = 0;

        for (const holiday of holidays.rows) {
          const days = parseFloat(holiday.days_requested);
          if (holiday.status === 'approved') {
            usedDays += days;
          } else if (holiday.status === 'pending') {
            pendingDays += days;
          }
        }

        const remainingDays = proRataEntitlement - usedDays - pendingDays;

        return res.status(200).json({
          annualEntitlement,
          proRataEntitlement,
          usedDays,
          pendingDays,
          remainingDays: Math.max(0, remainingDays),
        });
      }

      // Handle /overlaps endpoint
      if (overlaps === 'true') {
        const teamId = Array.isArray(queryParams.team_id) ? queryParams.team_id[0] : queryParams.team_id;
        const startDate = Array.isArray(queryParams.start_date) ? queryParams.start_date[0] : queryParams.start_date;
        const endDate = Array.isArray(queryParams.end_date) ? queryParams.end_date[0] : queryParams.end_date;
        const excludeRequestId = Array.isArray(queryParams.exclude_request_id) ? queryParams.exclude_request_id[0] : queryParams.exclude_request_id;

        const teamIdStr = Array.isArray(teamId) ? teamId[0] : teamId;
        const startDateStr = Array.isArray(startDate) ? startDate[0] : startDate;
        const endDateStr = Array.isArray(endDate) ? endDate[0] : endDate;
        const excludeIdStr = Array.isArray(excludeRequestId) ? excludeRequestId[0] : excludeRequestId;

        if (!teamIdStr || !startDateStr || !endDateStr) {
          return res.status(400).json({ error: 'team_id, start_date, and end_date are required' });
        }

        const teamEmployees = await sql`
          SELECT id, name FROM employees WHERE team_id = ${teamIdStr}
        `;

        if (teamEmployees.rows.length === 0) {
          return res.status(200).json({ overlaps: [] });
        }

        // Use subquery to find overlapping holidays for team employees
        let result;
        if (excludeIdStr) {
          result = await sql`
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
            WHERE e.team_id = ${teamIdStr}
              AND h.status IN ('approved', 'pending')
              AND h.id != ${excludeIdStr}
              AND (
                (h.start_date <= ${endDateStr} AND h.end_date >= ${startDateStr})
              )
          `;
        } else {
          result = await sql`
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
            WHERE e.team_id = ${teamIdStr}
              AND h.status IN ('approved', 'pending')
              AND (
                (h.start_date <= ${endDateStr} AND h.end_date >= ${startDateStr})
              )
          `;
        }
        return res.status(200).json({ overlaps: result.rows });
      }

      // Regular holidays list
      const team_id = Array.isArray(queryParams.team_id) ? queryParams.team_id[0] : queryParams.team_id;
      const status = Array.isArray(queryParams.status) ? queryParams.status[0] : queryParams.status;
      const employee_id = Array.isArray(queryParams.employee_id) ? queryParams.employee_id[0] : queryParams.employee_id;

      // Build query based on filters
      let result;
      
      if (team_id && status && employee_id) {
        result = await sql`
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
          WHERE e.team_id = ${team_id} AND h.status = ${status} AND h.employee_id = ${employee_id}
          ORDER BY h.start_date DESC
        `;
      } else if (team_id && status) {
        result = await sql`
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
          WHERE e.team_id = ${team_id} AND h.status = ${status}
          ORDER BY h.start_date DESC
        `;
      } else if (team_id && employee_id) {
        result = await sql`
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
          WHERE e.team_id = ${team_id} AND h.employee_id = ${employee_id}
          ORDER BY h.start_date DESC
        `;
      } else if (status && employee_id) {
        result = await sql`
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
          WHERE h.status = ${status} AND h.employee_id = ${employee_id}
          ORDER BY h.start_date DESC
        `;
      } else if (team_id) {
        result = await sql`
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
          WHERE e.team_id = ${team_id}
          ORDER BY h.start_date DESC
        `;
      } else if (status) {
        result = await sql`
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
          WHERE h.status = ${status}
          ORDER BY h.start_date DESC
        `;
      } else if (employee_id) {
        result = await sql`
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
          WHERE h.employee_id = ${employee_id}
          ORDER BY h.start_date DESC
      `;
      } else {
        result = await sql`
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
          ORDER BY h.start_date DESC
        `;
      }

      return res.status(200).json({ holidays: result.rows });
    } catch (error) {
      console.error('Error fetching holidays:', error);
      return res.status(500).json({ error: 'Failed to fetch holidays' });
    }
  }

  // Handle holiday by ID if id query param exists (but not for me/remaining/overlaps)
  const queryParams = req.query;
  const meParam = Array.isArray(queryParams.me) ? queryParams.me[0] : queryParams.me;
  const remainingParam = Array.isArray(queryParams.remaining) ? queryParams.remaining[0] : queryParams.remaining;
  const overlapsParam = Array.isArray(queryParams.overlaps) ? queryParams.overlaps[0] : queryParams.overlaps;
  const holidayId = Array.isArray(queryParams.id) ? queryParams.id[0] : queryParams.id;
  
  if (holidayId && meParam !== 'true' && remainingParam !== 'true' && overlapsParam !== 'true') {
    const id = Array.isArray(holidayId) ? holidayId[0] : holidayId;
    
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
        const current = await sql`
          SELECT employee_id, approver_id, status FROM holiday_requests WHERE id = ${id} LIMIT 1
        `;

        if (current.rows.length === 0) {
          return res.status(404).json({ error: 'Holiday request not found' });
        }

        const holiday = current.rows[0];
        const userEmp = await sql`
          SELECT id FROM employees WHERE user_id = ${user.email} LIMIT 1
        `;

        if (userEmp.rows.length === 0) {
          return res.status(404).json({ error: 'Employee profile not found' });
        }

        const userId = userEmp.rows[0].id;
        const isOwner = holiday.employee_id === userId;
        const isApprover = holiday.approver_id === userId;

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
        const current = await sql`
          SELECT employee_id, status FROM holiday_requests WHERE id = ${id} LIMIT 1
        `;

        if (current.rows.length === 0) {
          return res.status(404).json({ error: 'Holiday request not found' });
        }

        const holiday = current.rows[0];
        const userEmp = await sql`
          SELECT id FROM employees WHERE user_id = ${user.email} LIMIT 1
        `;

        if (userEmp.rows.length === 0) {
          return res.status(404).json({ error: 'Employee profile not found' });
        }

        const userId = userEmp.rows[0].id;

        if (holiday.employee_id !== userId) {
          return res.status(403).json({ error: 'Not authorized to cancel this request' });
        }

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
      const { action } = req.body;

      if (action === 'approve') {
        try {
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

          if (reqData.status !== 'pending') {
            return res.status(400).json({ error: `Request is already ${reqData.status}` });
          }

          const approver = await sql`
            SELECT id FROM employees WHERE user_id = ${user.email} LIMIT 1
          `;

          if (approver.rows.length === 0) {
            return res.status(404).json({ error: 'Approver profile not found' });
          }

          const approverId = approver.rows[0].id;

          if (reqData.approver_id !== approverId) {
            return res.status(403).json({ error: 'Not authorized to approve this request' });
          }

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

          try {
            const centralCalendarId = getCentralCalendarId();
            const eventSummary = `${reqData.employee_name} - Holiday`;

            const centralEventId = await createCalendarEvent(centralCalendarId, {
              summary: eventSummary,
              description: `Holiday request for ${reqData.employee_name}`,
              start: { date: reqData.start_date },
              end: { date: reqData.end_date },
            });

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

          const holiday = await sql`
            SELECT * FROM holiday_requests WHERE id = ${id} LIMIT 1
          `;

          if (holiday.rows.length === 0) {
            return res.status(404).json({ error: 'Holiday request not found' });
          }

          const reqData = holiday.rows[0];

          if (reqData.status !== 'pending') {
            return res.status(400).json({ error: `Request is already ${reqData.status}` });
          }

          const approver = await sql`
            SELECT id FROM employees WHERE user_id = ${user.email} LIMIT 1
          `;

          if (approver.rows.length === 0) {
            return res.status(404).json({ error: 'Approver profile not found' });
          }

          const approverId = approver.rows[0].id;

          if (reqData.approver_id !== approverId) {
            return res.status(403).json({ error: 'Not authorized to reject this request' });
          }

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

      const newHoliday = result.rows[0];

      // Log creation
      await logAction(req, {
        userId: user.email,
        action: 'holiday.created',
        entityType: 'holiday_request',
        entityId: newHoliday.id,
        changes: createChangesObject(null, newHoliday),
        metadata: {
          startDate,
          endDate,
          daysRequested,
          status,
        },
      });

      return res.status(200).json({ holiday: newHoliday });
    } catch (error) {
      console.error('Error creating holiday request:', error);
      return res.status(500).json({ error: 'Failed to create holiday request' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}


