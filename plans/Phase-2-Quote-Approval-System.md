# Phase 2: Quote Approval System

## Overview

Enable client quote approval workflow using HelloSign (DropboxSign). Clients receive quotes via email, can accept with or without PO numbers, or reject with reasons. All actions are logged to audit trails from Phase 1.

## Dependencies

**Phase 1** - Audit trails must be implemented first as all quote approval actions will be logged.

## Database Schema

### Quote Approvals Table

Create `quote_approvals` table in [api/lib/db.ts](api/lib/db.ts):

- `id` (UUID, primary key)
- `quote_id` (UUID, foreign key to quotes, unique)
- `hellosign_signature_request_id` (TEXT, unique)
- `hellosign_signature_request_url` (TEXT)
- `signer_email` (TEXT)
- `signer_name` (TEXT)
- `status` (TEXT, enum: pending, signed, declined, cancelled)
- `po_required` (BOOLEAN)
- `po_number` (TEXT, nullable)
- `rejection_reason` (TEXT, nullable)
- `signed_at` (TIMESTAMP, nullable)
- `declined_at` (TIMESTAMP, nullable)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Indexes

- Index on `quote_approvals.quote_id`
- Index on `quote_approvals.hellosign_signature_request_id`
- Index on `quote_approvals.status`

## HelloSign Integration

### HelloSign Service ([api/lib/hellosign.ts](api/lib/hellosign.ts))

Create service wrapper for HelloSign API:

- `sendQuoteForSigning(quoteId, signerEmail, signerName)` - Create signature request
  - Generate PDF from quote using existing PDF generator
  - Upload PDF to HelloSign
  - Create signature request with custom fields (PO required checkbox, PO number text, Rejection reason text)
  - Return signature request ID and URL
- `getSignatureRequestStatus(signatureRequestId)` - Check status
- `downloadSignedDocument(signatureRequestId)` - Download signed PDF

### Environment Variables

- `HELLOSIGN_API_KEY` - HelloSign API key
- `HELLOSIGN_WEBHOOK_SECRET` - Webhook secret for verification

## API Endpoints

### Quote Signing API ([api/quotes/[id]/send-for-signing.ts](api/quotes/[id]/send-for-signing.ts))

- `POST /api/quotes/[id]/send-for-signing` - Send quote for signing
  - Request body: `{ signerEmail, signerName, message? }`
  - Generate PDF from quote
  - Create HelloSign signature request
  - Store approval record in database
  - Log to audit trail
  - Permission: Quote creator or admin only
  - Return signature request URL

### Quote Approval Webhook ([api/quotes/webhook/hellosign.ts](api/quotes/webhook/hellosign.ts))

- `POST /api/quotes/webhook/hellosign` - Handle HelloSign webhooks
  - Verify webhook signature using `HELLOSIGN_WEBHOOK_SECRET`
  - Handle events:
    - `signature_request_signed` - Extract PO number if provided, update status to 'signed', update quote status to 'accepted'
    - `signature_request_declined` - Extract rejection reason, update status to 'declined', update quote status to 'rejected'
    - `signature_request_cancelled` - Update status to 'cancelled'
  - Update `quote_approvals` record
  - Update quote `status` and `accepted_by` fields
  - Log all actions to audit trail
  - Trigger notifications (future: email notifications)

### Quote Approval Status API ([api/quotes/[id]/approval-status.ts](api/quotes/[id]/approval-status.ts))

- `GET /api/quotes/[id]/approval-status` - Get current approval status
  - Returns approval record with status, PO info, signing URL
  - Permission: Authenticated users

## Frontend Components

### Send for Signing Button ([src/components/QuoteView.tsx](src/components/QuoteView.tsx))

- Add "Send for Signing" button in quote view
- Only show for quotes that haven't been sent yet
- Opens modal to collect:
  - Client email (required)
  - Client name (required)
  - Optional message
- Permission check: Quote creator or admin only
- Show loading state during API call
- Display success message with signing link

### Approval Status Display ([src/components/QuoteApprovalStatus.tsx](src/components/QuoteApprovalStatus.tsx))

- Display current approval status
- Show signing link if pending
- Show PO number if provided
- Show rejection reason if declined
- Show signed date if completed
- Download signed document button if signed
- Display signer information

### Send for Signing Modal ([src/components/SendForSigningModal.tsx](src/components/SendForSigningModal.tsx))

- Form to collect signer email and name
- Optional message field
- Validation for email format
- Submit button with loading state
- Error handling and display

## Client Approval Flow

1. User clicks "Send for Signing" in quote view
2. User enters client email and name in modal
3. System generates PDF from quote using existing PDF generator
4. System creates HelloSign signature request with:
   - Quote PDF as document
   - Client as signer
   - Custom fields: PO required (checkbox), PO number (text, conditional), Rejection reason (text, conditional)
5. HelloSign sends email to client with signing link
6. Client clicks link, views quote in HelloSign interface
7. Client can:
   - Check "PO Required" if needed, then enter PO number
   - Or leave unchecked if PO not required
   - Or select "Reject" and provide reason
8. Client signs document
9. HelloSign webhook fires with signed event
10. System processes webhook:
    - Updates `quote_approvals` record (status=signed, PO number, signed_at)
    - Updates quote status to "accepted"
    - Updates quote `accepted_by` field
    - Logs to audit trail
    - Future: Triggers notifications and auto-creates tickets (Phase 3)

## Integration with Existing Systems

### Quote Status Updates

- Update existing quote status enum to include 'accepted' and 'rejected' (if not already present)
- Modify quote acceptance logic to use HelloSign approval

### PDF Generation

- Use existing PDF generator from [src/utils/pdfGenerator.ts](src/utils/pdfGenerator.ts)
- Ensure PDF includes all quote details
- PDF will be uploaded to HelloSign

## Error Handling

- Handle HelloSign API errors gracefully
- Handle failed signature requests
- Allow resending if initial send fails
- Handle expired signature requests (allow renewal)
- Validate webhook signatures
- Handle duplicate signature requests

## Testing

- Test HelloSign API integration
- Test webhook handling and signature verification
- Test quote status updates
- Test PO number extraction
- Test rejection flow
- Test permission checks
- Test audit logging integration

## Libraries

- `hellosign-sdk` - Official HelloSign SDK (or direct API calls)

## Deliverables

1. `quote_approvals` database table
2. HelloSign service wrapper
3. Quote signing API endpoint
4. HelloSign webhook handler
5. Send for Signing UI components
6. Approval status display component
7. Integration with audit trails (Phase 1)
8. Updated quote status handling

## Success Criteria

- Quotes can be sent for signing via HelloSign
- Clients receive email with signing link
- Clients can accept with/without PO or reject with reason
- Webhooks update quote status correctly
- All actions logged to audit trails
- PO numbers stored correctly
- Ready for Phase 3 (ticket auto-creation on acceptance)

