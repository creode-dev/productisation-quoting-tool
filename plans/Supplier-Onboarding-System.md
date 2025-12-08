# Supplier Onboarding System

## Overview

Implement a supplier onboarding system for freelancers and external suppliers. Collect business details, terms acceptance, bank details, and holding company information to ensure timely payments.

## Dependencies

**Phase 1** - Audit trails must be implemented (all onboarding actions logged)

## Database Schema

### Suppliers Table

```sql
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL,
  business_type TEXT CHECK (business_type IN ('freelancer', 'agency', 'company', 'other')),
  company_registration_number TEXT,
  vat_number TEXT,
  holding_company_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  terms_accepted BOOLEAN DEFAULT false,
  terms_accepted_at TIMESTAMP,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'approved', 'rejected', 'suspended')),
  created_by TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Supplier Bank Details Table

```sql
CREATE TABLE supplier_bank_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  account_holder_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  sort_code TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  iban TEXT,
  swift_code TEXT,
  is_primary BOOLEAN DEFAULT true,
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## API Endpoints

### Suppliers API (`api/suppliers/index.ts`)

- `GET /api/suppliers` - List all suppliers
- `GET /api/suppliers/[id]` - Get supplier details
- `POST /api/suppliers` - Create new supplier
- `PATCH /api/suppliers/[id]` - Update supplier
- `POST /api/suppliers/[id]/approve` - Approve supplier
- `POST /api/suppliers/[id]/accept-terms` - Accept terms

### Supplier Bank Details API (`api/suppliers/[id]/bank-details.ts`)

- `GET /api/suppliers/[id]/bank-details` - Get bank details
- `POST /api/suppliers/[id]/bank-details` - Add bank details
- `PATCH /api/suppliers/[id]/bank-details/[detailId]` - Update bank details
- `POST /api/suppliers/[id]/bank-details/[detailId]/verify` - Verify bank details

## Frontend Components

### Supplier Onboarding Form (`src/components/suppliers/SupplierOnboardingForm.tsx`)
- Business information form
- Terms acceptance
- Bank details form
- Holding company selection

### Supplier List (`src/components/suppliers/SupplierList.tsx`)
- List all suppliers
- Filter by status
- Search functionality

### Supplier Detail (`src/components/suppliers/SupplierDetail.tsx`)
- Full supplier information
- Bank details
- Payment history
- Approval workflow

## Integration Points

- **Payment System**: Use bank details for payments
- **Audit Trails**: Log all onboarding actions
- **Invoice Generation**: Link to suppliers for payment

## Testing

- Test supplier creation
- Test bank details management
- Test terms acceptance
- Test approval workflow
- Test audit logging

## Deliverables

1. Database tables for suppliers and bank details
2. Supplier API endpoints
3. Bank details API
4. Supplier onboarding form
5. Supplier list and detail views
6. Integration with audit trails

## Success Criteria

- Suppliers can be onboarded with all required information
- Bank details can be added and verified
- Terms can be accepted
- Approval workflow works correctly
- All actions logged to audit trails

