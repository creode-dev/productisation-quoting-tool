import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCurrentUser, isAdmin } from '../../lib/auth';
import { sql } from '../../lib/db';
import { sendQuoteForSigning } from '../../lib/hellosign';
import { logAction, createChangesObject } from '../../lib/audit';
import { uploadDocument } from '../../lib/googleDrive';
import { getQuotesFolderId } from '../../lib/googleDrive';
import { generatePDFBuffer } from '../../lib/pdfGenerator';

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
      return res.status(400).json({ error: 'Quote ID is required' });
    }

    const { signerEmail, signerName, message } = req.body;

    if (!signerEmail || !signerName) {
      return res.status(400).json({ error: 'Signer email and name are required' });
    }

    // Get quote
    const quoteResult = await sql`
      SELECT * FROM quotes WHERE id = ${id} LIMIT 1
    `;

    if (quoteResult.rows.length === 0) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    const quote = quoteResult.rows[0];

    // Check permissions - quote creator or admin only
    if (quote.user_id !== user.email && !isAdmin(user)) {
      return res.status(403).json({ error: 'Not authorized to send this quote for signing' });
    }

    // Check if already sent for signing
    const existingApproval = await sql`
      SELECT * FROM quote_approvals WHERE quote_id = ${id} LIMIT 1
    `;

    if (existingApproval.rows.length > 0) {
      const approval = existingApproval.rows[0];
      if (approval.status === 'pending' || approval.status === 'signed') {
        return res.status(400).json({ 
          error: 'Quote has already been sent for signing',
          approval: {
            status: approval.status,
            signingUrl: approval.hellosign_signature_request_url,
          }
        });
      }
    }

    // Generate PDF using proper PDF generator
    const quoteData = quote.quote_data as any; // Quote type from database
    const pdfBuffer = await generatePDFBuffer(quoteData, {
      companyName: quote.company_name,
      projectName: quote.project_name,
      businessUnit: quote.business_unit || undefined,
      targetCompletionDate: quote.target_completion_date || undefined,
    });

    // Upload PDF to Google Drive
    const quotesFolderId = await getQuotesFolderId();
    const fileName = `quote-${quote.company_name}-${quote.project_name}-${Date.now()}.pdf`;
    const { fileId } = await uploadDocument(
      quotesFolderId,
      fileName,
      'application/pdf',
      pdfBuffer
    );

    // Get a direct download link for HelloSign (we'll need to make the file publicly accessible)
    // For now, we'll use the webViewLink, but HelloSign needs a direct download URL
    // We might need to create a temporary public link or use Google Drive API to get download URL
    const fileDownloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

    // Send to HelloSign
    const { signatureRequestId, signingUrl } = await sendQuoteForSigning({
      signerEmail,
      signerName,
      fileUrl: fileDownloadUrl,
      title: `Quote: ${quote.project_name}`,
      subject: `Please sign quote for ${quote.project_name}`,
      message: message || `Please review and sign this quote for ${quote.project_name}.`,
    });

    // Store approval record
    const approvalResult = await sql`
      INSERT INTO quote_approvals (
        quote_id,
        hellosign_signature_request_id,
        hellosign_signature_request_url,
        signer_email,
        signer_name,
        status,
        created_at,
        updated_at
      ) VALUES (
        ${id},
        ${signatureRequestId},
        ${signingUrl},
        ${signerEmail},
        ${signerName},
        'pending',
        NOW(),
        NOW()
      )
      RETURNING *
    `;

    // Update quote status to 'sent'
    await sql`
      UPDATE quotes
      SET status = 'sent', updated_at = NOW()
      WHERE id = ${id}
    `;

    // Log action
    await logAction(req, {
      userId: user.email,
      action: 'quote.sent_for_signing',
      entityType: 'quote',
      entityId: id,
      changes: createChangesObject(
        { status: quote.status },
        { status: 'sent', approvalId: approvalResult.rows[0].id }
      ),
      metadata: {
        signerEmail,
        signerName,
        signatureRequestId,
      },
    });

    return res.status(200).json({
      success: true,
      approval: approvalResult.rows[0],
      signingUrl,
    });
  } catch (error: any) {
    console.error('Error sending quote for signing:', error);
    return res.status(500).json({ error: error.message || 'Failed to send quote for signing' });
  }
}

