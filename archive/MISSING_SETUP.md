# Missing Setup Elements

## Current Status

The application requires Google OAuth authentication, but the `VITE_GOOGLE_CLIENT_ID` environment variable is not configured.

## Missing Configuration

### 1. Google OAuth Client ID (Required)

**Error**: `Google Client ID is not configured. Please set VITE_GOOGLE_CLIENT_ID.`

**What's Missing**: 
- `VITE_GOOGLE_CLIENT_ID` environment variable

**How to Fix**:

#### For Local Development:
1. Get your Google OAuth Client ID (see SETUP.md for detailed instructions)
2. Add to `.env` file:
   ```
   VITE_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
   ```
3. Restart the development server

#### For Vercel Deployment:
1. Get your Google OAuth Client ID (see SETUP.md for detailed instructions)
2. Add via Vercel CLI:
   ```bash
   npx vercel env add VITE_GOOGLE_CLIENT_ID production
   npx vercel env add VITE_GOOGLE_CLIENT_ID preview
   npx vercel env add VITE_GOOGLE_CLIENT_ID development
   ```
3. Or add via Vercel Dashboard:
   - Go to Project Settings → Environment Variables
   - Add `VITE_GOOGLE_CLIENT_ID` with your Client ID value
   - Select all environments (Production, Preview, Development)

## How to Get Google OAuth Client ID

See `SETUP.md` for complete instructions. Quick steps:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select a project
3. **Note**: No API needs to be enabled - Google OAuth 2.0 works with Google Identity Services by default
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure OAuth consent screen (if not already configured):
   - User Type: Internal (for creode.co.uk domain restriction)
   - App name: Your app name
   - Scopes: email, profile (added automatically)
6. Create OAuth 2.0 Client ID:
   - Application type: Web application
   - Authorized JavaScript origins: 
     - `http://localhost:5174` (for local development)
     - `https://your-domain.vercel.app` (for production)
   - Authorized redirect URIs: `https://your-domain.vercel.app/api/auth/google`
   - Copy the Client ID

## Currently Configured

✅ `VITE_GOOGLE_SHEET_ID` - Set to `1jIGuVrI6cPtY-zDLHwV3muej2zi4jjRAnNu8aODr27k`

## Additional Environment Variables (Optional)

These are mentioned in `SETUP.md` but may not be required for basic functionality:

- `GOOGLE_CLIENT_SECRET` - For backend authentication (if using API routes)
- `JWT_SECRET` - For JWT token signing (if using API routes)
- `DATABASE_URL` - For quote storage (if using database features)
- `XERO_ACCESS_TOKEN` - For Xero integration (if using company autocomplete)
- `XERO_TENANT_ID` - For Xero integration

## Next Steps

1. **Get Google OAuth Client ID** - Follow instructions in `SETUP.md`
2. **Add to `.env` file** - For local development
3. **Add to Vercel** - For production/staging deployments
4. **Restart dev server** - If running locally
5. **Redeploy** - If deploying to Vercel

## References

- `SETUP.md` - Complete setup guide with Google OAuth instructions
- `DEPLOYMENT.md` - Updated with `VITE_GOOGLE_CLIENT_ID` instructions

