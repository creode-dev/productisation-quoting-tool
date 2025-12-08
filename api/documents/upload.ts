import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCurrentUser } from '../lib/auth';
import { sql } from '../lib/db';
import { createEmployeeFolder, uploadDocument } from '../lib/googleDrive';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get employee
    const employee = await sql`
      SELECT id, name FROM employees WHERE user_id = ${user.email} LIMIT 1
    `;

    if (employee.rows.length === 0) {
      return res.status(404).json({ error: 'Employee profile not found' });
    }

    const emp = employee.rows[0];

    // Parse multipart form data
    // Note: Vercel serverless functions handle multipart differently
    // We'll need to use a library like busboy or multer
    // For now, assuming the file is passed as base64 or buffer in body
    const { file, fileName, mimeType, documentType } = req.body;

    if (!file || !fileName || !documentType) {
      return res.status(400).json({ error: 'file, fileName, and documentType are required' });
    }

    // Validate document type
    if (!['passport', 'visa', 'other'].includes(documentType)) {
      return res.status(400).json({ error: 'Invalid document type' });
    }

    // Create or get employee folder
    const folderId = await createEmployeeFolder(emp.id, emp.name);

    // Convert file to buffer if it's base64
    let fileBuffer: Buffer;
    if (typeof file === 'string') {
      // Assume base64
      fileBuffer = Buffer.from(file, 'base64');
    } else if (Buffer.isBuffer(file)) {
      fileBuffer = file;
    } else {
      return res.status(400).json({ error: 'Invalid file format' });
    }

    // Upload to Google Drive
    const { fileId, webViewLink } = await uploadDocument(
      folderId,
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
        ${emp.id},
        ${documentType},
        ${fileName},
        ${fileId},
        ${mimeType || 'application/octet-stream'},
        ${fileBuffer.length}
      )
      RETURNING *
    `;

    return res.status(200).json({
      document: result.rows[0],
      webViewLink,
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    return res.status(500).json({ error: 'Failed to upload document' });
  }
}




