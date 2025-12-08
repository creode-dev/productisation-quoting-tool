import { sql } from '@vercel/postgres';

export { sql };

// Initialize database schema if needed
export async function initDatabase() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS quotes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL,
        company_name TEXT NOT NULL,
        company_xero_id TEXT,
        project_name TEXT NOT NULL,
        business_unit TEXT,
        target_completion_date DATE,
        quote_data JSONB NOT NULL,
        status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected')),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        accepted_at TIMESTAMP,
        accepted_by TEXT
      )
    `;
    
    // Create index for faster queries
    await sql`
      CREATE INDEX IF NOT EXISTS idx_quotes_user_id ON quotes(user_id)
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status)
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes(created_at DESC)
    `;
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

// Initialize employee portal database schema
export async function initEmployeePortal() {
  try {
    // Create teams table
    await sql`
      CREATE TABLE IF NOT EXISTS teams (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create employees table
    await sql`
      CREATE TABLE IF NOT EXISTS employees (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        address TEXT,
        phone TEXT,
        next_of_kin_name TEXT,
        next_of_kin_relationship TEXT,
        next_of_kin_phone TEXT,
        start_date DATE,
        holiday_entitlement_days INTEGER,
        team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
        approver_id UUID REFERENCES employees(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create holiday_requests table
    await sql`
      CREATE TABLE IF NOT EXISTS holiday_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        days_requested DECIMAL(4,1) NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
        approver_id UUID REFERENCES employees(id) ON DELETE SET NULL,
        approved_at TIMESTAMP,
        rejection_reason TEXT,
        google_calendar_event_id TEXT,
        employee_calendar_event_id TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create employee_documents table
    await sql`
      CREATE TABLE IF NOT EXISTS employee_documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        document_type TEXT NOT NULL CHECK (document_type IN ('passport', 'visa', 'other')),
        file_name TEXT NOT NULL,
        google_drive_file_id TEXT NOT NULL UNIQUE,
        mime_type TEXT,
        file_size BIGINT,
        uploaded_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create indexes for employees
    await sql`
      CREATE INDEX IF NOT EXISTS idx_employees_user_id ON employees(user_id)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_employees_team_id ON employees(team_id)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_employees_approver_id ON employees(approver_id)
    `;

    // Create indexes for holiday_requests
    await sql`
      CREATE INDEX IF NOT EXISTS idx_holiday_requests_employee_id ON holiday_requests(employee_id)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_holiday_requests_status ON holiday_requests(status)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_holiday_requests_dates ON holiday_requests(start_date, end_date)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_holiday_requests_approver_id ON holiday_requests(approver_id)
    `;

    // Create indexes for employee_documents
    await sql`
      CREATE INDEX IF NOT EXISTS idx_employee_documents_employee_id ON employee_documents(employee_id)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_employee_documents_type ON employee_documents(document_type)
    `;
  } catch (error) {
    console.error('Employee portal database initialization error:', error);
    throw error;
  }
}

// Initialize audit logs database schema
export async function initAuditLogs() {
  try {
    // Create audit_logs table
    await sql`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL,
        action TEXT NOT NULL,
        entity_type TEXT,
        entity_id TEXT,
        changes JSONB,
        ip_address TEXT,
        user_agent TEXT,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create indexes for audit_logs
    await sql`
      CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC)
    `;
  } catch (error) {
    console.error('Audit logs database initialization error:', error);
    throw error;
  }
}

// Initialize quote approvals database schema
export async function initQuoteApprovals() {
  try {
    // Create quote_approvals table
    await sql`
      CREATE TABLE IF NOT EXISTS quote_approvals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        quote_id UUID NOT NULL UNIQUE REFERENCES quotes(id) ON DELETE CASCADE,
        hellosign_signature_request_id TEXT UNIQUE,
        hellosign_signature_request_url TEXT,
        signer_email TEXT NOT NULL,
        signer_name TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'signed', 'declined', 'cancelled')),
        po_required BOOLEAN DEFAULT false,
        po_number TEXT,
        rejection_reason TEXT,
        signed_at TIMESTAMP,
        declined_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create indexes for quote_approvals
    await sql`
      CREATE INDEX IF NOT EXISTS idx_quote_approvals_quote_id ON quote_approvals(quote_id)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_quote_approvals_hellosign_id ON quote_approvals(hellosign_signature_request_id)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_quote_approvals_status ON quote_approvals(status)
    `;
  } catch (error) {
    console.error('Quote approvals database initialization error:', error);
    throw error;
  }
}

// Initialize Xero tokens database schema
export async function initXeroTokens() {
  try {
    // Create xero_tokens table
    await sql`
      CREATE TABLE IF NOT EXISTS xero_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        access_token TEXT NOT NULL,
        refresh_token TEXT NOT NULL,
        token_type TEXT DEFAULT 'Bearer',
        expires_in INTEGER NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        scope TEXT,
        tenant_id TEXT,
        tenant_ids TEXT[],
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create index for faster token lookups
    await sql`
      CREATE INDEX IF NOT EXISTS idx_xero_tokens_expires_at ON xero_tokens(expires_at)
    `;
  } catch (error) {
    console.error('Xero tokens database initialization error:', error);
    throw error;
  }
}
