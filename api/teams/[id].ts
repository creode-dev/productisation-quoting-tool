import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCurrentUser } from '../lib/auth';
import { sql } from '../lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
    if (!id) {
      return res.status(400).json({ error: "ID is required" });
    }

  if (req.method === 'PUT') {
    try {
      const { name, description } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Team name is required' });
      }

      const result = await sql`
        UPDATE teams
        SET 
          name = ${name},
          description = ${description !== undefined ? description : sql`description`},
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `;

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Team not found' });
      }

      return res.status(200).json({ team: result.rows[0] });
    } catch (error: any) {
      console.error('Error updating team:', error);
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Team with this name already exists' });
      }
      return res.status(500).json({ error: 'Failed to update team' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      // Check if team has employees
      const employees = await sql`
        SELECT COUNT(*) as count FROM employees WHERE team_id = ${id}
      `;

      if (parseInt(employees.rows[0].count) > 0) {
        return res.status(400).json({ error: 'Cannot delete team with assigned employees' });
      }

      const result = await sql`
        DELETE FROM teams WHERE id = ${id} RETURNING *
      `;

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Team not found' });
      }

      return res.status(200).json({ message: 'Team deleted successfully' });
    } catch (error) {
      console.error('Error deleting team:', error);
      return res.status(500).json({ error: 'Failed to delete team' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}





