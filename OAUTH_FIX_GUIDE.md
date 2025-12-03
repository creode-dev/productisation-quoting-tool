# OAuth 500 Error - Investigation & Fix Guide

## Current Status

✅ **Environment Variables Set:**
- `VITE_GOOGLE_CLIENT_ID` - Set in Production
- `JWT_SECRET` - Set in Production (18 chars - should be longer)
- All Google service account variables set

❌ **API Endpoints Returning 500:**
- `/api/auth/me` - 500 error
- `/api/auth/google` - 500 error (FUNCTION_INVOCATION_FAILED)

## Root Cause Analysis

The 500 errors suggest the serverless functions are crashing. Possible causes:

1. **JWT_SECRET too short** (18 characters - should be 32+)
2. **OAuth client missing authorized origins**
3. **Code errors in the deployed version**
4. **Missing dependencies or import errors**

## Fix Steps

### Step 1: Verify OAuth Client Configuration

**Using Google Cloud Console:**

1. Go to: https://console.cloud.google.com/apis/credentials?project=creode-process
2. Find OAuth 2.0 Client ID: `1067455774232-etur5mho6f0qbsr8aq5l1ehev4silrp5`
3. Click "Edit"
4. Verify **Authorized JavaScript origins** includes:
   - `https://productisation.vercel.app`
   - `http://localhost:5174`
5. Verify **Authorized redirect URIs** includes:
   - `https://productisation.vercel.app/api/auth/google`
6. Click "Save"
7. Wait 2-3 minutes for changes to propagate

**Using gcloud CLI (if authenticated):**

```bash
# Authenticate
gcloud auth login
gcloud auth application-default login

# Set project
gcloud config set project creode-process

# Note: OAuth client configuration must be updated via web console
# The API doesn't support direct modification
```

### Step 2: Regenerate JWT_SECRET

The current JWT_SECRET is only 18 characters. Generate a new one:

```bash
# Generate new secret
openssl rand -base64 32

# Update in Vercel
vercel env rm JWT_SECRET production
vercel env add JWT_SECRET production
# Paste the new secret when prompted

# Also update for preview and development
vercel env rm JWT_SECRET preview
vercel env add JWT_SECRET preview

vercel env rm JWT_SECRET development  
vercel env add JWT_SECRET development
```

### Step 3: Check Vercel Function Logs

```bash
# Get latest deployment
DEPLOYMENT=$(vercel ls | grep "Ready" | head -1 | awk '{print $2}')

# View logs
vercel logs $DEPLOYMENT

# Or view in dashboard
# https://vercel.com/dashboard → Your Project → Deployments → Latest → Functions → api/auth/google
```

### Step 4: Verify Code Deployment

Ensure the latest code is deployed:

```bash
# Check git status
git status

# If changes exist, commit and push
git add .
git commit -m "Fix: Update OAuth configuration"
git push origin staging
```

### Step 5: Test After Fixes

1. Wait for Vercel deployment to complete
2. Wait 2-3 minutes after OAuth client update
3. Test login: https://productisation.vercel.app/login
4. Check browser console for errors
5. Check Vercel function logs for detailed errors

## Quick Diagnostic Commands

```bash
# Run diagnostic script
./scripts/diagnose-oauth.sh

# Check OAuth client config
./scripts/check-oauth-client.sh

# Test API endpoints
curl -v https://productisation.vercel.app/api/auth/me
curl -v -X POST https://productisation.vercel.app/api/auth/google \
  -H "Content-Type: application/json" \
  -d '{"credential":"test"}'
```

## Most Likely Issues

1. **OAuth Client Missing Production Origin**
   - The authorized JavaScript origin `https://productisation.vercel.app` might not be configured
   - This would cause the OAuth popup to fail

2. **JWT_SECRET Issue**
   - 18 characters is short but should work
   - However, if it's the default value, it will fail
   - Regenerate to be safe

3. **Function Crash on Import**
   - If Google Calendar/Drive modules are imported and fail to initialize
   - But auth/google.ts doesn't import those, so this is less likely

## Next Steps

1. **Check OAuth Client Configuration** (most important)
   - Visit: https://console.cloud.google.com/apis/credentials?project=creode-process
   - Verify production URL is in authorized origins

2. **Regenerate JWT_SECRET**
   - Use the command above to generate and set a new 32+ character secret

3. **Check Vercel Logs**
   - View detailed error messages in Vercel dashboard

4. **Redeploy if needed**
   - After fixing OAuth client, wait 2-3 minutes
   - If code changes, push to trigger new deployment

