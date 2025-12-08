# OAuth 500 Error Investigation Summary

## Current Status

**Deployment:** ✅ Latest code deployed (commit `eb4d9f5`)
**Environment Variables:** ✅ All set in Vercel
**API Endpoints:** ❌ Returning 500 errors

## Diagnostic Results

### Environment Variables
- ✅ `VITE_GOOGLE_CLIENT_ID` - Set
- ✅ `JWT_SECRET` - Set (18 chars - should be 32+)
- ✅ `GOOGLE_CALENDAR_ID` - Set
- ✅ `GOOGLE_DRIVE_FOLDER_ID` - Set
- ✅ `GOOGLE_SERVICE_ACCOUNT_EMAIL` - Set
- ✅ `GOOGLE_SERVICE_ACCOUNT_KEY` - Set

### API Endpoint Tests
- ❌ `/api/auth/me` - Returns 500
- ❌ `/api/auth/google` - Returns 500 (FUNCTION_INVOCATION_FAILED)

## Root Cause Analysis

The 500 errors indicate the serverless functions are **crashing at runtime**. Possible causes:

### 1. OAuth Client Configuration (Most Likely)
**Issue:** The OAuth 2.0 Client may not have `https://productisation.vercel.app` in authorized origins.

**Fix:**
1. Go to: https://console.cloud.google.com/apis/credentials?project=creode-process
2. Find Client ID: `1067455774232-etur5mho6f0qbsr8aq5l1ehev4silrp5`
3. Verify/Add:
   - **Authorized JavaScript origins:** `https://productisation.vercel.app`
   - **Authorized redirect URIs:** `https://productisation.vercel.app/api/auth/google`
4. Save and wait 2-3 minutes

### 2. JWT_SECRET Issue
**Issue:** JWT_SECRET is only 18 characters (should be 32+).

**Fix:**
```bash
# Generate new secret
openssl rand -base64 32

# Update in Vercel
vercel env rm JWT_SECRET production
vercel env add JWT_SECRET production
# Paste new secret

# Repeat for preview and development
```

### 3. Code Error
**Issue:** The function might be crashing due to a code error.

**Check:**
- View Vercel function logs in dashboard
- Look for stack traces or error messages
- Verify all imports are correct

## Immediate Action Items

### Priority 1: Check OAuth Client Configuration
**This is the most likely cause of the login failure.**

1. Visit: https://console.cloud.google.com/apis/credentials?project=creode-process
2. Click on OAuth 2.0 Client ID
3. Verify production URL is in authorized origins
4. If missing, add it and save

### Priority 2: Check Vercel Function Logs
1. Go to: https://vercel.com/dashboard
2. Select project: `productisation`
3. Go to latest deployment
4. Click "Functions" tab
5. Click on `api/auth/google` function
6. View logs for detailed error messages

### Priority 3: Regenerate JWT_SECRET
If JWT_SECRET is the default value, regenerate it using the commands above.

## Verification Commands

```bash
# Run diagnostic
./scripts/diagnose-oauth.sh

# Check OAuth client
./scripts/check-oauth-client.sh

# Verify setup
./scripts/verify-oauth-setup.sh
```

## Expected Behavior After Fix

1. OAuth popup should appear when clicking "Sign in"
2. After Google authentication, should redirect back to app
3. User should be logged in and see the main application
4. No "Request failed" error

## Timeline

- **OAuth client update:** 2-3 minutes to propagate
- **Vercel env var update:** Immediate (may need redeploy)
- **Code deployment:** 2-5 minutes

## Support Resources

- **Google Cloud Console:** https://console.cloud.google.com/apis/credentials?project=creode-process
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Vercel Logs:** Check deployment → Functions → View logs



