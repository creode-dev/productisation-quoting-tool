# Phase 3: Ticketing System

## Overview

Implement a comprehensive ticketing system linked to quotes. Tickets are automatically created from quote items when quotes are saved (based on templates), and can also be created manually. Features include list and Kanban board views with drag-and-drop, ticket assignment, comments, priorities, and due dates.

## Dependencies

**Phase 1** - Audit trails must be implemented (all ticket actions logged)  
**Phase 2** - Quotes system must exist (tickets link to quotes)

## Database Schema

### Tickets Table

Create `tickets` table in [api/lib/db.ts](api/lib/db.ts):

- `id` (UUID, primary key)
- `quote_id` (UUID, foreign key to quotes)
- `quote_item_id` (TEXT, references PricingItem.questionId)
- `phase_id` (TEXT, references Phase.id)
- `phase_name` (TEXT)
- `title` (TEXT, required)
- `description` (TEXT)
- `status` (TEXT, enum: backlog, to_estimate, to_do, in_progress, internal_testing, client_testing, ready_for_deployment, rejected, completed)
- `priority` (TEXT, enum: low, medium, high, critical)
- `due_date` (DATE)
- `assignee_type` (TEXT, enum: individual, team)
- `assignee_id` (UUID, references employees.id or teams.id)
- `order` (INTEGER, for priority ordering within status)
- `created_by` (TEXT, user email)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Ticket Templates Table

Create `ticket_templates` table:

- `id` (UUID, primary key)
- `quote_item_label` (TEXT, matches PricingItem.label)
- `phase_name` (TEXT)
- `title` (TEXT, required)
- `description` (TEXT)
- `default_priority` (TEXT, enum: low, medium, high, critical)
- `default_status` (TEXT, default: 'to_do')
- `order` (INTEGER)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Ticket Comments Table

Create `ticket_comments` table:

- `id` (UUID, primary key)
- `ticket_id` (UUID, foreign key to tickets)
- `user_id` (TEXT, user email)
- `comment` (TEXT, required)
- `created_at` (TIMESTAMP)

### Indexes

- Index on `tickets.quote_id`
- Index on `tickets.status`
- Index on `tickets.assignee_id`
- Index on `tickets.phase_id`
- Index on `ticket_templates.quote_item_label`
- Index on `ticket_comments.ticket_id`

## API Endpoints

### Tickets API ([api/tickets/index.ts](api/tickets/index.ts))

- `GET /api/tickets` - List tickets with filters
  - Query params: `quoteId`, `phaseId`, `assigneeId`, `status`, `priority`, `search`
  - Returns tickets with assignee information
- `GET /api/tickets?id={id}` - Get single ticket with comments
- `POST /api/tickets` - Create ticket manually
  - Request body: `{ quoteId, quoteItemId?, phaseId, phaseName, title, description, priority, dueDate, assigneeType, assigneeId }`
  - Log to audit trail
  - Permission: Team members and admins
- `PATCH /api/tickets?id={id}` - Update ticket
  - Can update: title, description, status, priority, due date, assignee
  - Log changes to audit trail
  - Permission: Team members and admins
- `DELETE /api/tickets?id={id}` - Delete ticket
  - Log to audit trail
  - Permission: Team members and admins
- `POST /api/tickets/reorder` - Update ticket order (for priority within status)
  - Request body: `{ ticketId, newOrder, status }`
  - Used for Kanban vertical drag-and-drop

### Ticket Templates API ([api/tickets/templates.ts](api/tickets/templates.ts))

- `GET /api/tickets/templates` - List all templates
- `GET /api/tickets/templates?quoteItemLabel={label}&phaseName={phase}` - Get templates for specific quote item
- `POST /api/tickets/templates` - Create template
  - Request body: `{ quoteItemLabel, phaseName, title, description, defaultPriority, defaultStatus, order }`
  - Permission: Team members and admins
- `PATCH /api/tickets/templates?id={id}` - Update template
  - Permission: Team members and admins
- `DELETE /api/tickets/templates?id={id}` - Delete template
  - Permission: Team members and admins

### Ticket Comments API ([api/tickets/[id]/comments.ts](api/tickets/[id]/comments.ts))

- `GET /api/tickets/[id]/comments` - Get comments for a ticket
- `POST /api/tickets/[id]/comments` - Add comment to ticket
  - Request body: `{ comment }`
  - Log to audit trail
  - Permission: Team members and admins

## Auto-Create Tickets

Modify [api/quotes/index.ts](api/quotes/index.ts) to automatically create tickets when a quote is saved:

- After quote creation/update, extract all PricingItems from quote.phases
- For each PricingItem, query ticket_templates where quote_item_label matches
- Create tickets from matching templates:
  - Link to quote_id and quote_item_id (questionId)
  - Set phase_id and phase_name from quote context
  - Apply default priority and status from template
  - Set created_by to current user
