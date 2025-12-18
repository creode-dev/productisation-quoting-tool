# Phase 6: Documentation Management

## Overview

Enhance the documentation system to support manual editing with WYSIWYG interface (Tiptap) and AI-powered review capabilities. AI will review documents for legislation updates, best practices, and tool accuracy. This phase can be developed in parallel with Phases 2-5 as it only depends on Phase 1.

## Dependencies

**Phase 1** - Audit trails must be implemented (all documentation actions logged)

## Database Schema

### Documentation Files Table

Create `documentation_files` table in [api/lib/db.ts](api/lib/db.ts):

- `id` (UUID, primary key)
- `file_path` (TEXT, unique, e.g., "Documentation/Process/Discovery.md")
- `title` (TEXT)
- `content` (TEXT, markdown content)
- `last_reviewed_at` (TIMESTAMP, nullable)
- `next_review_date` (DATE, nullable, calculated from review frequency)
- `review_frequency_days` (INTEGER, nullable, configurable per document)
- `last_modified_by` (TEXT, user email)
- `last_modified_at` (TIMESTAMP)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Documentation Reviews Table

Create `documentation_reviews` table:

- `id` (UUID, primary key)
- `documentation_file_id` (UUID, foreign key to documentation_files)
- `review_type` (TEXT, enum: manual, scheduled, on_update)
- `status` (TEXT, enum: pending, in_progress, completed, failed)
- `ai_suggestions` (JSONB, stores AI suggestions)
- `tools_detected` (JSONB, array of detected tools)
- `tools_confirmed` (JSONB, array of confirmed tools)
- `legislation_searches` (JSONB, array of searches performed)
- `best_practice_updates` (JSONB, array of suggested updates)
- `reviewed_by` (TEXT, user email, nullable for AI reviews)
- `reviewed_at` (TIMESTAMP, nullable)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Documentation Changes Table

Create `documentation_changes` table:

- `id` (UUID, primary key)
- `documentation_file_id` (UUID, foreign key to documentation_files)
- `review_id` (UUID, foreign key to documentation_reviews, nullable)
- `change_type` (TEXT, enum: manual_edit, ai_suggestion_applied, tool_update)
- `old_content` (TEXT, content before change)
- `new_content` (TEXT, content after change)
- `diff` (TEXT, unified diff format)
- `applied_by` (TEXT, user email)
- `applied_at` (TIMESTAMP)
- `created_at` (TIMESTAMP)

### Indexes

- Index on `documentation_files.file_path`
- Index on `documentation_files.next_review_date`
- Index on `documentation_reviews.documentation_file_id`
- Index on `documentation_reviews.status`
- Index on `documentation_changes.documentation_file_id`

## AI Integration

### AI Service ([api/lib/ai.ts](api/lib/ai.ts))

Create AI service wrapper for Anthropic Claude:

- `reviewDocumentation(content, context)` - Review document and suggest updates
  - Analyze content for outdated information
  - Identify areas needing updates
  - Generate suggestions
- `extractTools(content)` - Extract tool names from document (AI extraction)
  - Identify tools mentioned
  - Determine context (still in use, deprecated, replaced)
- `searchLegislation(topic, jurisdiction)` - Generate search queries for legislation
  - Create relevant search queries
  - Store queries for user execution
- `suggestBestPractices(content, industry)` - Suggest best practice updates
  - Identify areas needing updates
  - Suggest modern approaches, industry standards
- `generateDiff(oldContent, newContent, suggestions)` - Generate diff view

### Environment Variables

- `ANTHROPIC_API_KEY` - Anthropic API key
- `ANTHROPIC_MODEL` - Model to use (default: claude-3-sonnet-20240229)

## API Endpoints

### Documentation Files API ([api/documentation/index.ts](api/documentation/index.ts))

- `GET /api/documentation` - List all documentation files
- `GET /api/documentation?path={path}` - Get specific file content
- `PUT /api/documentation?path={path}` - Update file content (manual edit)
  - Log to audit trail
  - Update last_modified_by and last_modified_at
