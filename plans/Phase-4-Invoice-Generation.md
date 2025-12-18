# Phase 4: Invoice Generation

## Overview

Generate invoices in Xero from accepted quotes. Support multiple invoicing approaches (select items, percentage, per-phase) with the approach to be standardized in the future. This phase depends on Phase 1 (audit trails) and Phase 2 (quote approval - invoices need accepted quotes).

## Dependencies

**Phase 1** - Audit trails must be implemented (all invoice actions logged)  
**Phase 2** - Quote approval system must exist (invoices can only be created for accepted quotes)

## Database Schema

### Quote Invoices Table

Create `quote_invoices` table in [api/lib/db.ts](api/lib/db.ts):

- `id` (UUID, primary key)
- `quote_id` (UUID, foreign key to quotes)
- `xero_invoice_id` (TEXT, unique, Xero invoice ID)
- `xero_invoice_number` (TEXT, Xero invoice number)
- `invoicing_approach` (TEXT, enum: select_items, percentage, per_phase)
- `invoice_amount` (DECIMAL, total invoice amount)
- `invoice_data` (JSONB, stores approach-specific data: selected items, percentage value, phase info)
- `created_by` (TEXT, user email)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Indexes

- Index on `quote_invoices.quote_id`
- Index on `quote_invoices.xero_invoice_id`

## Xero Integration

### Xero Invoice Service ([api/lib/xero.ts](api/lib/xero.ts))

Extend existing Xero service with invoice creation:

- `createInvoiceFromQuote(quoteId, contactId, invoiceData)` - Create invoice in Xero
  - Generate invoice line items based on approach
  - Create invoice via Xero API
  - Return Xero invoice ID and number
- `getInvoice(invoiceId)` - Get invoice details from Xero
- `updateInvoice(invoiceId, updates)` - Update invoice in Xero
- `getInvoicePDF(invoiceId)` - Download invoice PDF

### Required Xero Scopes

Update Xero OAuth scopes to include:
- `accounting.transactions` - For creating invoices
- `accounting.contacts.read` - Already have for company search

### Environment Variables

- Existing Xero variables: `XERO_CLIENT_ID`, `XERO_CLIENT_SECRET`, `XERO_TENANT_ID`, `XERO_ACCESS_TOKEN`

## API Endpoints

### Create Invoice API ([api/quotes/[id]/create-invoice.ts](api/quotes/[id]/create-invoice.ts))

- `POST /api/quotes/[id]/create-invoice` - Create invoice in Xero
  - Request body:
    ```json
    {
      "invoicingApproach": "select_items" | "percentage" | "per_phase",
      "selectedItems": ["itemId1", "itemId2"], // if select_items
      "percentage": 50, // if percentage (0-100)
      "phaseId": "phase-id" // if per_phase
    }
    ```
  - Validate quote is accepted (status = 'accepted')
  - Generate invoice line items based on approach
  - Create invoice in Xero via API
  - Store invoice record in database
  - Log to audit trail
  - Return invoice details
  - Permission: Team members and admins (subject to change)

### Invoice List API ([api/quotes/[id]/invoices.ts](api/quotes/[id]/invoices.ts))

- `GET /api/quotes/[id]/invoices` - List all invoices for a quote
  - Returns array of invoice records with Xero IDs
  - Include invoice number, amount, approach, creation date

### Invoice Details API ([api/quotes/invoices/[id].ts](api/quotes/invoices/[id].ts))

- `GET /api/quotes/invoices/[id]` - Get invoice details
  - Fetches from Xero and returns invoice data
  - Include line items, status, amounts

## Frontend Components

### Create Invoice Button ([src/components/QuoteView.tsx](src/components/QuoteView.tsx))

- Add "Create Invoice" button
- Only show for accepted quotes (status = 'accepted')
- Opens invoice creation modal
- Permission check: Team members and admins

### Invoice Creation Modal ([src/components/CreateInvoiceModal.tsx](src/components/CreateInvoiceModal.tsx))