- Log ticket creation to audit trail
- Return created ticket IDs

## Frontend Components

### Ticket Types ([src/types/ticket.ts](src/types/ticket.ts))

Define TypeScript interfaces:
- `Ticket` - Main ticket interface
- `TicketTemplate` - Template interface
- `TicketComment` - Comment interface
- `TicketStatus` - Status enum type
- `TicketPriority` - Priority enum type

### Ticket Store ([src/store/ticketStore.ts](src/store/ticketStore.ts))

Zustand store for ticket state management:
- Tickets list
- Selected ticket
- Filters (quote, phase, assignee, status, priority, search)
- Actions: fetch, create, update, delete, reorder, addComment

### Tickets List View ([src/components/TicketsList.tsx](src/components/TicketsList.tsx))

- Group tickets by phase
- Display ticket cards with: title, status badge, priority badge, assignee, due date
- Filtering controls:
  - Quote dropdown
  - Phase dropdown
  - Assignee dropdown (employees and teams)
  - Priority checkboxes
  - Status checkboxes
  - Search input (title/description)
- Create new ticket button
- Click ticket to view/edit details
- Show ticket count per phase

### Kanban Board View ([src/components/TicketsKanban.tsx](src/components/TicketsKanban.tsx))

- Use `@dnd-kit/core` and `@dnd-kit/sortable` for drag-and-drop
- Columns for each status (backlog, to_estimate, to_do, in_progress, etc.)
- Draggable ticket cards within columns
- Horizontal drag between columns to change status
- Vertical drag within column to reorder priority (updates `order` field)
- Same filtering as list view
- Ticket card shows: title, priority badge, assignee avatar/name, due date
- Visual indicators for overdue tickets
- Click card to view/edit details

### Ticket Detail Modal ([src/components/TicketDetail.tsx](src/components/TicketDetail.tsx))

- Full ticket information display
- Editable fields:
  - Title (text input)
  - Description (textarea)
  - Status (dropdown)
  - Priority (dropdown)
  - Due date (date picker)
  - Assignee (dropdown for individual or team)
- Comments section:
  - List of comments with author and timestamp
  - Add comment form at bottom
- Link to associated quote (navigate to quote view)
- Save/Cancel buttons
- Permission check: Team members and admins can edit
- Delete button (with confirmation)

### Ticket Template Management ([src/components/TicketTemplates.tsx](src/components/TicketTemplates.tsx))

- List all ticket templates in a table
- Create new template form:
  - Quote item label (autocomplete or dropdown)
  - Phase name
  - Title
  - Description
  - Default priority
  - Default status
  - Order
- Edit existing templates
- Delete templates (with confirmation)
- Show which quote items have templates
- Permission: Team members and admins

### Tickets Navigation

Add "Tickets" to sidebar in [src/components/Sidebar.tsx](src/components/Sidebar.tsx):
- Link to tickets list view
- Toggle between list and Kanban views
- Show ticket count badge (optional)

## Integration Points

### Quote Integration

Modify [src/components/QuoteView.tsx](src/components/QuoteView.tsx):
- Add "View Tickets" button linking to tickets filtered by quote
- Show ticket count per quote item if tickets exist
- Link to create tickets from quote

### Employee/Team Integration

- Use existing employees API ([api/employees/index.ts](api/employees/index.ts))
- Use existing teams API ([api/teams/index.ts](api/teams/index.ts))
- Display employee/team names in ticket views
- Support assignment to both individuals and teams

## Libraries and Dependencies

Install required packages:
- `@dnd-kit/core` - Core drag-and-drop functionality
- `@dnd-kit/sortable` - Sortable drag-and-drop
- `@dnd-kit/utilities` - Utility functions

## Testing

- Test ticket CRUD operations
- Test ticket template management
- Test auto-creation from quotes
- Test drag-and-drop in Kanban view
- Test filtering and search
- Test assignment to individuals and teams
- Test comments functionality
- Test permission checks
- Test audit logging integration

## Deliverables

1. `tickets`, `ticket_templates`, `ticket_comments` database tables
2. Tickets API endpoints (CRUD, reorder)
3. Ticket templates API endpoints
4. Ticket comments API endpoints
5. Auto-create tickets logic in quotes API
6. Ticket store (Zustand)
7. Tickets list view component
8. Kanban board component with drag-and-drop
9. Ticket detail modal component
10. Ticket template management UI
11. Integration with quotes view
12. Integration with audit trails (Phase 1)
13. Navigation updates

## Success Criteria

- Tickets can be created manually and automatically from quotes
- Tickets display in both list and Kanban views
- Drag-and-drop works for status changes and priority reordering
- Tickets can be assigned to individuals or teams
- Comments can be added to tickets
- Filtering and search work correctly
- All actions logged to audit trails
- Ready for Phase 5 (phase sign-off ticket blocking)