- `POST /api/documentation` - Create new documentation file
- `DELETE /api/documentation?path={path}` - Delete file
  - Log to audit trail

### Documentation Reviews API ([api/documentation/reviews.ts](api/documentation/reviews.ts))

- `POST /api/documentation/reviews` - Trigger manual AI review
  - Request body: `{ filePath, reviewType: 'manual' }`
  - Calls AI service to review document
  - Stores review in database
  - Returns review ID
- `GET /api/documentation/reviews?filePath={path}` - Get review history for file
- `GET /api/documentation/reviews?id={id}` - Get specific review details
- `POST /api/documentation/reviews/{id}/apply` - Apply AI suggestions
  - Request body: `{ suggestions: [...], applyAll: boolean }`
  - Supports all three modes: suggestions view, diff view, auto-apply
  - Creates documentation change record
  - Logs to audit trail

### Documentation Changes API ([api/documentation/changes.ts](api/documentation/changes.ts))

- `GET /api/documentation/changes?filePath={path}` - Get change history
- `GET /api/documentation/changes?id={id}` - Get specific change with diff

### Scheduled Reviews ([api/documentation/scheduled-reviews.ts](api/documentation/scheduled-reviews.ts))

- `POST /api/documentation/scheduled-reviews/run` - Run scheduled reviews (cron job)
  - Finds files where `next_review_date <= today`
  - Triggers AI review for each
  - Updates `next_review_date` based on `review_frequency_days`
  - Can be called manually or via scheduled job

## Frontend Components

### WYSIWYG Editor ([src/components/DocumentationEditor.tsx](src/components/DocumentationEditor.tsx))

- Use Tiptap editor with Markdown extension
- Real-time preview toggle
- Save/Cancel buttons
- Auto-save draft functionality (localStorage or backend)
- Toolbar with formatting options
- Support for code blocks, tables, lists, etc.
- Permission check (who can edit?)

### Documentation Review Panel ([src/components/DocumentationReview.tsx](src/components/DocumentationReview.tsx))

- Display AI review results
- Show suggestions with:
  - Legislation updates (with search queries)
  - Best practice suggestions
  - Tool detection list (with confirmation checkboxes)
- Three view modes:
  - **Suggestions View**: List of suggestions with apply buttons
  - **Diff View**: Side-by-side or unified diff
  - **Auto-Apply View**: Preview of changes before applying
- Apply buttons: Apply All, Apply Selected, Reject
- Loading state during review

### Tool Detection Panel ([src/components/ToolDetection.tsx](src/components/ToolDetection.tsx))

- Display list of tools detected by AI
- For each tool:
  - Tool name
  - Current status (mentioned in doc)
  - Suggested status (still in use, deprecated, replaced)
  - Checkbox to confirm/correct
- Update documentation based on confirmations
- Apply changes button

### Review History ([src/components/DocumentationReviewHistory.tsx](src/components/DocumentationReviewHistory.tsx))

- Display review history for a document
- Show all reviews with status, date, reviewer
- Link to view suggestions and applied changes
- Filter by review type (manual, scheduled, on_update)

### Change History ([src/components/DocumentationChangeHistory.tsx](src/components/DocumentationChangeHistory.tsx))

- Display change history with diffs
- Show who made changes and when
- Link changes to reviews if applicable
- Revert functionality (optional)

### Review Configuration ([src/components/DocumentationReviewConfig.tsx](src/components/DocumentationReviewConfig.tsx))

- Configure review frequency per document
- Set next review date
- Enable/disable auto-review
- Configure review triggers (on update, scheduled, manual)

## AI Review Process

### Manual Review Trigger

1. User clicks "Review with AI" button
2. System sends document content to Claude API
3. AI analyzes:
   - Content for outdated information
   - Tools mentioned
   - Legislation references
   - Best practices
4. AI generates:
   - List of suggested updates
   - Tool detection list
   - Legislation search queries
   - Best practice recommendations
