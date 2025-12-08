# Environment Variables Setup - COMPLETE ✅

All environment variables have been successfully configured for the Employee Portal!

## ✅ What Was Done

### 1. Vercel Environment Variables
All 4 required environment variables have been added to your Vercel project for **Production**, **Preview**, and **Development** environments:

- ✅ `GOOGLE_CALENDAR_ID` = `c_9c4ecb46590f2d06d6991fddecc2dd1d34f4ac9e569b96d797cdc4cf082378c0@group.calendar.google.com`
- ✅ `GOOGLE_DRIVE_FOLDER_ID` = `1CEKBTAAFYXabsxIiR8cksEAfvlS4ZuA5`
- ✅ `GOOGLE_SERVICE_ACCOUNT_EMAIL` = `employee-portal-service@creode-process.iam.gserviceaccount.com`
- ✅ `GOOGLE_SERVICE_ACCOUNT_KEY` = (Private key configured)

### 2. Local Development Setup

To use these variables locally, run:
```bash
vercel env pull .env.local
```

This will create a `.env.local` file with all your environment variables.

**Note:** The `.env.local` file is already in `.gitignore`, so it won't be committed to version control.

## 🚀 Next Steps

### Step 1: Initialize Database

The database needs to be initialized once. You can do this in two ways:

**Option A: Local Development**
1. Start the Vercel dev server:
   ```bash
   npx vercel dev --listen 3001
   ```

2. In another terminal or browser, call:
   ```bash
   curl http://localhost:3001/api/init-db
   ```
   
   Or visit: `http://localhost:3001/api/init-db`

**Option B: Production (if already deployed)**
1. Visit: `https://your-app.vercel.app/api/init-db`
2. You should see: `{"success":true,"message":"Database initialized successfully"}`

### Step 2: Verify Setup

1. **Check Environment Variables:**
   ```bash
   vercel env ls | grep GOOGLE
   ```
   You should see all 4 GOOGLE_* variables listed.

2. **Test the Employee Portal:**
   - Start your dev server: `npm run dev:vercel` or `npx vercel dev`
   - Navigate to `/portal` in your application
   - Try creating an employee profile
   - Try uploading a document
   - Try creating a holiday request

### Step 3: Deploy (if needed)

If you want to deploy these changes to production:
```bash
git add .
git commit -m "Add Employee Portal with Google Calendar and Drive integration"
git push
```

Vercel will automatically deploy with the new environment variables.

## 📋 Environment Variables Summary

| Variable | Value | Status |
|----------|-------|--------|
| `GOOGLE_CALENDAR_ID` | `c_9c4ecb46590f2d06d6991fddecc2dd1d34f4ac9e569b96d797cdc4cf082378c0@group.calendar.google.com` | ✅ Set |
| `GOOGLE_DRIVE_FOLDER_ID` | `1CEKBTAAFYXabsxIiR8cksEAfvlS4ZuA5` | ✅ Set |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | `employee-portal-service@creode-process.iam.gserviceaccount.com` | ✅ Set |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | (Private key) | ✅ Set |

All variables are configured for:
- ✅ Production
- ✅ Preview  
- ✅ Development

## 🔒 Security Notes

- The private key is encrypted in Vercel
- The `.env.local` file is in `.gitignore` and won't be committed
- Never commit service account keys to version control
- Rotate keys periodically for security

## 🐛 Troubleshooting

If you encounter issues:

1. **Environment variables not loading:**
   - Make sure you've run `vercel env pull .env.local` for local development
   - Restart your dev server after pulling env vars
   - For production, redeploy after adding env vars

2. **Database initialization fails:**
   - Check that `DATABASE_URL` is set in Vercel
   - Verify you have a Vercel Postgres database
   - Check server logs for detailed errors

3. **Google API errors:**
   - Verify the service account has access to the calendar
   - Check that the Drive folder is shared with the service account
   - Ensure Calendar API and Drive API are enabled in Google Cloud Console

## ✅ Setup Complete!

Your Employee Portal is now configured with:
- ✅ Google Calendar integration
- ✅ Google Drive integration  
- ✅ Service account authentication
- ✅ All environment variables set

You're ready to use the Employee Portal! 🎉




