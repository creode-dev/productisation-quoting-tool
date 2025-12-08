# AI Analysis of Communications System

## Overview

AI will have access to all emails and transcripts and will use these to identify different clients and team members. The AI will process all transcripts and give an assessment of the sentiment of the meeting, highlighting problems with client communications, projects, individuals. The AI will give a sentiment analysis score to each interaction and build these up to give a picture across the client/project. Only admins will have access to this information. It will be used for staff training and early warning of client problems.

## Dependencies

**Phase 1** - Audit trails must be implemented  
**Call Transcription System** - Must exist (provides transcripts)

## Database Schema

### Communication Sources Table

```sql
CREATE TABLE communication_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT NOT NULL CHECK (source_type IN ('email', 'transcript', 'chat', 'other')),
  source_id TEXT NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  project_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
  participants TEXT[],
  subject TEXT,
  body_text TEXT,
  received_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Communication AI Analysis Table

```sql
CREATE TABLE communication_ai_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  communication_source_id UUID NOT NULL REFERENCES communication_sources(id) ON DELETE CASCADE,
  sentiment_score DECIMAL(3,2) NOT NULL CHECK (sentiment_score >= -1 AND sentiment_score <= 1),
  sentiment_label TEXT CHECK (sentiment_label IN ('very_negative', 'negative', 'neutral', 'positive', 'very_positive')),
  identified_clients TEXT[],
  identified_team_members TEXT[],
  problems_detected JSONB,
  communication_issues JSONB,
  project_issues JSONB,
  individual_issues JSONB,
  key_insights TEXT,
  ai_model_used TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Client Communication Health Table

```sql
CREATE TABLE client_communication_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  project_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  average_sentiment DECIMAL(3,2),
  interaction_count INTEGER DEFAULT 0,
  positive_interactions INTEGER DEFAULT 0,
  negative_interactions INTEGER DEFAULT 0,
  warning_flags TEXT[],
  health_score DECIMAL(3,2) CHECK (health_score >= 0 AND health_score <= 1),
  last_updated TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## API Endpoints

### Communication Analysis API (`api/communications/analyze.ts`)

- `POST /api/communications/analyze` - Trigger analysis for communication
- `GET /api/communications/analysis/[id]` - Get analysis results

### Client Health API (`api/communications/health.ts`)

- `GET /api/communications/health` - Get client health scores
- `GET /api/communications/health/[customerId]` - Get specific client health
- `GET /api/communications/health/[customerId]/[projectId]` - Get project health

### Admin Dashboard API (`api/admin/communication-insights.ts`)

- `GET /api/admin/communication-insights` - Get overall insights
- `GET /api/admin/communication-insights/warnings` - Get warning flags
- `GET /api/admin/communication-insights/trends` - Get sentiment trends

## AI Analysis Process

### Sentiment Analysis

For each communication:
1. Analyze overall sentiment (-1 to 1 scale)
2. Identify sentiment label
3. Extract emotional indicators
4. Detect tone and urgency

### Problem Detection

AI identifies:
- **Client Communication Issues**: Poor communication, unclear requirements, delays
- **Project Issues**: Scope creep, timeline concerns, budget issues
- **Individual Issues**: Team member performance, conflict, workload

### Health Score Calculation

Aggregates sentiment scores over time:
- Average sentiment per client/project
- Trend analysis (improving/declining)
- Warning flags for declining health
- Early warning indicators

## Frontend Components (Admin Only)

### Communication Insights Dashboard (`src/components/admin/CommunicationInsightsDashboard.tsx`)
- Overall sentiment trends
- Client health scores
- Warning flags
- Problem areas

### Client Health View (`src/components/admin/ClientHealthView.tsx`)
- Individual client health
- Sentiment over time
- Interaction breakdown
- Warning indicators

### Communication Analysis Detail (`src/components/admin/CommunicationAnalysisDetail.tsx`)
- Individual communication analysis
- Sentiment breakdown
- Problems detected
- Insights and recommendations

## Security & Access Control

- **Admin Only**: All communication analysis features restricted to admins
- **Data Privacy**: Sensitive communication data protected
- **Audit Logging**: All access logged

## Integration Points

- **Call Transcription**: Uses transcripts from call system
- **Email Integration**: Future integration with email system
- **Customer Onboarding**: Links to customer data
- **Projects**: Links to quotes/projects

## Testing

- Test sentiment analysis accuracy
- Test problem detection
- Test health score calculation
- Test admin access restrictions
- Test audit logging

## Deliverables

1. Database tables for communications and analysis
2. Communication analysis API
3. Client health API
4. Admin dashboard API
5. AI analysis service
6. Admin dashboard components
7. Integration with call transcription
8. Integration with audit trails

## Success Criteria

- AI accurately analyzes sentiment
- Problems are correctly identified
- Health scores are calculated accurately
- Early warnings are generated
- Admin access is properly restricted
- All actions logged to audit trails

