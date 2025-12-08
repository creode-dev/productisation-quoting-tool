# Xero Integration - Testing Instructions

## ✅ Deployment Complete

The Xero integration has been deployed to production. Follow these steps to test:

## Step 1: Initialize Database

Visit this URL in your browser (or run the curl command):
```
https://agency.creode.dev/api/init-db
```

Expected response:
```json
{"success":true,"message":"Database initialized successfully"}
```

## Step 2: Go to Settings Page

Visit:
```
https://agency.creode.dev/settings/xero
```

You should see:
- Connection status (likely "Not Connected" initially)
- "Run Setup" button
- "Connect Xero Account" button

## Step 3: Run Setup

1. Click the **"Run Setup"** button
2. Review the setup steps shown
3. Should show:
   - ✅ Database table check: success
   - ✅ Environment variables: success
   - Status of tokens

## Step 4: Connect Xero

1. Click **"Connect Xero Account"** button
2. You'll be redirected to Xero
3. Authorize the application
4. You'll be redirected back with success message
5. Tokens are automatically stored

## Step 5: Sync Tenant IDs (if needed)

If tenant IDs aren't showing:
1. Click **"Sync Tenant IDs"** button
2. This syncs from `XERO_TENANT_ID` environment variable

## Step 6: Test Company Autocomplete

1. Go to the main quote form: `https://agency.creode.dev/`
2. Select a project type (e.g., "Web Dev")
3. In the "Company Name" field, start typing (e.g., "Adv", "HM", "coas")
4. You should see autocomplete dropdown with matching companies
5. Select a company from the list

## Troubleshooting

### If autocomplete doesn't work:

1. **Check Settings Page**:
   - Is it showing "Connected" (green)?
   - Are tenant IDs listed?
   - Is token expired? (will auto-refresh)

2. **Check Browser Console**:
   - Open DevTools (F12)
   - Look for errors or `[Xero Search]` messages
   - Check Network tab for API calls to `/api/xero/companies`

3. **Check Server Logs**:
   - In Vercel dashboard, check function logs
   - Look for `[Xero Search]` prefixed messages
   - Check for any error messages

4. **Test Connection**:
   - Visit: `https://agency.creode.dev/api/xero/test-connection` (requires login)
   - This shows detailed diagnostics

### Common Issues:

**"No companies found"**
- Check if tenant IDs are correct
- Verify Xero account has contacts
- Check server logs for API errors

**"Token expired"**
- Should auto-refresh automatically
- If not, reconnect via Settings page

**"401 Unauthorized"**
- Token invalid, reconnect via Settings

## Quick Test Commands

```bash
# Initialize database
curl https://agency.creode.dev/api/init-db

# Check setup (requires auth cookie)
curl https://agency.creode.dev/api/xero/setup -X POST

# Test connection (requires auth cookie)
curl https://agency.creode.dev/api/xero/test-connection
```

## Expected Behavior

✅ **Working**:
- Type 2+ characters in company field
- See dropdown with matching companies
- Can select a company
- Company name and ID stored in quote

❌ **Not Working**:
- No dropdown appears
- Empty results
- Error messages in console
- 401/403 errors

## Next Steps After Testing

Once working:
1. ✅ Company autocomplete works
2. ✅ Tokens auto-refresh
3. ✅ All users can use it (shared connection)
4. ✅ No manual token updates needed

---

**Production URL**: https://agency.creode.dev
**Settings Page**: https://agency.creode.dev/settings/xero
**Status**: Ready for testing

