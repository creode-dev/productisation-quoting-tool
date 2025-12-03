import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCurrentUser } from '../lib/auth';
import { sql } from '../lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  // Handle employee by ID if id query param exists
  const { id, me } = req.query;
  if (id && !me) {
    const employeeId = Array.isArray(id) ? id[0] : id;
    
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
          WHERE e.id = ${employeeId}
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
          WHERE id = ${employeeId}
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

  if (req.method === 'GET') {
    try {
      const { me } = req.query;
      
      // If ?me=true, return current user's employee profile
      const meStr = Array.isArray(me) ? me[0] : me;
      if (meStr === 'true') {
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
            a.name as approver_name
          FROM employees e
          LEFT JOIN teams t ON e.team_id = t.id
          LEFT JOIN employees a ON e.approver_id = a.id
          WHERE e.user_id = ${user.email}
          LIMIT 1
        `;

        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Employee profile not found' });
        }

        return res.status(200).json({ employee: result.rows[0] });
      }

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

  if (req.method === 'PUT') {
    // Handle updating current user's profile (from /me endpoint)
    try {
      const {
        name,
        address,
        phone,
        nextOfKinName,
        nextOfKinRelationship,
        nextOfKinPhone,
      } = req.body;

      // Check if employee exists
      const existing = await sql`
        SELECT id FROM employees WHERE user_id = ${user.email}
      `;

      if (existing.rows.length === 0) {
        // Create new employee profile
        const result = await sql`
          INSERT INTO employees (
            user_id,
            name,
            address,
            phone,
            next_of_kin_name,
            next_of_kin_relationship,
            next_of_kin_phone
          ) VALUES (
            ${user.email},
            ${name || user.name || ''},
            ${address || null},
            ${phone || null},
            ${nextOfKinName || null},
            ${nextOfKinRelationship || null},
            ${nextOfKinPhone || null}
          )
          RETURNING *
        `;

        return res.status(200).json({ employee: result.rows[0] });
      } else {
        // Update existing employee profile
        const result = await sql`
          UPDATE employees
          SET 
            name = ${name || existing.rows[0].name},
            address = ${address !== undefined ? address : existing.rows[0].address},
            phone = ${phone !== undefined ? phone : existing.rows[0].phone},
            next_of_kin_name = ${nextOfKinName !== undefined ? nextOfKinName : existing.rows[0].next_of_kin_name},
            next_of_kin_relationship = ${nextOfKinRelationship !== undefined ? nextOfKinRelationship : existing.rows[0].next_of_kin_relationship},
            next_of_kin_phone = ${nextOfKinPhone !== undefined ? nextOfKinPhone : existing.rows[0].next_of_kin_phone},
            updated_at = NOW()
          WHERE user_id = ${user.email}
          RETURNING *
        `;

        return res.status(200).json({ employee: result.rows[0] });
      }
    } catch (error) {
      console.error('Error updating employee:', error);
      return res.status(500).json({ error: 'Failed to update employee' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}


