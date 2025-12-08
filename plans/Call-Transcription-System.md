# Call Transcription System

## Overview

Implement a system for transcribing video calls, VOIP calls, in-person meetings, and mobile phone calls. After each recording, the transcript is added to the system and key points are extracted by AI. This is a two-step process: initial assessment of call type (new business, kick-off, project update, etc.) followed by a meeting-type-specific prompt to extract appropriate details. AI responses are stored and linked to the appropriate client/project.

## Dependencies

**Phase 1** - Audit trails must be implemented  
**Customer Onboarding System** - Must exist (provides customer data)

## Database Schema

### Call Recordings Table

```sql
CREATE TABLE call_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
  call_type TEXT CHECK (call_type IN ('new_business', 'kickoff', 'project_update', 'support', 'other')),
  call_source TEXT NOT NULL CHECK (call_source IN ('video', 'voip', 'in_person', 'mobile', 'other')),
  recording_url TEXT,
  recording_provider TEXT,
  recording_id TEXT,
  duration_seconds INTEGER,
  participants TEXT[],
  recorded_at TIMESTAMP NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Call Transcripts Table

```sql
CREATE TABLE call_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_recording_id UUID NOT NULL REFERENCES call_recordings(id) ON DELETE CASCADE,
  transcript_text TEXT NOT NULL,
  transcription_provider TEXT,
  transcription_status TEXT DEFAULT 'pending' CHECK (transcription_status IN ('pending', 'processing', 'completed', 'failed')),
  language TEXT DEFAULT 'en',
  confidence_score DECIMAL(3,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Call AI Analysis Table

```sql
CREATE TABLE call_ai_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_transcript_id UUID NOT NULL REFERENCES call_transcripts(id) ON DELETE CASCADE,
  call_type_assessment TEXT,
  extracted_key_points JSONB NOT NULL,
  action_items JSONB,
  decisions_made JSONB,
  next_steps JSONB,
  ai_model_used TEXT,
  analysis_prompt TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## API Endpoints

### Call Recordings API (`api/calls/index.ts`)

- `GET /api/calls` - List call recordings
- `GET /api/calls/[id]` - Get call details
- `POST /api/calls` - Create call recording record
- `POST /api/calls/[id]/transcribe` - Trigger transcription

### Call Transcripts API (`api/calls/[id]/transcript.ts`)

- `GET /api/calls/[id]/transcript` - Get transcript
- `POST /api/calls/[id]/transcript` - Update transcript

### Call AI Analysis API (`api/calls/[id]/analysis.ts`)

- `GET /api/calls/[id]/analysis` - Get AI analysis
- `POST /api/calls/[id]/analyze` - Trigger AI analysis

## Integration with Third-Party Services

### Transcription Providers

- Otter.ai
- Rev
- AssemblyAI
- Google Speech-to-Text
- AWS Transcribe

### Integration Flow

1. Recording uploaded/created
2. Send to transcription service
3. Receive transcript
4. Store in database
5. Trigger AI analysis
6. Store extracted key points

## AI Analysis Process

### Step 1: Call Type Assessment

AI analyzes transcript to determine call type:
- New business
- Kick-off meeting
- Project update
- Support call
- Other

### Step 2: Type-Specific Extraction

Based on call type, AI extracts:
- **New Business**: Requirements, budget, timeline, decision makers
- **Kick-off**: Project goals, team members, deliverables, timeline
- **Project Update**: Progress, blockers, decisions, next steps
- **Support**: Issue description, resolution, follow-up needed

## Frontend Components

### Call Recording List (`src/components/calls/CallRecordingList.tsx`)
- List all call recordings
- Filter by customer, project, call type
- View transcript and analysis

### Call Detail (`src/components/calls/CallDetail.tsx`)
- Full call information
- Transcript display
- AI analysis results
- Action items
- Link to customer/project

### Call Upload (`src/components/calls/CallUpload.tsx`)
- Upload recording file
- Enter call metadata
- Link to customer/project

## Testing

- Test call recording creation
- Test transcription integration
- Test AI analysis
- Test call type detection
- Test key point extraction

## Deliverables

1. Database tables for recordings, transcripts, AI analysis
2. Call recordings API
3. Transcription service integration
4. AI analysis service
5. Call recording components
6. Integration with customers/projects
7. Integration with audit trails

## Success Criteria

- Call recordings can be uploaded and stored
- Transcripts are generated accurately
- AI correctly identifies call types
- Key points are extracted appropriately
- Data is linked to customers/projects
- All actions logged to audit trails

