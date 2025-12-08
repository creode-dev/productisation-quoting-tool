import type { VercelRequest, VercelResponse } from '@vercel/node';

// Lazy load modules to avoid import errors
async function getDb() {
  const { sql } = await import('../../lib/db');
  return sql;
}

async function getAudit() {
  const { logAction, createChangesObject } = await import('../../lib/audit');
  return { logAction, createChangesObject };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('HelloSign webhook received');
    console.log('Method:', req.method);
    console.log('Body type:', typeof req.body);
    
    // Handle test events or empty bodies
    // HelloSign expects the exact response: "Hello API Event Received"
    if (!req.body || (typeof req.body === 'object' && Object.keys(req.body).length === 0)) {
      console.log('Empty or test webhook received');
      return res.status(200).send('Hello API Event Received');
    }

    // Try to parse event
    const event = req.body.event || req.body;
    const eventType = event?.event_type || event?.type;

    // Handle test events - HelloSign expects exact string response
    if (eventType === 'callback_test' || eventType === 'test' || !eventType) {
      console.log('Test event received');
      return res.status(200).send('Hello API Event Received');
    }

    // Process real events
    const signatureRequest = event?.event_data?.signature_request || event?.signature_request;
    if (!signatureRequest) {
      console.error('No signature_request in webhook payload');
      // Return 200 for unknown events to prevent retries
      return res.status(200).send('Hello API Event Received');
    }

    const signatureRequestId = signatureRequest.signature_request_id;
    if (!signatureRequestId) {
      console.error('No signature_request_id in payload');
      return res.status(200).send('Hello API Event Received');
    }

    // Find the approval record
    let approvalResult;
    try {
      const sql = await getDb();
      approvalResult = await sql`
        SELECT 
          qa.*,
          q.id as quote_id,
          q.user_id,
          q.company_name,
          q.project_name,
          q.status as quote_status
        FROM quote_approvals qa
        JOIN quotes q ON qa.quote_id = q.id
        WHERE qa.hellosign_signature_request_id = ${signatureRequestId}
        LIMIT 1
      `;
    } catch (dbError: any) {
      console.error('Database error:', dbError);
      // Return success to prevent retries
      return res.status(200).send('Hello API Event Received');
    }

    if (approvalResult.rows.length === 0) {
      console.error('Approval record not found for signature request:', signatureRequestId);
      // Return 200 to prevent HelloSign from retrying for unknown signature requests
      return res.status(200).send('Hello API Event Received');
    }

    const approval = approvalResult.rows[0];
    const quote = {
      id: approval.quote_id,
      userId: approval.user_id,
      status: approval.quote_status,
    };

    // Handle different event types
    if (eventType === 'signature_request_signed') {
      try {
        // Extract custom field values
        const customFields = signatureRequest.custom_fields || [];
        const poRequiredField = customFields.find((f: any) => f.name === 'PO Required');
        const poNumberField = customFields.find((f: any) => f.name === 'PO Number');
        const rejectionReasonField = customFields.find((f: any) => f.name === 'Rejection Reason');

        const poRequired = poRequiredField?.value === 'true' || poRequiredField?.value === true;
        const poNumber = poNumberField?.value || null;
        const rejectionReason = rejectionReasonField?.value || null;

        // If there's a rejection reason, treat as declined
        if (rejectionReason) {
          const sql = await getDb();
          await sql`
            UPDATE quote_approvals
            SET 
              status = 'declined',
              rejection_reason = ${rejectionReason},
              declined_at = NOW(),
              updated_at = NOW()
            WHERE id = ${approval.id}
          `;

          await sql`
            UPDATE quotes
            SET 
              status = 'rejected',
              updated_at = NOW()
            WHERE id = ${quote.id}
          `;

          // Log action (don't fail if this errors)
          try {
            const { logAction, createChangesObject } = await getAudit();
            await logAction(req, {
              userId: quote.userId,
              action: 'quote.declined',
              entityType: 'quote',
              entityId: quote.id,
              changes: createChangesObject(
                { status: quote.status, approvalStatus: approval.status },
                { status: 'rejected', approvalStatus: 'declined' }
              ),
              metadata: {
                signatureRequestId,
                rejectionReason,
                signerEmail: approval.signer_email,
              },
            });
          } catch (auditError) {
            console.error('Audit logging error:', auditError);
          }
        } else {
          const sql = await getDb();
          await sql`
            UPDATE quote_approvals
            SET 
              status = 'signed',
              po_required = ${poRequired},
              po_number = ${poNumber},
              signed_at = NOW(),
              updated_at = NOW()
            WHERE id = ${approval.id}
          `;

          await sql`
            UPDATE quotes
            SET 
              status = 'accepted',
              accepted_at = NOW(),
              accepted_by = ${approval.signer_email},
              updated_at = NOW()
            WHERE id = ${quote.id}
          `;

          // Log action (don't fail if this errors)
          try {
            const { logAction, createChangesObject } = await getAudit();
            await logAction(req, {
              userId: quote.userId,
              action: 'quote.signed',
              entityType: 'quote',
              entityId: quote.id,
              changes: createChangesObject(
                { status: quote.status, approvalStatus: approval.status },
                { status: 'accepted', approvalStatus: 'signed' }
              ),
              metadata: {
                signatureRequestId,
                poRequired,
                poNumber,
                signerEmail: approval.signer_email,
              },
            });
          } catch (auditError) {
            console.error('Audit logging error:', auditError);
          }
        }
      } catch (updateError: any) {
        console.error('Error updating quote/approval:', updateError);
        // Continue to return success
      }
    } else if (eventType === 'signature_request_declined') {
      try {
        const sql = await getDb();
        const customFields = signatureRequest.custom_fields || [];
        const rejectionReasonField = customFields.find((f: any) => f.name === 'Rejection Reason');
        const rejectionReason = rejectionReasonField?.value || 'No reason provided';

        await sql`
          UPDATE quote_approvals
          SET 
            status = 'declined',
            rejection_reason = ${rejectionReason},
            declined_at = NOW(),
            updated_at = NOW()
          WHERE id = ${approval.id}
        `;

        await sql`
          UPDATE quotes
          SET 
            status = 'rejected',
            updated_at = NOW()
          WHERE id = ${quote.id}
        `;

        try {
          const { logAction, createChangesObject } = await getAudit();
          await logAction(req, {
            userId: quote.userId,
            action: 'quote.declined',
            entityType: 'quote',
            entityId: quote.id,
            changes: createChangesObject(
              { status: quote.status, approvalStatus: approval.status },
              { status: 'rejected', approvalStatus: 'declined' }
            ),
            metadata: {
              signatureRequestId,
              rejectionReason,
              signerEmail: approval.signer_email,
            },
          });
        } catch (auditError) {
          console.error('Audit logging error:', auditError);
        }
      } catch (updateError: any) {
        console.error('Error updating quote/approval:', updateError);
      }
    } else if (eventType === 'signature_request_cancelled') {
      try {
        const sql = await getDb();
        await sql`
          UPDATE quote_approvals
          SET 
            status = 'cancelled',
            updated_at = NOW()
          WHERE id = ${approval.id}
        `;

        try {
          const { logAction, createChangesObject } = await getAudit();
          await logAction(req, {
            userId: quote.userId,
            action: 'quote.approval_cancelled',
            entityType: 'quote',
            entityId: quote.id,
            changes: createChangesObject(
              { approvalStatus: approval.status },
              { approvalStatus: 'cancelled' }
            ),
            metadata: {
              signatureRequestId,
            },
          });
        } catch (auditError) {
          console.error('Audit logging error:', auditError);
        }
      } catch (updateError: any) {
        console.error('Error updating approval:', updateError);
      }
    }

    // Always return success to HelloSign
    return res.status(200).send('Hello API Event Received');
  } catch (error: any) {
    console.error('Error processing HelloSign webhook:', error);
    console.error('Error stack:', error.stack);
    // Always return 200 to prevent HelloSign from retrying
    return res.status(200).send('Hello API Event Received');
  }
}
