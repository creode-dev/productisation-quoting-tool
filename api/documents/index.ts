import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCurrentUser } from '../lib/auth';
import { sql } from '../lib/db';
import { uploadDocument, createEmployeeFolder, deleteDocument, getDocumentDownloadLink } from '../lib/googleDrive';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  if (req.method === 'POST') {
    // Handle document upload
    try {
      const { documentType, fileName, fileContent, mimeType } = req.body;

      if (!documentType || !fileName || !fileContent) {
        return res.status(400).json({ error: 'documentType, fileName, and fileContent are required' });
      }

      // Get or create employee
      let employee = await sql`
        SELECT id, name FROM employees WHERE user_id = ${user.email} LIMIT 1
      `;

      if (employee.rows.length === 0) {
        return res.status(404).json({ error: 'Employee profile not found. Please create your profile first.' });
      }

      const employeeId = employee.rows[0].id;
      const employeeName = employee.rows[0].name;

      // Create employee folder if it doesn't exist
      let employeeFolderId: string;
      try {
        employeeFolderId = await createEmployeeFolder(employeeId, employeeName);
      } catch (error) {
        console.error('Error creating employee folder:', error);
        return res.status(500).json({ error: 'Failed to create employee folder' });
      }

      // Convert fileContent to buffer if it's base64
      let fileBuffer: Buffer;
      if (typeof fileContent === 'string') {
        fileBuffer = Buffer.from(fileContent, 'base64');
      } else if (Buffer.isBuffer(fileContent)) {
        fileBuffer = fileContent;
      } else {
        return res.status(400).json({ error: 'Invalid file format' });
      }

      // Upload to Google Drive
      const { fileId } = await uploadDocument(
        employeeFolderId,
        fileName,
        mimeType || 'application/octet-stream',
        fileBuffer
      );

      // Save to database
      const result = await sql`
        INSERT INTO employee_documents (
          employee_id,
          document_type,
          file_name,
          google_drive_file_id,
          mime_type,
          file_size
        ) VALUES (
          ${employeeId},
          ${documentType},
          ${fileName},
          ${fileId},
          ${mimeType || 'application/octet-stream'},
          ${fileBuffer.length}
        )
        RETURNING *
      `;

      return res.status(200).json({ document: result.rows[0] });
    } catch (error: any) {
      console.error('Error uploading document:', error);
      return res.status(500).json({ error: error.message || 'Failed to upload document' });
    }
  }

  // Handle document by ID if id query param exists
  const { id, me } = req.query;
  if (id && !me) {
    const docId = Array.isArray(id) ? id[0] : id;
    
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
          WHERE d.id = ${docId}
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
          WHERE d.id = ${docId}
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
          DELETE FROM employee_documents WHERE id = ${docId}
        `;

        return res.status(200).json({ message: 'Document deleted successfully' });
      } catch (error) {
        console.error('Error deleting document:', error);
        return res.status(500).json({ error: 'Failed to delete document' });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (req.method === 'GET') {
    try {
      const { me } = req.query;

      // If ?me=true, return current user's documents
      const meStr = Array.isArray(me) ? me[0] : me;
      if (meStr === 'true') {
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
      }

      // Otherwise return all documents (admin view - restrict in production)
      const result = await sql`
        SELECT 
          d.id,
          d.employee_id,
          d.document_type,
          d.file_name,
          d.google_drive_file_id,
          d.mime_type,
          d.file_size,
          d.uploaded_at,
          e.name as employee_name
        FROM employee_documents d
        JOIN employees e ON d.employee_id = e.id
        ORDER BY d.uploaded_at DESC
      `;

      return res.status(200).json({ documents: result.rows });
    } catch (error) {
      console.error('Error fetching documents:', error);
      return res.status(500).json({ error: 'Failed to fetch documents' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

