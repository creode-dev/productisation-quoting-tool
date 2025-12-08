# AI Documentation Review System

## Overview

AI-powered documentation review system that automatically assesses whether documentation is current, identifies required changes based on technology updates, legislation changes (for policies), and best practice updates. All changes require human approval before being applied. Reviews can be triggered manually (button) or automatically on scheduled dates.

## Dependencies

**Phase 1** - Audit trails must be implemented  
**Phase 6** - Documentation Management must exist (provides documentation storage)

## Database Schema

### AI Documentation Reviews Table

```sql
CREATE TABLE ai_documentation_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  documentation_file_id UUID NOT NULL REFERENCES documentation_files(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('manual', 'scheduled', 'on_update')),
  review_date TIMESTAMP NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending',
  currentness_assessment JSONB,
  technology_changes JSONB,
  legislation_changes JSONB,
  best_practice_changes JSONB,
  overall_recommendations TEXT,
  ai_model_used TEXT,
  ai_review_prompt TEXT,
  ai_response_raw JSONB,
  reviewed_by TEXT,
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### AI Review Change Proposals Table

```sql
CREATE TABLE ai_review_change_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES ai_documentation_reviews(id) ON DELETE CASCADE,
  change_type TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  section_reference TEXT,
  current_content TEXT,
  proposed_content TEXT,
  change_reason TEXT NOT NULL,
  evidence JSONB,
  technology_name TEXT,
  legislation_reference TEXT,
  best_practice_source TEXT,
  approval_status TEXT NOT NULL DEFAULT 'pending',
  approved_by TEXT,
  approved_at TIMESTAMP,
  rejection_reason TEXT,
  modified_content TEXT,
  applied_to_document BOOLEAN DEFAULT false,
  applied_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Documentation Review Schedules Table

```sql
CREATE TABLE documentation_review_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  documentation_file_id UUID NOT NULL REFERENCES documentation_files(id) ON DELETE CASCADE,
  review_frequency_days INTEGER NOT NULL,
  next_review_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  auto_trigger BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMP,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Technology Change Tracking Table

```sql
CREATE TABLE technology_change_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  technology_name TEXT NOT NULL,
  technology_type TEXT,
  change_type TEXT NOT NULL,
  change_date DATE,
  change_details TEXT,
  replacement_technology TEXT,
  documentation_impact TEXT,
  source_url TEXT,
  detected_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Legislation Change Tracking Table

```sql
CREATE TABLE legislation_change_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legislation_name TEXT NOT NULL,
  jurisdiction TEXT,
  legislation_type TEXT,
  change_type TEXT NOT NULL,
  effective_date DATE,
  change_summary TEXT,
  documentation_impact TEXT,
  source_url TEXT,
  detected_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## AI Review Process

### Review Trigger Types

1. **Manual Trigger (Button)**: User clicks "Review with AI" button
2. **Scheduled Trigger**: Automated cron job checks schedules and triggers reviews
3. **On Update Trigger**: Triggered when documentation is manually edited

### AI Review Analysis

1. **Currentness Assessment**: Analyze document for outdated information
2. **Technology Change Detection**: Extract technologies, check for updates/deprecation
3. **Legislation Change Detection**: Identify legislation references, check for changes
4. **Best Practice Assessment**: Identify areas needing best practice updates
5. **Overall Recommendations**: Summarize all findings

## API Endpoints

### AI Review API (`api/documentation/ai-reviews/index.ts`)

- `POST /api/documentation/ai-reviews` - Trigger AI review
- `GET /api/documentation/ai-reviews` - List reviews
- `GET /api/documentation/ai-reviews/[id]` - Get review details
- `POST /api/documentation/ai-reviews/[id]/cancel` - Cancel review

### Change Proposals API (`api/documentation/ai-reviews/[id]/proposals.ts`)

- `GET /api/documentation/ai-reviews/[id]/proposals` - List change proposals
- `POST /api/documentation/ai-reviews/[id]/proposals/[proposalId]/approve` - Approve proposal
- `POST /api/documentation/ai-reviews/[id]/proposals/[proposalId]/reject` - Reject proposal
- `POST /api/documentation/ai-reviews/[id]/proposals/batch-approve` - Approve multiple proposals
- `POST /api/documentation/ai-reviews/[id]/proposals/[proposalId]/apply` - Apply approved proposal
- `POST /api/documentation/ai-reviews/[id]/apply-all-approved` - Apply all approved proposals

### Review Schedule API (`api/documentation/review-schedules/index.ts`)

- `GET /api/documentation/review-schedules` - List schedules
- `POST /api/documentation/review-schedules` - Create schedule
- `PATCH /api/documentation/review-schedules/[id]` - Update schedule
- `DELETE /api/documentation/review-schedules/[id]` - Delete schedule

### Scheduled Review Runner (`api/documentation/scheduled-reviews/run.ts`)

- `POST /api/documentation/scheduled-reviews/run` - Run scheduled reviews (cron job)

## Frontend Components

### AI Review Button (`src/components/documentation/AIReviewButton.tsx`)
- "Review with AI" button
- Loading state during review
- Review status display

### AI Review Results Panel (`src/components/documentation/AIReviewResults.tsx`)
- Review overview with currentness score
- Tabs for currentness, technology, legislation, best practice changes
- Action buttons

### Change Proposals List (`src/components/documentation/ChangeProposalsList.tsx`)
- List all change proposals
- Filter by type, status, priority
- Proposal cards with details

### Change Proposal Detail (`src/components/documentation/ChangeProposalDetail.tsx`)
- Full proposal display
- Side-by-side diff view
- Approval actions

### Review Schedule Configuration (`src/components/documentation/ReviewScheduleConfig.tsx`)
- Configure review schedule per document
- Calendar view of upcoming reviews

## Human Approval Workflow

### Mandatory Approval Process

1. AI Review Completes → Change proposals created with status 'pending'
2. User Reviews Proposals → User examines each proposal
3. Approval Actions → User approves/rejects/modifies proposals
4. Applying Changes → User clicks "Apply Approved Changes"
5. Changes Applied → Document content updated, logged to audit trail

**No automatic application** - All changes require explicit approval

## Technology Change Detection

- Extract all technologies mentioned in document
- Check technology_change_tracking table
- Use AI to assess if deprecated/updated/replaced
- Generate change proposals with evidence

## Legislation Change Detection

- Extract legislation references (for policies)
- Check legislation_change_tracking table
- Use AI to assess if amended/repealed/updated
- Generate change proposals with effective dates

## Testing

- Test manual review trigger
- Test scheduled review trigger
- Test AI review accuracy
- Test technology change detection
- Test legislation change detection
- Test approval workflow
- Test change application
- Test audit logging

## Deliverables

1. Database tables for reviews, proposals, schedules, tracking
2. AI review service with currentness, technology, legislation, best practice detection
3. Review API endpoints
4. Change proposals API endpoints
5. Review schedule API endpoints
6. Scheduled review runner (cron job)
7. Frontend components for review results, proposals, approval workflow
8. Review schedule configuration UI
9. Integration with documentation management
10. Integration with audit trails

## Success Criteria

- AI reviews can be triggered manually and on schedule
- AI accurately assesses documentation currentness
- AI detects technology changes requiring updates
- AI detects legislation changes (for policies)
- AI identifies best practice updates
- All changes require human approval
- Approval workflow works correctly
- Changes are applied only after approval
- Review schedules work correctly
- All actions logged to audit trails

