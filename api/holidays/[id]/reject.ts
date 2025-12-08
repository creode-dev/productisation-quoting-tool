import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCurrentUser } from '../../lib/auth';
import { sql } from '../../lib/db';
import { logAction, createChangesObject } from '../../lib/audit';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
    if (!id) {
      return res.status(400).json({ error: "ID is required" });
    }
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

    const updatedHoliday = result.rows[0];

    // Log rejection
    await logAction(req, {
      userId: user.email,
      action: 'holiday.rejected',
      entityType: 'holiday_request',
      entityId: id,
      changes: createChangesObject(reqData, updatedHoliday),
      metadata: {
        rejectionReason: rejectionReason || null,
      },
    });

    return res.status(200).json({ holiday: updatedHoliday });
  } catch (error) {
    console.error('Error rejecting holiday:', error);
    return res.status(500).json({ error: 'Failed to reject holiday' });
  }
}



