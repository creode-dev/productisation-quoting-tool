# Staging OAuth Configuration Issue

## The Problem

When deploying to **staging**, Vercel creates a different URL (preview deployment URL), which will cause OAuth to fail because:

1. **Staging URL**: `https://productisation-xxxxx-guy-westons-projects.vercel.app`
2. **Production URL**: `https://productisation.vercel.app`
3. **Google OAuth**: Only allows redirect URIs that are **exactly** configured

If the redirect URI doesn't match, you'll get an error like:
- "redirect_uri_mismatch"
- "Invalid redirect URI"

## Current Code Behavior

The code uses `process.env.VERCEL_URL` to determine the base URL:

```typescript
const BASE_URL = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}` 
  : 'https://productisation.vercel.app';
```

This means:
- **Production**: Uses `https://productisation.vercel.app`
- **Staging/Preview**: Uses the preview deployment URL (e.g., `https://productisation-xxxxx-guy-westons-projects.vercel.app`)

## Solutions

### Option 1: Add All Preview URLs to Google Cloud Console (Not Practical)

❌ **Not recommended** - Preview URLs change with each deployment, so you'd need to add a new redirect URI for every preview deployment.

### Option 2: Use Production URL for All Environments (Recommended)

✅ **Best solution** - Always use the production URL for OAuth redirects, regardless of environment.

**Update the code to always use production URL:**

```typescript
// Always use production URL for OAuth redirects
const BASE_URL = 'https://productisation.vercel.app';
const REDIRECT_URI = `${BASE_URL}/api/auth/google/callback`;
```

**Pros:**
- ✅ Works for all environments (production, staging, preview)
- ✅ Only need one redirect URI in Google Cloud Console
- ✅ No need to update Google Console for each preview deployment

**Cons:**
- ⚠️ After OAuth, user is redirected to production URL (but that's usually fine)

### Option 3: Add Staging-Specific Redirect URI

If you have a fixed staging URL, add it to Google Cloud Console:

1. Go to: https://console.cloud.google.com/apis/credentials?project=creode-process
2. Edit OAuth Client ID
3. In "Authorized redirect URIs", add:
   ```
   https://productisation-xxxxx-guy-westons-projects.vercel.app/api/auth/google/callback
   ```
   (Replace `xxxxx` with your actual staging deployment hash)

**Cons:**
- ❌ Preview URLs change with each deployment
- ❌ Would need to update Google Console frequently
- ❌ Not practical for preview deployments

## Recommended Fix

**Use Option 2** - Always redirect to production URL for OAuth, then the app can handle routing internally.

This ensures:
- ✅ OAuth works in all environments
- ✅ Only one redirect URI needed in Google Cloud Console
- ✅ No maintenance overhead

