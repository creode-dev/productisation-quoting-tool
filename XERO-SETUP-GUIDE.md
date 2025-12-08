# Xero Integration Setup Guide

Complete guide to get Xero company autocomplete working.

## Quick Start

1. **Visit Settings Page**: Go to `/settings/xero` in your app
2. **Click "Run Setup"**: This initializes the database and checks configuration
3. **Click "Connect Xero Account"**: Complete the OAuth flow (one-time setup)
4. **Test**: Try searching for companies in the quote form

## Detailed Setup

### Prerequisites

✅ Environment variables set in Vercel:
- `XERO_CLIENT_ID` - Your Xero OAuth Client ID
- `XERO_CLIENT_SECRET` - Your Xero OAuth Client Secret  
- `XERO_TENANT_ID` - Comma-separated tenant IDs (e.g., `id1,id2`)
- `XERO_ACCESS_TOKEN` - Optional fallback token

### Step 1: Initialize Database

The database needs the `xero_tokens` table. This happens automatically when you:
- Visit `/api/init-db` (one-time)
- Or click "Run Setup" in the Settings page

### Step 2: Connect Xero

1. Go to `/settings/xero`
2. Click "Connect Xero Account"
3. You'll be redirected to Xero to authorize
4. After authorization, you'll be redirected back
5. Tokens are automatically stored in the database

### Step 3: Verify Setup

After connecting, the Settings page will show:
- ✅ Connection status
- Token expiration time
- Tenant IDs
- Setup steps status

### Step 4: Sync Tenant IDs (if needed)

If tenant IDs are in your environment variable but not in the database:
1. Click "Sync Tenant IDs" button
2. This updates the database from `XERO_TENANT_ID` env var

## How It Works

### Shared Connection
- **One-time setup**: Only needs to be done once
- **Shared access**: All users can use company autocomplete
- **Auto-refresh**: Tokens automatically refresh when expired

### Token Management
- Tokens stored in `xero_tokens` database table
- Access tokens expire after 30 minutes
- Refresh tokens used to get new access tokens
- No manual token updates needed

### Tenant IDs
- Stored in database after OAuth
- Can be synced from `XERO_TENANT_ID` env var
- Used to search across multiple Xero organizations

## Troubleshooting

### Company Autocomplete Not Working

1. **Check Settings Page** (`/settings/xero`):
   - Is it connected? (green status)
   - Are tenant IDs shown?
   - Is token expired? (will auto-refresh)

2. **Check Server Logs**:
   - Look for `[Xero Search]` messages
   - Check for error messages

3. **Run Setup Again**:
   - Click "Run Setup" button
   - Review the setup steps output
   - Fix any errors shown

4. **Test Connection**:
   - Visit `/api/xero/test-connection` (requires auth)
   - This shows detailed diagnostics

### Common Issues

**"No Xero tokens found"**
- Solution: Connect Xero via Settings page

**"Xero tenant ID not configured"**
- Solution: Set `XERO_TENANT_ID` env var or sync via Settings

**"Token expired"**
- Solution: Should auto-refresh. If not, reconnect via Settings

**"401 Unauthorized"**
- Solution: Token invalid. Reconnect via Settings page

## API Endpoints

### Setup & Status
- `GET/POST /api/xero/setup` - Initialize and check setup
- `GET /api/xero/token-status` - Check token status
- `GET /api/xero/test-connection` - Detailed diagnostics

### OAuth
- `GET /api/auth/xero/redirect` - Start OAuth flow
- `GET /api/auth/xero/callback` - OAuth callback (handled by Xero)

### Management
- `POST /api/xero/sync-tenant-ids` - Sync tenant IDs from env

## Environment Variables

Required:
```bash
XERO_CLIENT_ID=your_client_id
XERO_CLIENT_SECRET=your_client_secret
XERO_TENANT_ID=tenant_id_1,tenant_id_2
```

Optional (fallback):
```bash
XERO_ACCESS_TOKEN=your_access_token  # Only if not using OAuth
```

## Testing

1. **Test Company Search**:
   - Go to quote form
   - Type company name (at least 2 characters)
   - Should see autocomplete dropdown

2. **Test Token Refresh**:
   - Wait for token to expire (30 minutes)
   - Make a company search
   - Should automatically refresh and work

3. **Test Multiple Tenants**:
   - If you have multiple tenant IDs
   - Search should return companies from all tenants

## Support

If issues persist:
1. Check Vercel function logs
2. Review setup steps in Settings page
3. Test connection endpoint for diagnostics
4. Verify environment variables in Vercel dashboard

---

**Last Updated**: After deployment
**Status**: Ready for production use

