# Production 500 Error Fix Guide

## Issue
Getting 500 errors on `/api/auth/me` and `/api/auth/google` in production.

## Root Causes

1. **Database not initialized** - The employee portal tables don't exist yet
2. **Missing API routes** - Some routes may not be deployed correctly
3. **JWT_SECRET issue** - May not be set correctly in production

## Fix Steps

### Step 1: Verify Environment Variables in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: `productisation`
3. Go to **Settings** > **Environment Variables**
4. Verify these are set for **Production**:
   - `JWT_SECRET` ✅ (should be set)
   - `DATABASE_URL` ✅ (should be set)
   - `GOOGLE_CALENDAR_ID` ✅ (we just added this)
   - `GOOGLE_DRIVE_FOLDER_ID` ✅ (we just added this)
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL` ✅ (we just added this)
   - `GOOGLE_SERVICE_ACCOUNT_KEY` ✅ (we just added this)

### Step 2: Initialize Database

The database needs to be initialized. The `/api/init-db` endpoint should work, but if it's returning 404, try:

**Option A: Via Browser/curl**
```bash
curl https://productisation.vercel.app/api/init-db
```

**Option B: Check Vercel Function Logs**
1. Go to Vercel Dashboard > Your Project > **Deployments**
2. Click on the latest deployment
3. Go to **Functions** tab
4. Look for `api/init-db` function
5. Check if it exists and view logs

**Option C: Manual Database Setup**
If the endpoint doesn't work, you can run the SQL directly in Vercel Postgres:
1. Go to Vercel Dashboard > Your Project > **Storage** > **Postgres**
2. Click **Data** tab
3. Run the SQL from `api/lib/db.ts` manually

### Step 3: Redeploy Application

After ensuring environment variables are set:

```bash
# Commit and push changes
git add .
git commit -m "Fix: Add missing API routes and database initialization"
git push
```

Vercel will automatically redeploy.

### Step 4: Test After Redeploy

1. Wait for deployment to complete
2. Visit: `https://productisation.vercel.app/api/init-db`
3. Should see: `{"success":true,"message":"Database initialized successfully"}`
4. Try logging in again

## Quick Fix Commands

```bash
# 1. Check current environment variables
vercel env ls

# 2. Initialize database (after deployment)
curl https://productisation.vercel.app/api/init-db

# 3. Check deployment logs
vercel logs --follow
```

## Common Issues

### Issue: `/api/init-db` returns 404
**Solution:** The file exists at `api/init-db.ts`. Make sure it's committed and deployed. Check Vercel Functions tab to see if it's listed.

### Issue: JWT_SECRET error
**Solution:** 
```bash
# Verify JWT_SECRET is set
vercel env ls | grep JWT_SECRET

# If missing, add it
vercel env add JWT_SECRET production
# Enter a secure random string (use: openssl rand -base64 32)
```

### Issue: Database connection error
**Solution:**
1. Check `DATABASE_URL` is set in Vercel
2. Verify Postgres database exists in Vercel Storage
3. Check database is not paused

## Verification Checklist

- [ ] All environment variables are set in Vercel Production
- [ ] Database is initialized (check `/api/init-db` endpoint)
- [ ] Latest code is deployed to Vercel
- [ ] JWT_SECRET is set and not using default value
- [ ] DATABASE_URL is configured correctly
- [ ] Google API credentials are set

## Next Steps After Fix

1. Test login: `https://productisation.vercel.app/login`
2. Test employee portal: `https://productisation.vercel.app/portal`
3. Check Vercel function logs for any errors
4. Monitor for any remaining 500 errors

