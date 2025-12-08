# Customer Onboarding System

## Overview

Implement a comprehensive customer onboarding system that allows customers to enter company details, stakeholder contact information (primary stakeholders: project, finance, IT, etc. and other stakeholders defined by the client), payment details, VAT number, sign-off process, PO requirements, parent company details, and sign contracts/accept terms and conditions.

## Dependencies

**Phase 1** - Audit trails must be implemented (all onboarding actions logged)

## Database Schema

### Customers Table

```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  company_registration_number TEXT,
  vat_number TEXT,
  parent_company_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  payment_terms TEXT,
  payment_method TEXT,
  po_required BOOLEAN DEFAULT false,
  po_format TEXT,
  sign_off_process TEXT,
  contract_signed BOOLEAN DEFAULT false,
  contract_signed_at TIMESTAMP,
  terms_accepted BOOLEAN DEFAULT false,
  terms_accepted_at TIMESTAMP,
  contract_document_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'on_hold')),
  created_by TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Customer Stakeholders Table

```sql
CREATE TABLE customer_stakeholders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  stakeholder_type TEXT NOT NULL CHECK (stakeholder_type IN ('project', 'finance', 'it', 'other')),
  stakeholder_role TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Customer Addresses Table

```sql
CREATE TABLE customer_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  address_type TEXT NOT NULL CHECK (address_type IN ('billing', 'shipping', 'registered', 'other')),
  address_line_1 TEXT NOT NULL,
  address_line_2 TEXT,
  city TEXT NOT NULL,
  county TEXT,
  postcode TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'UK',
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## API Endpoints

### Customers API (`api/customers/index.ts`)

- `GET /api/customers` - List all customers
- `GET /api/customers/[id]` - Get customer details
- `POST /api/customers` - Create new customer
- `PATCH /api/customers/[id]` - Update customer
- `DELETE /api/customers/[id]` - Delete customer

### Customer Stakeholders API (`api/customers/[id]/stakeholders.ts`)

- `GET /api/customers/[id]/stakeholders` - List stakeholders
- `POST /api/customers/[id]/stakeholders` - Add stakeholder
- `PATCH /api/customers/[id]/stakeholders/[stakeholderId]` - Update stakeholder
- `DELETE /api/customers/[id]/stakeholders/[stakeholderId]` - Remove stakeholder

### Customer Contracts API (`api/customers/[id]/contracts.ts`)

- `POST /api/customers/[id]/sign-contract` - Sign contract
- `POST /api/customers/[id]/accept-terms` - Accept terms and conditions

## Frontend Components

### Customer Onboarding Form (`src/components/customers/CustomerOnboardingForm.tsx`)
- Multi-step form for customer data collection
- Company information
- Stakeholder management
- Payment and PO configuration
- Contract signing interface

### Customer List (`src/components/customers/CustomerList.tsx`)
- List all customers
- Filter and search
- View customer details

### Customer Detail (`src/components/customers/CustomerDetail.tsx`)
- Full customer information
- Stakeholders list
- Contract status
- Edit capabilities

## Integration Points

- **Quotes System**: Link quotes to customers
- **Client Portal**: Use customer data for portal access
- **Audit Trails**: Log all onboarding actions

## Testing

- Test customer creation and updates
- Test stakeholder management
- Test contract signing workflow
- Test payment/PO configuration
- Test audit logging

## Deliverables

1. Database tables for customers, stakeholders, addresses
2. Customer API endpoints
3. Stakeholder management API
4. Contract signing API
5. Customer onboarding form component
6. Customer list and detail views
7. Integration with audit trails

## Success Criteria

- Customers can be onboarded with all required information
- Stakeholders can be added and managed
- Contracts can be signed and terms accepted
- All actions logged to audit trails
- Data is properly validated and stored