- Form to select invoicing approach:
  - Radio buttons or tabs for approach selection
  - **Select Items**: 
    - Checkbox list of all quote items (phases and items)
    - Show item name, quantity, unit price, total
    - Allow multi-select across phases
  - **Percentage**: 
    - Input for percentage (0-100)
    - Real-time preview of calculated amount
    - Show: `quote.total * (percentage / 100)`
  - **Per Phase**: 
    - Dropdown to select phase
    - Show phase total
- Preview section showing:
  - Invoice amount
  - Number of line items
  - Summary of what will be invoiced
- Create button to submit
- Cancel button
- Loading state during creation
- Error handling and display

### Invoice List Display ([src/components/QuoteInvoices.tsx](src/components/QuoteInvoices.tsx))

- Display list of invoices created for a quote
- Table or card layout showing:
  - Invoice number (from Xero)
  - Invoice amount
  - Approach used
  - Creation date
  - Created by
- Actions:
  - Link to view invoice in Xero (opens in new tab)
  - Download invoice PDF button
  - View invoice details
- Empty state if no invoices

## Invoice Generation Logic

### Select Items Approach

- User selects specific items from quote (can be across multiple phases)
- Create invoice line items for selected items only
- Each line item:
  - Description: Quote item label
  - Quantity: From quote item
  - Unit price: From quote item
  - Total: Quantity × Unit price
- Sum selected items for invoice total

### Percentage Approach

- User enters percentage (e.g., 50%)
- Calculate amount: `quote.total * (percentage / 100)`
- Options:
  - Single line item: "50% of [Project Name]"
  - Or create line items proportionally across all quote items
- Store percentage value in `invoice_data` JSONB

### Per Phase Approach

- User selects a phase
- Create invoice line items for all items in that phase
- Each phase item becomes a line item
- Sum phase items for invoice total
- Store phase ID in `invoice_data` JSONB

## Implementation Details

### Invoice Line Items

- Map quote items to Xero invoice line items
- Use quote item labels as line item descriptions
- Use quote item totals as line item amounts
- Handle tax/VAT if required (may need configuration)
- Use Xero's line item API structure

### Xero Contact

- Use `company_xero_id` from quote to identify Xero contact
- Verify contact exists before creating invoice
- Handle errors if contact not found
- Use contact ID in invoice creation

### Error Handling

- Handle Xero API errors gracefully
- Handle missing Xero contact
- Handle invalid invoice amounts
- Handle duplicate invoice creation
- Allow retry on failure
- Display user-friendly error messages

### Invoice Status Tracking

- Store Xero invoice ID for tracking
- Optionally sync invoice status from Xero (draft, submitted, paid, etc.)
- Display invoice status in UI
- Future: Periodic sync of invoice status

## Testing

- Test invoice creation with each approach
- Test Xero API integration
- Test error handling (missing contact, API errors)
- Test permission checks
- Test that only accepted quotes can be invoiced
- Test invoice data storage
- Test audit logging integration

## Libraries

- Extend existing Xero integration in [api/lib/xero.ts](api/lib/xero.ts)
- May need `xero-node` SDK or continue with direct API calls

## Open Issue

**Invoicing Approach Standardization**: The system will initially support all invoicing approaches (select items, percentage, per-phase), but the standard approach needs to be determined and documented. This should be resolved during implementation.

## Deliverables

1. `quote_invoices` database table
2. Extended Xero service for invoice creation
3. Create invoice API endpoint
4. Invoice list API endpoint
5. Invoice details API endpoint
6. Invoice creation modal component
7. Invoice list display component
8. Integration with QuoteView
9. Integration with audit trails (Phase 1)
10. Error handling and validation

## Success Criteria

- Invoices can be created in Xero from accepted quotes
- All three invoicing approaches work correctly
- Invoice data is stored in database
- Invoices are linked to quotes
- All actions logged to audit trails
- Error handling works correctly
- Users can view created invoices
- Ready for future enhancements (invoice status sync, etc.)




