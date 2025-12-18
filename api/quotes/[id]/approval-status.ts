import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCurrentUser } from '../../lib/auth';
import { sql } from '../../lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = getCurrentUser(req);
  
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
    if (!id) {
      return res.status(400).json({ error: 'Quote ID is required' });
    }

    // Get approval record
    const approvalResult = await sql`
      SELECT 
        qa.*,
        q.user_id,
        q.status as quote_status
      FROM quote_approvals qa
      JOIN quotes q ON qa.quote_id = q.id
      WHERE qa.quote_id = ${id}
      LIMIT 1
    `;

    if (approvalResult.rows.length === 0) {
      return res.status(200).json({ 
        hasApproval: false,
        approval: null 
      });
    }

    const approval = approvalResult.rows[0];

    return res.status(200).json({
      hasApproval: true,
      approval: {
        id: approval.id,
        status: approval.status,
        signerEmail: approval.signer_email,
        signerName: approval.signer_name,
        signingUrl: approval.hellosign_signature_request_url,
        poRequired: approval.po_required,
        poNumber: approval.po_number,
        rejectionReason: approval.rejection_reason,
        signedAt: approval.signed_at,
        declinedAt: approval.declined_at,
        createdAt: approval.created_at,
        updatedAt: approval.updated_at,
      },
    });
  } catch (error: any) {
    console.error('Error fetching approval status:', error);
    return res.status(500).json({ error: 'Failed to fetch approval status' });
  }
}



