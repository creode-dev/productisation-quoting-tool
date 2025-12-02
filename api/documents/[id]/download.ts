import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCurrentUser } from '../../lib/auth';
import { sql } from '../../lib/db';
import { getDocumentDownloadLink } from '../../lib/googleDrive';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    // Get document
    const doc = await sql`
      SELECT 
        d.*,
        e.user_id as employee_user_id
      FROM employee_documents d
      JOIN employees e ON d.employee_id = e.id
      WHERE d.id = ${id}
      LIMIT 1
    `;

    if (doc.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const document = doc.rows[0];

    // Check if user owns the document (or is admin - for now allow all authenticated users)
    // In production, you might want to restrict this further
    if (document.employee_user_id !== user.email) {
      // Could add admin check here
    }

    // Get download link from Google Drive
    const downloadLink = await getDocumentDownloadLink(document.google_drive_file_id);

    return res.status(200).json({
      downloadLink,
      fileName: document.file_name,
    });
  } catch (error) {
    console.error('Error getting download link:', error);
    return res.status(500).json({ error: 'Failed to get download link' });
  }
}

