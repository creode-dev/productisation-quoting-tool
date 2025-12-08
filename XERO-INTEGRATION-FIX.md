# Xero Integration Fix - Refresh Token Implementation

## Overview

Fixed the Xero integration to automatically refresh access tokens when they expire. Previously, tokens expired after 30 minutes and required manual updates. Now tokens are stored in the database and automatically refreshed.

## What Was Changed

### 1. Database Schema
- Added `xero_tokens` table to store access and refresh tokens
- Table includes: access_token, refresh_token, expires_at, tenant_ids, etc.
- Added to `api/lib/db.ts` with `initXeroTokens()` function
- Updated `api/init-db.ts` to include Xero tokens initialization

### 2. Token Management Service
- Created `api/lib/xeroTokens.ts` with functions:
  - `storeXeroTokens()` - Store tokens in database
  - `getXeroTokens()` - Retrieve tokens from database
  - `refreshXeroAccessToken()` - Refresh expired tokens
  - `getValidXeroAccessToken()` - Get valid token, auto-refresh if needed

### 3. OAuth Callback Update
- Updated `api/auth/xero/callback.ts` to:
  - Store tokens in database after OAuth flow
  - Store tenant IDs automatically
  - Display success message indicating automatic refresh is enabled

### 4. Xero Service Update
- Updated `api/lib/xero.ts` to:
  - Use `getValidXeroAccessToken()` instead of static token
  - Automatically refresh tokens when expired
  - Get tenant IDs from database (fallback to env var)

### 5. OAuth Redirect Endpoint
- Created `api/auth/xero/redirect.ts` for initiating OAuth flow
- Includes CSRF protection with state token
- Handles both production and development redirect URIs

### 6. Token Status Endpoint
- Created `api/xero/token-status.ts` to check token status
- Shows expiration time, tenant IDs, authentication status

## How It Works

### Initial Authentication
1. User visits `/api/auth/xero/redirect`
2. Redirected to Xero OAuth
3. User authorizes app
4. Xero redirects back to `/api/auth/xero/callback`
5. System exchanges code for tokens
6. Tokens stored in database
7. Success page displayed

### Automatic Token Refresh
1. When `getXeroAccessToken()` is called
2. System checks if token is expired (or expiring in < 5 minutes)
3. If expired, automatically calls `refreshXeroAccessToken()`
4. New tokens stored in database
5. Valid token returned

### Token Usage
- All Xero API calls use `getXeroAccessToken()`
- Tokens automatically refreshed as needed
- No manual intervention required

## Setup Instructions

### 1. Initialize Database
```bash
# Call the init endpoint to create the xero_tokens table
curl https://your-domain.vercel.app/api/init-db
```

### 2. Authenticate with Xero
1. Visit: `https://your-domain.vercel.app/api/auth/xero/redirect`
2. Authorize the app in Xero
3. Tokens will be automatically stored
4. You're done! Tokens will auto-refresh

### 3. Verify Token Status
```bash
# Check token status (requires authentication)
curl https://your-domain.vercel.app/api/xero/token-status
```

## Environment Variables

Required:
- `XERO_CLIENT_ID` - Xero OAuth Client ID
- `XERO_CLIENT_SECRET` - Xero OAuth Client Secret

Optional (fallback):
- `XERO_TENANT_ID` - Comma-separated tenant IDs (if not stored in database)
- `XERO_ACCESS_TOKEN` - Fallback if database tokens not available

## API Endpoints

### OAuth Flow
- `GET /api/auth/xero/redirect` - Initiate OAuth flow
- `GET /api/auth/xero/callback` - OAuth callback (handled by Xero)

### Token Management
- `GET /api/xero/token-status` - Check token status (authenticated)

## Testing

1. **Test Initial Authentication**:
   - Visit `/api/auth/xero/redirect`
   - Complete OAuth flow
   - Verify tokens stored in database

2. **Test Token Refresh**:
   - Wait for token to expire (or manually expire in database)
   - Make a Xero API call (e.g., company search)
   - Verify token is automatically refreshed

3. **Test Company Autocomplete**:
   - Use quote form
   - Type company name
   - Verify autocomplete works
   - Verify it continues working after token expiration

## Troubleshooting

### Tokens Not Stored
- Check database initialization: `/api/init-db`
- Check database connection
- Verify OAuth callback is working

### Token Refresh Fails
- Check `XERO_CLIENT_ID` and `XERO_CLIENT_SECRET` are set
- Verify refresh token exists in database
- Check Xero app is still authorized
- May need to re-authenticate if refresh token is invalid

### Company Autocomplete Not Working
- Check token status: `/api/xero/token-status`
- Verify tokens exist in database
- Check tenant IDs are stored
- Try re-authenticating if needed

## Migration from Old System

If you were using `XERO_ACCESS_TOKEN` environment variable:

1. The system will still work with the env var as a fallback
2. For automatic refresh, authenticate via OAuth flow
3. Once tokens are in database, env var is no longer needed
4. Tokens will auto-refresh going forward

## Success Criteria

✅ Tokens stored in database after OAuth  
✅ Tokens automatically refresh when expired  
✅ Company autocomplete works continuously  
✅ No manual token updates required  
✅ Fallback to env var if database tokens unavailable  

---

*Implementation Date: [Current Date]*
*Status: Complete and Ready for Testing*

