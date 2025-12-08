# Client Portal System

## Overview

Implement a comprehensive client portal that allows clients to log in, raise tickets, view project statuses, track time for retainers, and access custom web analytics dashboards. Analytics dashboards are customized based on client type (B2B vs B2C, lead gen vs online sales, brochure website vs transactional) with reports imported from external systems.

## Dependencies

**Phase 1** - Audit trails must be implemented (all portal actions logged)  
**Customer Onboarding System** - Must exist (provides customer and stakeholder data)  
**Phase 3** - Ticketing System must exist (for client ticket raising)  
**Phase 2** - Quote Approval System (for project status tracking)

## Database Schema

### Client Portal Users Table

```sql
CREATE TABLE client_portal_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  customer_stakeholder_id UUID REFERENCES customer_stakeholders(id) ON DELETE SET NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  auth_provider TEXT DEFAULT 'email',
  auth_provider_id TEXT,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  is_primary_contact BOOLEAN DEFAULT false,
  last_login_at TIMESTAMP,
  password_reset_token TEXT,
  password_reset_expires_at TIMESTAMP,
  email_verified BOOLEAN DEFAULT false,
  email_verification_token TEXT,
  email_verified_at TIMESTAMP,
  two_factor_enabled BOOLEAN DEFAULT false,
  two_factor_secret TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Client Tickets Table

```sql
CREATE TABLE client_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
  created_by_user_id UUID NOT NULL REFERENCES client_portal_users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_for_client', 'resolved', 'closed')),
  assigned_to TEXT,
  internal_notes TEXT,
  resolution TEXT,
  resolved_at TIMESTAMP,
  resolved_by TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Time Tracking Table

```sql
CREATE TABLE time_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
  project_id TEXT,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  employee_email TEXT,
  task_description TEXT NOT NULL,
  hours DECIMAL(6,2) NOT NULL,
  date_worked DATE NOT NULL,
  billable BOOLEAN DEFAULT true,
  hourly_rate DECIMAL(10,2),
  category TEXT,
  is_retainer BOOLEAN DEFAULT false,
  retainer_period_start DATE,
  retainer_period_end DATE,
  approved_by_client BOOLEAN DEFAULT false,
  approved_by_client_user_id UUID REFERENCES client_portal_users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Analytics Dashboard Configurations Table

```sql
CREATE TABLE analytics_dashboard_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  dashboard_name TEXT NOT NULL,
  client_type TEXT NOT NULL,
  business_model TEXT NOT NULL,
  website_type TEXT,
  is_active BOOLEAN DEFAULT true,
  config JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Analytics Data Sources Table

```sql
CREATE TABLE analytics_data_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  dashboard_config_id UUID REFERENCES analytics_dashboard_configs(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL,
  source_name TEXT NOT NULL,
  connection_type TEXT,
  api_credentials JSONB,
  connection_status TEXT DEFAULT 'disconnected',
  last_sync_at TIMESTAMP,
  sync_frequency TEXT DEFAULT 'daily',
  sync_errors TEXT[],
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## API Endpoints

### Client Authentication API (`api/client-portal/auth/index.ts`)

- `POST /api/client-portal/auth/register` - Register new client user
- `POST /api/client-portal/auth/login` - Client login
- `POST /api/client-portal/auth/logout` - Logout
- `POST /api/client-portal/auth/forgot-password` - Request password reset
- `POST /api/client-portal/auth/reset-password` - Reset password
- `GET /api/client-portal/auth/me` - Get current user

### Client Tickets API (`api/client-portal/tickets/index.ts`)

- `GET /api/client-portal/tickets` - List client's tickets
- `GET /api/client-portal/tickets/[id]` - Get ticket details
- `POST /api/client-portal/tickets` - Create ticket
- `PUT /api/client-portal/tickets/[id]` - Update ticket
- `POST /api/client-portal/tickets/[id]/comments` - Add comment

### Project Status API (`api/client-portal/projects/index.ts`)

- `GET /api/client-portal/projects` - List client's projects
- `GET /api/client-portal/projects/[quoteId]` - Get project details
- `GET /api/client-portal/projects/[quoteId]/phases` - Get phase statuses

### Time Tracking API (`api/client-portal/time-tracking/index.ts`)

- `GET /api/client-portal/time-tracking` - Get time tracking data
- `GET /api/client-portal/time-tracking/retainer-summary` - Get retainer summary
- `POST /api/client-portal/time-tracking/[id]/approve` - Approve time entry

### Analytics Dashboard API (`api/client-portal/analytics/index.ts`)

- `GET /api/client-portal/analytics/dashboards` - List dashboards
- `GET /api/client-portal/analytics/dashboards/[id]` - Get dashboard
- `GET /api/client-portal/analytics/dashboards/[id]/reports` - Get dashboard reports
- `GET /api/client-portal/analytics/data-sources` - List data sources

## Frontend Components

### Client Portal Layout (`src/components/client-portal/ClientPortalLayout.tsx`)
- Header with company name, user info, notifications
- Sidebar navigation
- Main content area

### Client Dashboard (`src/components/client-portal/ClientDashboard.tsx`)
- Welcome message
- Active projects summary
- Open tickets summary
- Time tracking summary
- Recent analytics highlights

### Projects List (`src/components/client-portal/ProjectsList.tsx`)
- List all projects for customer
- Project cards with status and progress
- Filter and search

### Tickets List (`src/components/client-portal/ClientTicketsList.tsx`)
- List all tickets for customer
- Create new ticket
- Filter by status, category, priority

### Time Tracking View (`src/components/client-portal/TimeTrackingView.tsx`)
- Retainer summary
- Time entries list
- Approve/reject time entries

### Analytics Dashboard (`src/components/client-portal/AnalyticsDashboard.tsx`)
- Custom analytics dashboard
- Widget grid layout
- Charts and visualizations
- Export reports

## Analytics Integration

### Google Analytics 4 (GA4)
- Connect via GA4 Data API
- Fetch metrics: sessions, users, conversions, traffic sources

### Meta (Facebook/Instagram)
- Connect via Meta Marketing API
- Fetch metrics: ad performance, reach, engagement, conversions

### Shopify
- Connect via Shopify Admin API
- Fetch metrics: sales revenue, orders, products, customers

## Dashboard Configuration by Client Type

### B2B Lead Generation
- Website traffic, lead form submissions, conversion funnel

### B2B Online Sales
- Website traffic, product views, sales revenue, customer lifetime value

### B2C Lead Generation
- Website traffic, lead form submissions, social engagement

### B2C Online Sales
- Website traffic, sales revenue, cart abandonment, return customer rate

### Brochure Website
- Website traffic, page views, time on site, contact form submissions

### Transactional/Web App
- Active users, user registrations, feature usage, revenue, retention

## Testing

- Test client registration and login
- Test ticket creation and management
- Test project status viewing
- Test time tracking display
- Test analytics dashboard
- Test data source connections
- Test permission restrictions

## Deliverables

1. Database tables for portal users, tickets, time tracking, analytics
2. Client authentication system
3. Client portal layout and navigation
4. Client dashboard
5. Projects and tickets views
6. Time tracking view
7. Analytics dashboard with widgets
8. Data source integration services
9. Integration with audit trails

## Success Criteria

- Clients can register and log in
- Clients can view their projects
- Clients can raise and manage tickets
- Clients can view time tracking for retainers
- Clients can view custom analytics dashboards
- Analytics data syncs from external sources
- All actions are logged to audit trails

