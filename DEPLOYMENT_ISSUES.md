# Deployment Issues

## Current Status

✅ **Code pushed to Git** - All changes committed and pushed to `staging` branch

⚠️ **Vercel Deployment Blocked** - Two issues preventing deployment:

### 1. TypeScript Errors in API Routes

Several API routes have TypeScript errors related to `req.query.id` being `string | string[]` instead of just `string`.

**Files needing fixes:**
- `api/documents/[id].ts`
- `api/employees/[id].ts`
- `api/holidays/[id].ts`
- `api/holidays/[id]/approve.ts`
- `api/holidays/[id]/reject.ts`
- `api/teams/[id].ts`
- `api/holidays/index.ts`
- `api/holidays/overlaps.ts`

**Fix pattern:**
```typescript
const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
if (!id) {
  return res.status(400).json({ error: 'ID is required' });
}
```

### 2. Vercel Function Limit (CRITICAL)

**Error:** "No more than 12 Serverless Functions can be added to a Deployment on the Hobby plan"

**Current count:** We have more than 12 API route files, which Vercel counts as serverless functions.

**Solutions:**

#### Option A: Upgrade to Pro Plan
- Upgrade your Vercel account to Pro plan
- This removes the 12 function limit

#### Option B: Consolidate API Routes
- Combine related routes into single files with method-based routing
- Example: Combine `api/holidays/[id]/approve.ts` and `api/holidays/[id]/reject.ts` into `api/holidays/[id].ts` with POST/PATCH methods

#### Option C: Exclude Non-Critical Routes
- Move some routes to a separate service
- Or disable them temporarily for deployment

## Next Steps

1. **Fix TypeScript errors** - Apply the id extraction pattern to all affected files
2. **Address function limit** - Choose one of the solutions above
3. **Redeploy** - Run `vercel --prod` again

## Quick Fix Script

To fix all id extraction issues at once:

```bash
# This will need to be done manually for each file
# Pattern: Replace `const { id } = req.query;` with proper extraction
```


