# Phase 5: Phase Sign-Off System

## Overview

Implement a phase sign-off system where phases must be completed and signed off by clients via HelloSign before subsequent phases can begin. Support both waterfall (sequential) and concurrent phase workflows. Tickets for unsigned phases are blocked from work.

## Dependencies

**Phase 1** - Audit trails must be implemented (all phase actions logged)  
**Phase 2** - HelloSign integration must exist (used for phase sign-offs)  
**Phase 3** - Ticketing system must exist (tickets are blocked based on phase sign-off status)

## Database Schema

### Phase Signoffs Table

Create `phase_signoffs` table in [api/lib/db.ts](api/lib/db.ts):

- `id` (UUID, primary key)
- `quote_id` (UUID, foreign key to quotes)
- `phase_id` (TEXT, references Phase.id)
- `phase_name` (TEXT)
- `phase_order` (INTEGER, order within quote)
- `is_concurrent` (BOOLEAN, default false - waterfall by default)
- `status` (TEXT, enum: not_started, in_progress, ready_for_signoff, signoff_requested, signed_off, rejected)
- `marked_complete_by` (TEXT, user email who marked complete)
- `marked_complete_at` (TIMESTAMP, nullable)
- `hellosign_signature_request_id` (TEXT, nullable, unique)
- `hellosign_signature_request_url` (TEXT, nullable)
- `signer_email` (TEXT, nullable)
- `signer_name` (TEXT, nullable)
- `signed_off_at` (TIMESTAMP, nullable)
- `rejected_at` (TIMESTAMP, nullable)
- `rejection_reason` (TEXT, nullable)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Phase Dependencies Table

Create `phase_dependencies` table to track which phases block others:

- `id` (UUID, primary key)
- `quote_id` (UUID, foreign key to quotes)
- `blocking_phase_id` (TEXT, phase that must complete first)
- `blocked_phase_id` (TEXT, phase that is blocked)
- `created_at` (TIMESTAMP)

### Indexes

- Index on `phase_signoffs.quote_id`
- Index on `phase_signoffs.phase_id`
- Index on `phase_signoffs.status`
- Index on `phase_signoffs.quote_id, phase_order` (for ordering)
- Index on `phase_dependencies.quote_id`

## Phase Workflow Logic

### Waterfall (Default)

- Phases must complete and sign off in order
- Phase N+1 cannot start until Phase N is signed off
- Tickets for Phase N+1 are disabled until Phase N is signed off

### Concurrent

- Phases marked as concurrent can run in parallel
- No blocking between concurrent phases
- Each concurrent phase still requires sign-off before dependent phases

### Phase Completion

- Admin/team member marks phase as complete (with validation that all tickets are completed)
- System checks if all tickets in phase have status "completed"
- If validation passes, phase status changes to "ready_for_signoff"
- If validation fails, show which tickets are incomplete
- Allow admin override with reason (optional)

### Sign-Off Request

- When phase is marked complete, system creates HelloSign signature request
- Generate phase completion document (PDF) with:
  - Phase completion summary
  - List of completed items/tickets
  - Custom fields for acceptance/rejection
- Client receives email with signing link
- Phase status changes to "signoff_requested"
- Next phase tickets remain disabled

### Sign-Off Completion

- Client signs off via HelloSign
- Webhook updates phase status to "signed_off"
- System checks if next phases can now start (based on dependencies)
- Enables tickets for next phases that are no longer blocked
- Log to audit trail

### Sign-Off Rejection

- If client rejects sign-off:
  - Phase status changes to "rejected"
  - Next phase remains blocked
  - Current phase work can continue (tickets remain enabled)
  - System can request sign-off again after fixes

## API Endpoints

### Phase Signoff API ([api/quotes/[id]/phases/[phaseId]/signoff.ts](api/quotes/[id]/phases/[phaseId]/signoff.ts))

- `POST /api/quotes/[id]/phases/[phaseId]/mark-complete` - Mark phase as complete
  - Validates all tickets in phase are completed
  - Creates HelloSign signature request
  - Updates phase status to "ready_for_signoff" then "signoff_requested"
  - Log to audit trail
  - Permission: Team members and admins
- `GET /api/quotes/[id]/phases` - Get all phase statuses for a quote
- `GET /api/quotes/[id]/phases/[phaseId]` - Get specific phase status

### Phase Configuration API ([api/quotes/[id]/phases/[phaseId]/config.ts](api/quotes/[id]/phases/[phaseId]/config.ts))

- `PATCH /api/quotes/[id]/phases/[phaseId]/config` - Update phase configuration
  - Request body: `{ isConcurrent: boolean, dependencies?: [...] }`
  - Set `is_concurrent` flag
  - Define phase dependencies
  - Log to audit trail
  - Permission: Team members and admins

### Phase Signoff Webhook ([api/quotes/webhook/hellosign-phase.ts](api/quotes/webhook/hellosign-phase.ts))

- `POST /api/quotes/webhook/hellosign-phase` - Handle HelloSign webhooks for phase sign-offs
  - Verify webhook signature
  - Update phase status (signed_off or rejected)
  - Extract PO number and rejection reason from custom fields
  - Unblock next phases if applicable
  - Enable tickets for newly unblocked phases
  - Log to audit trail

