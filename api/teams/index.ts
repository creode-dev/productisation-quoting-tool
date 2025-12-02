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
      const result = await sql`
        SELECT 
          id,
          name,
          description,
          created_at,
          updated_at
        FROM teams
        ORDER BY name
      `;

      return res.status(200).json({ teams: result.rows });
    } catch (error) {
      console.error('Error fetching teams:', error);
      return res.status(500).json({ error: 'Failed to fetch teams' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { name, description } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Team name is required' });
      }

      const result = await sql`
        INSERT INTO teams (name, description)
        VALUES (${name}, ${description || null})
        RETURNING *
      `;

      return res.status(200).json({ team: result.rows[0] });
    } catch (error: any) {
      console.error('Error creating team:', error);
      if (error.code === '23505') {
        // Unique constraint violation
        return res.status(409).json({ error: 'Team with this name already exists' });
      }
      return res.status(500).json({ error: 'Failed to create team' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

