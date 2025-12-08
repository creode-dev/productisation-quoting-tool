# NPS Surveys and Testimonials System

## Overview

Implement a system for collecting NPS scores with the option to leave a testimonial after work has been completed and when looking for sign off of each phase. Surveys are sent via email with secure tokens, and responses are collected and analyzed.

## Dependencies

**Phase 1** - Audit trails must be implemented  
**Phase 2** - Quote Approval System (for project completion tracking)

## Database Schema

### NPS Surveys Table

```sql
CREATE TABLE nps_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
  phase_id TEXT,
  survey_type TEXT NOT NULL CHECK (survey_type IN ('phase_completion', 'project_completion', 'ad_hoc')),
  survey_token TEXT UNIQUE NOT NULL,
  sent_to_email TEXT NOT NULL,
  sent_at TIMESTAMP,
  completed_at TIMESTAMP,
  nps_score INTEGER CHECK (nps_score >= 0 AND nps_score <= 10),
  feedback_text TEXT,
  promoter_category TEXT CHECK (promoter_category IN ('promoter', 'passive', 'detractor')),
  created_by TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Testimonials Table

```sql
CREATE TABLE testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nps_survey_id UUID REFERENCES nps_surveys(id) ON DELETE SET NULL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
  testimonial_text TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_title TEXT,
  author_company TEXT,
  approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  approved_by TEXT,
  approved_at TIMESTAMP,
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Survey Reminders Table

```sql
CREATE TABLE survey_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nps_survey_id UUID NOT NULL REFERENCES nps_surveys(id) ON DELETE CASCADE,
  reminder_sent_at TIMESTAMP NOT NULL,
  reminder_type TEXT CHECK (reminder_type IN ('first', 'second', 'final')),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## API Endpoints

### NPS Surveys API (`api/nps-surveys/index.ts`)

- `GET /api/nps-surveys` - List surveys
- `GET /api/nps-surveys/[id]` - Get survey details
- `POST /api/nps-surveys` - Create survey
- `POST /api/nps-surveys/[id]/send` - Send survey email

### Survey Response API (`api/nps-surveys/respond.ts`)

- `GET /api/nps-surveys/respond?token={token}` - Get survey by token
- `POST /api/nps-surveys/respond` - Submit survey response
- `POST /api/nps-surveys/respond/testimonial` - Submit testimonial

### Testimonials API (`api/testimonials/index.ts`)

- `GET /api/testimonials` - List testimonials
- `POST /api/testimonials/[id]/approve` - Approve testimonial
- `POST /api/testimonials/[id]/reject` - Reject testimonial
- `POST /api/testimonials/[id]/publish` - Publish testimonial

### NPS Analytics API (`api/nps-surveys/analytics.ts`)

- `GET /api/nps-surveys/analytics` - Get overall NPS metrics
- `GET /api/nps-surveys/analytics/trends` - Get NPS trends over time

## Survey Workflow

### Phase Completion Survey

1. Phase marked as complete
2. System creates NPS survey
3. Survey email sent to client
4. Client responds with NPS score
5. Optional testimonial collection
6. Results stored and analyzed

### Project Completion Survey

1. Project marked as complete
2. System creates NPS survey
3. Survey email sent to client
4. Client responds with NPS score
5. Optional testimonial collection
6. Results stored and analyzed

## Frontend Components

### Survey Response Form (`src/components/nps/SurveyResponseForm.tsx`)
- NPS score selection (0-10)
- Feedback text input
- Optional testimonial form
- Submit button

### Testimonial Approval (`src/components/nps/TestimonialApproval.tsx`)
- List pending testimonials
- Approve/reject actions
- Edit before approval

### NPS Analytics Dashboard (`src/components/nps/NPSAnalyticsDashboard.tsx`)
- Overall NPS score
- Promoter/Detractor breakdown
- Response rate
- Trends over time
- Testimonials list

## Email Integration

### Survey Email Template

- Personalized greeting
- Survey link with secure token
- Clear instructions
- Deadline information

### Reminder Emails

- First reminder (3 days)
- Second reminder (7 days)
- Final reminder (14 days)

## Testing

- Test survey creation
- Test email sending
- Test survey response
- Test testimonial collection
- Test approval workflow
- Test analytics

## Deliverables

1. Database tables for surveys, testimonials, reminders
2. NPS surveys API
3. Survey response API
4. Testimonials API
5. Analytics API
6. Survey response form
7. Testimonial approval interface
8. Analytics dashboard
9. Email templates
10. Integration with audit trails

## Success Criteria

- Surveys can be created and sent
- Clients can respond to surveys
- Testimonials can be collected and approved
- NPS scores are calculated correctly
- Analytics are accurate
- All actions logged to audit trails

