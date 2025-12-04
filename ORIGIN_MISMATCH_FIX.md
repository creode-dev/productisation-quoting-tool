# OAuth Origin Mismatch Error - Fix Guide

## The Problem

You're getting an "origin mismatch" error because the origin of your application doesn't exactly match what's configured in Google Cloud Console.

According to [Google's documentation](https://developers.google.com/identity/protocols/oauth2/javascript-implicit-flow#authorization-errors-origin-mismatch), the origin must match **EXACTLY**.

## The Fix

### Step 1: Open Google Cloud Console

1. Go to: https://console.cloud.google.com/apis/credentials?project=creode-process
2. Find OAuth 2.0 Client ID: `1067455774232-etur5mho6f0qbsr8aq5l1ehev4silrp5`
3. Click the **Edit** icon (pencil)

### Step 2: Check "Authorized JavaScript origins"

You MUST have EXACTLY this (copy-paste to avoid typos):

```
https://productisation.vercel.app
```

**Critical requirements:**
- ✅ Must start with `https://` (not `http://`)
- ✅ Must be lowercase: `productisation` (not `Productisation`)
- ✅ **NO trailing slash** (not `https://productisation.vercel.app/`)
- ✅ **NO port number** (not `https://productisation.vercel.app:443`)
- ✅ Must be the exact domain: `productisation.vercel.app`

### Step 3: Check "Authorized redirect URIs"

You MUST have:

```
https://productisation.vercel.app/api/auth/google
```

**Note:** This is different from JavaScript origins - this is the full URL path.

### Step 4: Common Mistakes to Avoid

❌ **WRONG:**
- `https://productisation.vercel.app/` (trailing slash)
- `http://productisation.vercel.app` (wrong protocol)
- `https://productisation.vercel.app:443` (port number)
- `HTTPS://PRODUCTISATION.VERCEL.APP` (uppercase)
- `https://www.productisation.vercel.app` (www subdomain)

✅ **CORRECT:**
- `https://productisation.vercel.app` (exact match)

### Step 5: Save and Wait

1. Click **Save**
2. **Wait 2-3 minutes** for changes to propagate
3. Clear your browser cache/cookies
4. Try logging in again

## Verification

After saving, verify:

1. The origin `https://productisation.vercel.app` appears in the list
2. There are NO duplicates
3. There are NO variations (with/without trailing slash, etc.)
4. The redirect URI `https://productisation.vercel.app/api/auth/google` is present

## Why This Happens

The `@react-oauth/google` library sends the OAuth request from the browser. Google checks the origin (protocol + domain + port) against the configured "Authorized JavaScript origins". If there's any mismatch, even a trailing slash, Google rejects the request.

## Testing

After fixing:

1. Wait 2-3 minutes
2. Clear browser cache: `Cmd+Shift+Delete` (Mac) or `Ctrl+Shift+Delete` (Windows)
3. Visit: https://productisation.vercel.app/login
4. Click "Sign in"
5. Should work without origin mismatch error

## If Still Not Working

1. Check browser console (F12) for exact error message
2. Verify the origin in browser console:
   ```javascript
   console.log(window.location.origin);
   // Should output: https://productisation.vercel.app
   ```
3. Compare this EXACTLY with what's in Google Cloud Console
4. Make sure there are no extra spaces or hidden characters