## Frontend Components

### Phase Status Display ([src/components/PhaseStatus.tsx](src/components/PhaseStatus.tsx))

- Display all phases with their current status
- Visual indicators: not started, in progress, ready for signoff, signoff requested, signed off, rejected
- Show phase dependencies and blocking relationships
- Mark phase as concurrent/waterfall toggle
- Show phase order
- Color-coded status badges

### Mark Phase Complete Button ([src/components/PhaseCompletion.tsx](src/components/PhaseCompletion.tsx))

- Button to mark phase as complete
- Validation check: show list of incomplete tickets if any
- Confirmation modal before marking complete
- Shows ticket validation results
- Triggers HelloSign sign-off request
- Permission: Team members and admins
- Loading state during processing

### Phase Signoff Status ([src/components/PhaseSignoffStatus.tsx](src/components/PhaseSignoffStatus.tsx))

- Display sign-off status for each phase
- Show signing link if pending
- Show rejection reason if rejected
- Show signed-off date if completed
- Show who marked phase complete
- Show signer information

### Ticket Blocking UI Updates

Update [src/components/TicketsList.tsx](src/components/TicketsList.tsx) and [src/components/TicketsKanban.tsx](src/components/TicketsKanban.tsx):

- Disable ticket assignment/work for blocked phases
- Show visual indicator (grayed out, lock icon)
- Tooltip explaining why tickets are disabled
- Show which phase needs to be signed off first
- Filter option to show/hide blocked tickets

## Integration with Tickets

### Ticket Availability Logic

- When fetching tickets, check phase sign-off status
- Filter out or disable tickets for unsigned phases
- Only show/enable tickets for:
  - Phases that are signed off
  - First phase (no dependencies)
  - Concurrent phases that don't depend on unsigned phases

### Ticket Status Validation

- When marking phase complete, validate all tickets have status "completed"
- Query all tickets for the phase
- Check all have status "completed"
- Return list of incomplete tickets if validation fails
- Allow admin override with reason (optional)

## HelloSign Integration

### Phase Sign-Off Request

- Generate phase completion document (PDF)
- Create HelloSign signature request with:
  - Phase completion summary
  - List of completed items/tickets
  - Custom fields for acceptance/rejection
- Store signature request ID in phase_signoffs table
- Send email to client with signing link
- Reuse HelloSign service from Phase 2

### Phase Sign-Off Webhook

- Handle HelloSign webhook events for phase sign-offs
- Update phase status based on client decision
- Unblock dependent phases if signed off
- Keep phase blocked if rejected

## Implementation Details

### Phase Dependency Calculation

- Default: Sequential (waterfall) - each phase depends on previous
- Concurrent phases: No dependencies between them
- Mixed: Some phases concurrent, some sequential
- Calculate blocking: Phase N blocks Phase N+1 unless Phase N is concurrent

### Ticket Blocking Logic

```typescript
function canWorkOnTicket(ticket: Ticket, phaseSignoffs: PhaseSignoff[]): boolean {
  const phase = phaseSignoffs.find(p => p.phase_id === ticket.phase_id);
  if (!phase) return false;
  
  // Check if phase is signed off
  if (phase.status === 'signed_off') return true;
  
  // Check if phase is first phase or concurrent
  if (phase.phase_order === 1) return true;
  if (phase.is_concurrent) {
    // Check if any blocking phases are signed off
    const blockingPhases = getBlockingPhases(phase);
    return blockingPhases.every(p => p.status === 'signed_off');
  }
  
  // Waterfall: previous phase must be signed off
  const previousPhase = phaseSignoffs.find(p => p.phase_order === phase.phase_order - 1);
  return previousPhase?.status === 'signed_off';
}
```

### Phase Completion Validation

- Query all tickets for the phase
- Check all have status "completed"
- Return list of incomplete tickets if validation fails
- Allow admin override with reason (optional)

## Testing

- Test phase completion with ticket validation
- Test HelloSign phase sign-off integration
- Test ticket blocking logic
- Test concurrent vs waterfall workflows
- Test phase dependency calculations
- Test webhook handling
- Test permission checks
- Test audit logging integration

## Libraries

- Reuse HelloSign SDK from Phase 2
- Extend existing HelloSign service for phase sign-offs

## Deliverables

1. `phase_signoffs` and `phase_dependencies` database tables
2. Phase signoff API endpoints
3. Phase configuration API
4. Phase signoff webhook handler
5. Phase status display component
6. Phase completion UI with validation
7. Ticket blocking logic implementation
8. Ticket UI updates (blocking indicators)
9. Integration with HelloSign (Phase 2)
10. Integration with tickets (Phase 3)
11. Integration with audit trails (Phase 1)

## Success Criteria

- Phases can be marked complete with ticket validation
- Phase sign-offs work via HelloSign
- Tickets are blocked for unsigned phases
- Concurrent and waterfall workflows work correctly
- Phase dependencies are calculated correctly
- All actions logged to audit trails
- Ready for production use




