# Phase 1: Foundation & Audit Trails

## Overview

This phase establishes the foundational infrastructure for audit logging. All subsequent phases will integrate with this audit system to log all system actions for accountability, compliance, and troubleshooting.

## Dependencies

**None** - This is the first phase and can be started immediately.

## Database Schema

### Audit Logs Table

Create `audit_logs` table in [api/lib/db.ts](api/lib/db.ts):

- `id` (UUID, primary key)
- `user_id` (TEXT, user email)
- `action` (TEXT, e.g., 'quote.created', 'ticket.updated', 'phase.marked_complete')
- `entity_type` (TEXT, e.g., 'quote', 'ticket', 'phase', 'documentation')
- `entity_id` (TEXT, ID of the affected entity)
- `changes` (JSONB, before/after state or change details)
- `ip_address` (TEXT, nullable)
- `user_agent` (TEXT, nullable)
- `metadata` (JSONB, additional context)
- `created_at` (TIMESTAMP)

### Indexes

- Index on `audit_logs.user_id`
- Index on `audit_logs.entity_type, entity_id`
- Index on `audit_logs.action`
- Index on `audit_logs.created_at`

## Implementation

### Audit Logging Middleware

Create audit logging middleware in [api/lib/audit.ts](api/lib/audit.ts):

- Function to log actions: `logAction(userId, action, entityType, entityId, changes, metadata)`
- Extract IP address and user agent from request
- Store sufficient context for audit reconstruction
- Handle errors gracefully (don't break main functionality if audit logging fails)

### Integration Points

All API endpoints should use audit logging for:
- All CRUD operations (create, read, update, delete)
- All approval/sign-off actions
- All configuration changes
- All authentication events (login, logout)
- All file operations
- All external API calls (HelloSign, Xero, etc.)

### Audit Log Viewer

Create [src/components/AuditLogViewer.tsx](src/components/AuditLogViewer.tsx):

- Display audit logs in a table/list format
- Filter by:
  - User
  - Action type
  - Entity type
  - Date range
- Show full details including changes (before/after)
- Export functionality (CSV, JSON)
- Permission: Admins only

### API Endpoints

#### Audit Logs API ([api/audit/index.ts](api/audit/index.ts))

- `GET /api/audit` - List audit logs with filters
  - Query params: `userId`, `action`, `entityType`, `entityId`, `startDate`, `endDate`
  - Pagination support
  - Permission: Admins only
- `GET /api/audit?id={id}` - Get specific audit log entry
  - Permission: Admins only

## Data Retention

- Consider data retention policies (to be defined)
- May need archival strategy for old logs
- Balance between audit requirements and storage costs

## Testing

- Test audit logging middleware
- Test audit log retrieval and filtering
- Test that audit logging doesn't break main functionality
- Test permission restrictions

## Deliverables

1. `audit_logs` database table created
2. Audit logging middleware implemented
3. Audit log API endpoints
4. Audit log viewer UI component
5. Integration guide for future phases

## Success Criteria

- All system actions can be logged
- Audit logs are queryable and filterable
- Audit log viewer is functional
- No performance degradation from audit logging
- Ready for integration with Phase 2+