5. Store review in `documentation_reviews` table
6. Display results in Review Panel

### Scheduled Review (Configurable per document)

1. Cron job runs daily (or configurable interval)
2. Query files where `next_review_date <= today`
3. For each file:
   - Trigger AI review
   - Update `last_reviewed_at`
   - Calculate `next_review_date` = today + `review_frequency_days`
4. Store review results
5. Optional: Send notifications for reviews requiring attention

### Review on Document Update

1. When document is manually edited
2. Optionally trigger AI review (configurable)
3. Compare new content with previous
4. Generate suggestions for changes
5. Store review linked to the change

### Tool Detection Process (AI Extraction)

1. AI extracts tool names from document
2. AI determines context (are tools still in use?)
3. Present list to user:
   - Tool A: Mentioned, status unknown
   - Tool B: Mentioned, appears deprecated
   - Tool C: Mentioned, replaced by Tool X
4. User confirms/corrects each tool
5. Apply updates to document based on confirmations

### Applying Suggestions (All modes supported)

1. User reviews suggestions in Review Panel
2. User selects suggestions to apply (or Apply All)
3. System generates updated content
4. Show diff view for confirmation
5. User confirms application
6. Save new content
7. Store change in `documentation_changes` table
8. Link change to review
9. Log to audit trail

## Implementation Details

### Tiptap Setup

- Install `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-markdown`
- Configure editor with Markdown import/export
- Add toolbar with common formatting options
- Support for code blocks, tables, lists, etc.
- Real-time preview mode

### AI Prompt Engineering

- Design prompts for:
  - Document review (outdated content, accuracy)
  - Tool extraction (identify tools, determine status)
  - Legislation search generation (create relevant search queries)
  - Best practice suggestions (industry standards, modern approaches)
- Use structured output (JSON) for consistent parsing
- Handle API errors gracefully

### Legislation Search

- AI generates search queries (e.g., "GDPR updates 2024", "UK data protection regulations")
- Store queries in review record
- User can execute searches externally
- AI can suggest updates based on search results (manual or API integration)

### Best Practice Updates

- AI identifies areas needing updates
- Suggests modern approaches, industry standards
- Provides context and reasoning
- User can accept/reject suggestions

### Change Tracking

- Store full content before/after changes
- Generate unified diff for display
- Track who made changes and when
- Link changes to reviews for audit trail

## Libraries

- `@tiptap/react` - WYSIWYG editor
- `@tiptap/starter-kit` - Basic editor functionality
- `@tiptap/extension-markdown` - Markdown support
- `@anthropic-ai/sdk` - Anthropic Claude SDK
- `diff` or `diff-match-patch` - For generating diffs

## Scheduled Jobs

- Set up cron job or scheduled function (Vercel Cron or similar)
- Run daily to check for documents needing review
- Trigger AI reviews for due documents
- Update review dates

## Testing

- Test WYSIWYG editor functionality
- Test markdown import/export
- Test AI review integration
- Test tool detection
- Test suggestion application (all modes)
- Test scheduled reviews
- Test change tracking
- Test permission checks
- Test audit logging integration

## Deliverables

1. `documentation_files`, `documentation_reviews`, `documentation_changes` database tables
2. AI service wrapper for Anthropic Claude
3. Documentation files API endpoints
4. Documentation reviews API endpoints
5. Documentation changes API endpoints
6. Scheduled reviews system
7. WYSIWYG editor component (Tiptap)
8. Documentation review panel component
9. Tool detection panel component
10. Review history and change history components
11. Review configuration UI
12. Integration with audit trails (Phase 1)
13. Scheduled job setup

## Success Criteria

- Documentation can be edited with WYSIWYG interface
- AI reviews can be triggered manually and scheduled
- Tool detection works correctly
- Suggestions can be applied in all three modes
- Change history is tracked
- Review configuration works per document
- All actions logged to audit trails
- Ready for production use




