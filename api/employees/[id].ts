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
        WHERE e.id = ${id}
        LIMIT 1
      `;

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Employee not found' });
      }

      return res.status(200).json({ employee: result.rows[0] });
    } catch (error) {
      console.error('Error fetching employee:', error);
      return res.status(500).json({ error: 'Failed to fetch employee' });
    }
  }

  if (req.method === 'PUT') {
    try {
      // Check if current user is admin or the employee themselves
      // For now, allow any authenticated user to update (restrict in production)
      const {
        name,
        address,
        phone,
        nextOfKinName,
        nextOfKinRelationship,
        nextOfKinPhone,
        startDate,
        holidayEntitlementDays,
        teamId,
        approverId,
      } = req.body;

      const result = await sql`
        UPDATE employees
        SET 
          name = COALESCE(${name}, name),
          address = ${address !== undefined ? address : sql`address`},
          phone = ${phone !== undefined ? phone : sql`phone`},
          next_of_kin_name = ${nextOfKinName !== undefined ? nextOfKinName : sql`next_of_kin_name`},
          next_of_kin_relationship = ${nextOfKinRelationship !== undefined ? nextOfKinRelationship : sql`next_of_kin_relationship`},
          next_of_kin_phone = ${nextOfKinPhone !== undefined ? nextOfKinPhone : sql`next_of_kin_phone`},
          start_date = ${startDate !== undefined ? startDate : sql`start_date`},
          holiday_entitlement_days = ${holidayEntitlementDays !== undefined ? holidayEntitlementDays : sql`holiday_entitlement_days`},
          team_id = ${teamId !== undefined ? teamId : sql`team_id`},
          approver_id = ${approverId !== undefined ? approverId : sql`approver_id`},
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `;

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Employee not found' });
      }

      return res.status(200).json({ employee: result.rows[0] });
    } catch (error) {
      console.error('Error updating employee:', error);
      return res.status(500).json({ error: 'Failed to update employee' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

