# Quick Fix Guide

## Issues Fixed

✅ **Development Servers** - Created `scripts/fix-dev-servers.sh` to properly start both servers
✅ **Project Linking** - Verified Vercel project is correctly linked

## Remaining Issue: Google OAuth Origin

### The Problem
Google OAuth is showing: `"The given origin is not allowed for the given client ID"`

This means `http://localhost:5174` is not in your OAuth Client's authorized origins.

### The Fix (2 minutes)

1. **Go to Google Cloud Console:**
   - Open: https://console.cloud.google.com/apis/credentials

2. **Find Your OAuth Client:**
   - Look for: `1067455774232-etur5mho6f0qbsr8aq5l1ehev4silrp5.apps.googleusercontent.com`
   - Click on it to edit

3. **Add Authorized Origin:**
   - Scroll to **"Authorized JavaScript origins"**
   - Click **"+ ADD URI"**
   - Enter exactly: `http://localhost:5174`
   - ⚠️ **Important:** 
     - No trailing slash
     - Lowercase
     - `http` not `https`
     - Port `5174` not `5173`

4. **Save:**
   - Click **"SAVE"** at the bottom

5. **Test:**
   - Refresh your browser at http://localhost:5174
   - Try logging in again

### Quick Verification

After adding the origin, you can verify it worked by:
- The Google login button should no longer show the origin error
- You should be able to click it and see the Google login popup

## Starting Development Servers

Use the fix script:

```bash
bash scripts/fix-dev-servers.sh
```

Or manually:

```bash
# Terminal 1: API server
npx vercel dev --listen 3001

# Terminal 2: Frontend server  
npm run dev
```

Then open: http://localhost:5174

## Troubleshooting

### API Routes Still Not Working?

1. Check if Vercel dev is running:
   ```bash
   lsof -ti:3001
   ```

2. Check logs:
   ```bash
   tail -f /tmp/vercel-api.log
   ```

3. Verify project:
   ```bash
   cat .vercel/project.json
   ```

### OAuth Still Not Working?

1. Double-check the origin is exactly: `http://localhost:5174`
2. Make sure you clicked "SAVE" in Google Cloud Console
3. Wait 1-2 minutes for changes to propagate
4. Clear browser cache and try again
5. Check browser console for exact error message

