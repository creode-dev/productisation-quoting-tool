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
      // Get employee ID
      const employee = await sql`
        SELECT id FROM employees WHERE user_id = ${user.email} LIMIT 1
      `;

      if (employee.rows.length === 0) {
        return res.status(404).json({ error: 'Employee profile not found' });
      }

      const employeeId = employee.rows[0].id;

      const result = await sql`
        SELECT 
          id,
          employee_id,
          document_type,
          file_name,
          google_drive_file_id,
          mime_type,
          file_size,
          uploaded_at
        FROM employee_documents
        WHERE employee_id = ${employeeId}
        ORDER BY uploaded_at DESC
      `;

      return res.status(200).json({ documents: result.rows });
    } catch (error) {
      console.error('Error fetching documents:', error);
      return res.status(500).json({ error: 'Failed to fetch documents' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}





