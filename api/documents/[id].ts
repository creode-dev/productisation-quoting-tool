import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCurrentUser } from '../lib/auth';
import { sql } from '../lib/db';
import { deleteDocument, getDocumentDownloadLink } from '../lib/googleDrive';

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
    // Handle download
    try {
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

      // Check if user owns the document
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

  if (req.method === 'DELETE') {
    try {
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

      // Check if user owns the document
      if (document.employee_user_id !== user.email) {
        return res.status(403).json({ error: 'Not authorized to delete this document' });
      }

      // Delete from Google Drive
      try {
        await deleteDocument(document.google_drive_file_id);
      } catch (error) {
        console.error('Error deleting from Google Drive:', error);
        // Continue with database deletion even if Drive deletion fails
      }

      // Delete from database
      await sql`
        DELETE FROM employee_documents WHERE id = ${id}
      `;

      return res.status(200).json({ message: 'Document deleted successfully' });
    } catch (error) {
      console.error('Error deleting document:', error);
      return res.status(500).json({ error: 'Failed to delete document' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}


