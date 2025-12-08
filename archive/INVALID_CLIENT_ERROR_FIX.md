# OAuth "invalid_client" Error Fix

## The Error

**Error 401: invalid_client** - "The OAuth client was not found"

This means Google can't find the OAuth client with the Client ID being used in the request.

## Root Causes

1. **Client ID mismatch** - The Client ID in environment variables doesn't match Google Cloud Console
2. **Client ID not set** - `GOOGLE_CLIENT_ID` environment variable is missing or empty
3. **Wrong project** - Client ID belongs to a different Google Cloud project
4. **Redirect URI mismatch** - The redirect URI in the request doesn't match what's configured

## Fix Steps

### Step 1: Verify Client ID in Google Cloud Console

1. Go to: https://console.cloud.google.com/apis/credentials?project=creode-process
2. Find OAuth 2.0 Client ID
3. Copy the **Client ID** (should be: `1067455774232-etur5mho6f0qbsr8aq5l1ehev4silrp5.apps.googleusercontent.com`)

### Step 2: Verify Client ID in Vercel

```bash
vercel env get GOOGLE_CLIENT_ID production
```

**Expected:** `1067455774232-etur5mho6f0qbsr8aq5l1ehev4silrp5.apps.googleusercontent.com`

### Step 3: Update if Mismatched

If the Client ID in Vercel doesn't match Google Cloud Console:

```bash
# Remove old value
vercel env rm GOOGLE_CLIENT_ID production

# Add correct value
vercel env add GOOGLE_CLIENT_ID production
# Paste: 1067455774232-etur5mho6f0qbsr8aq5l1ehev4silrp5.apps.googleusercontent.com

# Repeat for preview and development
vercel env rm GOOGLE_CLIENT_ID preview
vercel env add GOOGLE_CLIENT_ID preview

vercel env rm GOOGLE_CLIENT_ID development
vercel env add GOOGLE_CLIENT_ID development
```

### Step 4: Verify Redirect URI

In Google Cloud Console, ensure the redirect URI is exactly:
```
https://productisation.vercel.app/api/auth/google/callback
```

### Step 5: Redeploy

After updating environment variables, trigger a new deployment:

```bash
git commit --allow-empty -m "Trigger redeploy for GOOGLE_CLIENT_ID fix"
git push origin staging
```

Or wait for Vercel to auto-deploy (environment variable changes don't always trigger auto-deploy).

## Quick Verification

1. **Google Cloud Console Client ID:**
   - Should be: `1067455774232-etur5mho6f0qbsr8aq5l1ehev4silrp5.apps.googleusercontent.com`

2. **Vercel Environment Variable:**
   ```bash
   vercel env get GOOGLE_CLIENT_ID production
   ```
   - Should match exactly

3. **Redirect URI in Google Cloud Console:**
   - Should be: `https://productisation.vercel.app/api/auth/google/callback`

## Common Issues

### Issue: Client ID has extra characters
- Check for leading/trailing spaces
- Check for newlines
- Make sure it's the full Client ID including `.apps.googleusercontent.com`

### Issue: Wrong project
- Make sure you're using the Client ID from `creode-process` project
- Not from a different Google Cloud project

### Issue: Environment variable not loaded
- After updating, you may need to redeploy
- Environment variables are loaded at build time

## Testing After Fix

1. Wait for deployment to complete
2. Visit: https://productisation.vercel.app/login
3. Click "Sign in with Google"
4. Should redirect to Google OAuth (not show invalid_client error)



