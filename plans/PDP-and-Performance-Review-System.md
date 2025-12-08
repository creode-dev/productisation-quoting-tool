# PDP and Performance Review System

## Overview

Implement a comprehensive performance management system for managing Personal Development Plans (PDPs), scheduling performance reviews in Google Calendar, managing feedback forms, tracking SMART goals with validation, and providing performance management features for employees and managers.

## Dependencies

**Phase 1** - Audit trails must be implemented  
**Employee Portal** - Must exist (provides employee and manager relationships)  
**Google Calendar Integration** - Must exist (for scheduling reviews)

## Database Schema

### Performance Reviews Table

```sql
CREATE TABLE performance_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  review_type TEXT NOT NULL CHECK (review_type IN ('annual', 'mid_year', 'quarterly', 'probation', 'ad_hoc')),
  review_period_start DATE NOT NULL,
  review_period_end DATE NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  google_calendar_event_id TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled',
  completed_at TIMESTAMP,
  overall_rating DECIMAL(3,1),
  overall_feedback TEXT,
  employee_self_assessment TEXT,
  reviewer_assessment TEXT,
  development_areas TEXT[],
  strengths TEXT[],
  next_review_date DATE,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Review Feedback Forms Table

```sql
CREATE TABLE review_feedback_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES performance_reviews(id) ON DELETE CASCADE,
  form_template_id UUID REFERENCES review_form_templates(id) ON DELETE SET NULL,
  submitted_by UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  submitted_at TIMESTAMP DEFAULT NOW(),
  responses JSONB NOT NULL,
  is_employee_form BOOLEAN DEFAULT false,
  is_reviewer_form BOOLEAN DEFAULT false,
  is_peer_feedback BOOLEAN DEFAULT false,
  peer_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Personal Development Plans (PDPs) Table

```sql
CREATE TABLE personal_development_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  review_id UUID REFERENCES performance_reviews(id) ON DELETE SET NULL,
  plan_period_start DATE NOT NULL,
  plan_period_end DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  overall_objectives TEXT,
  created_by TEXT NOT NULL,
  approved_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### SMART Goals Table

```sql
CREATE TABLE smart_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pdp_id UUID NOT NULL REFERENCES personal_development_plans(id) ON DELETE CASCADE,
  goal_title TEXT NOT NULL,
  goal_description TEXT,
  specific TEXT NOT NULL,
  measurable TEXT NOT NULL,
  achievable TEXT NOT NULL,
  relevant TEXT NOT NULL,
  time_bound TEXT NOT NULL,
  target_value TEXT,
  current_value TEXT,
  progress_percentage DECIMAL(5,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'not_started',
  priority TEXT DEFAULT 'medium',
  due_date DATE,
  completed_at TIMESTAMP,
  is_smart_validated BOOLEAN DEFAULT false,
  smart_validation_notes TEXT,
  category TEXT,
  evidence JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Goal Progress Updates Table

```sql
CREATE TABLE goal_progress_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES smart_goals(id) ON DELETE CASCADE,
  updated_by UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  update_date DATE NOT NULL,
  progress_percentage DECIMAL(5,2) NOT NULL,
  current_value TEXT,
  notes TEXT,
  evidence JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## API Endpoints

### Performance Reviews API (`api/performance-reviews/index.ts`)

- `GET /api/performance-reviews` - List reviews
- `GET /api/performance-reviews/[id]` - Get review details
- `POST /api/performance-reviews` - Create review
- `PATCH /api/performance-reviews/[id]` - Update review
- `POST /api/performance-reviews/[id]/complete` - Complete review
- `POST /api/performance-reviews/[id]/reschedule` - Reschedule review

### PDPs API (`api/pdps/index.ts`)

- `GET /api/pdps` - List PDPs
- `GET /api/pdps/[id]` - Get PDP details
- `POST /api/pdps` - Create PDP
- `PATCH /api/pdps/[id]` - Update PDP
- `POST /api/pdps/[id]/approve` - Approve PDP

### SMART Goals API (`api/pdps/[id]/goals/index.ts`)

- `GET /api/pdps/[id]/goals` - List goals for PDP
- `POST /api/pdps/[id]/goals` - Create goal
- `PATCH /api/pdps/goals/[id]` - Update goal
- `POST /api/pdps/goals/[id]/validate-smart` - Validate SMART criteria
- `POST /api/pdps/goals/[id]/progress` - Update goal progress
- `POST /api/pdps/goals/[id]/complete` - Mark goal as completed

## SMART Goal Validation

### Validation Logic

- **Specific (S)**: Check if goal is clearly defined
- **Measurable (M)**: Check if there's a clear metric/target
- **Achievable (A)**: Check if achievable explanation is provided
- **Relevant (R)**: Check if relevance explanation is provided
- **Time-bound (T)**: Check if deadline/timeframe is provided

Overall SMART Score: Average of all 5 criteria (0-1 scale)
Goal is "SMART validated" if all criteria score >= 0.8

## Frontend Components

### Performance Reviews List (`src/components/performance/ReviewsList.tsx`)
- List all reviews
- Filter by employee, reviewer, status, type
- Create new review button

### Review Detail (`src/components/performance/ReviewDetail.tsx`)
- Review overview
- Feedback forms section
- Goals section
- Metrics section

### PDPs List (`src/components/performance/PDPsList.tsx`)
- List all PDPs
- Filter by employee, status, period
- Create new PDP button

### PDP Detail (`src/components/performance/PDPDetail.tsx`)
- PDP overview
- Goals section with progress
- Progress summary

### Create/Edit Goal (`src/components/performance/CreateGoal.tsx`)
- Goal title and description
- SMART criteria sections
- Real-time SMART validation
- Priority and category

### Goal Detail (`src/components/performance/GoalDetail.tsx`)
- Goal overview
- Progress updates timeline
- Add progress update form
- Evidence section

## Calendar Integration

### Review Scheduling

- Create calendar event for review
- Update calendar event on reschedule
- Cancel calendar event on cancellation
- Send calendar invites to employee and reviewer

## Testing

- Test review creation and scheduling
- Test calendar event creation/updates
- Test feedback form submission
- Test PDP creation and approval
- Test SMART goal validation
- Test goal progress tracking

## Deliverables

1. Database tables for reviews, PDPs, goals, feedback forms
2. Performance reviews API endpoints
3. PDPs API endpoints
4. SMART goals API endpoints
5. SMART goal validation service
6. Calendar integration for reviews
7. Frontend components for reviews, PDPs, goals
8. Performance dashboard
9. Integration with audit trails

## Success Criteria

- Reviews can be scheduled and appear in calendars
- Feedback forms can be created and submitted
- PDPs can be created and managed
- SMART goals can be created with validation
- Goals can be tracked with progress updates
- Calendar events are created/updated/cancelled
- All actions are logged to audit trails

