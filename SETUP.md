# Setup Guide

This guide will help you set up the Google Authentication and Quotes Management system.

## Prerequisites

1. Vercel account
2. Google Cloud Console access
3. Xero API credentials
4. Vercel Postgres database

## Environment Variables

Add the following environment variables in your Vercel project settings:

### Authentication
- `GOOGLE_CLIENT_ID` - Your Google OAuth 2.0 Client ID
- `GOOGLE_CLIENT_SECRET` - Your Google OAuth 2.0 Client Secret
- `JWT_SECRET` - A random secret string for JWT token signing (generate with `openssl rand -base64 32`)

### Database
- `DATABASE_URL` - Vercel Postgres connection string (automatically provided when you create a Postgres database)

### Xero API
- `XERO_ACCESS_TOKEN` - Your Xero API access token (recommended)
- OR
- `XERO_CLIENT_ID` - Xero OAuth Client ID
- `XERO_CLIENT_SECRET` - Xero OAuth Client Secret
- `XERO_TENANT_ID` - Xero Tenant ID

### Frontend
- `VITE_GOOGLE_CLIENT_ID` - Same as GOOGLE_CLIENT_ID (for frontend OAuth)

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. **Note**: No API needs to be enabled. Google OAuth 2.0 works with Google Identity Services by default.
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure OAuth consent screen (if not already configured):
   - User Type: Internal (for creode.co.uk domain restriction)
   - App name: Your app name
   - User support email: Your email
   - Developer contact: Your email
   - Scopes: email, profile (these are added automatically)
6. Create OAuth 2.0 Client ID:
   - Application type: Web application
   - Name: Your app name
   - Authorized JavaScript origins: 
     - `http://localhost:5174` (for local development)
     - `https://your-domain.vercel.app` (for production)
   - Authorized redirect URIs: 
     - `https://your-domain.vercel.app/api/auth/google` (for production)
   - Copy the Client ID (you'll need this for `VITE_GOOGLE_CLIENT_ID`)
   - Copy the Client Secret (you'll need this for `GOOGLE_CLIENT_SECRET` if using backend auth)

## Xero API Setup

### Step 1: Create a Xero App

1. Go to [Xero Developer Portal](https://developer.xero.com/)
2. Sign in with your Xero account (or create one if you don't have one)
3. Navigate to "My Apps" section
4. Click "New App" to create a new application
5. Fill in the required details:
   - **App name**: Your application name
   - **Integration type**: Choose "Web app" or "Private" depending on your needs
   - **Redirect URI**: 
     - For local development: `http://localhost:5174/api/auth/xero` (or your local port)
     - For production: `https://your-domain.vercel.app/api/auth/xero`
6. After creating the app, you'll see:
   - **Client ID** - Copy this (you'll need it for `XERO_CLIENT_ID`)
   - **Client Secret** - Copy this (you'll need it for `XERO_CLIENT_SECRET`)

### Step 2: Get Access Token and Tenant ID

You have three options:

#### Option 1: Using Automated Script (Easiest) ⭐

1. **Configure Redirect URI in Xero App**:
   - Go to your Xero app settings in the [Developer Portal](https://developer.xero.com/myapps)
   - Add `http://localhost:3000/callback` to your Redirect URIs
   - Save the changes

2. **Run the automated script**:
   ```bash
   npm run get-xero-tenant
   ```
   
   Or directly:
   ```bash
   node scripts/get-xero-tenant-id.mjs
   ```

3. **Follow the prompts**:
   - The script will open your browser automatically
   - Authorize the app in Xero
   - The script will automatically:
     - Exchange the authorization code for an access token
     - Fetch your tenant ID
     - Display the values you need to add to your `.env.local` file

4. **Alternative: If you already have an access token**:
   ```bash
   node scripts/get-xero-tenant-id.mjs YOUR_ACCESS_TOKEN
   ```
   This will directly fetch the tenant ID without going through the OAuth flow.

#### Option 2: Using OAuth Flow (Manual)

1. **Authorize your app**:
   - In your Xero app settings, click "Generate a secret" if you haven't already
   - You'll need to complete the OAuth 2.0 flow to get an access token
   - Visit the authorization URL (you can use Xero's OAuth playground or implement the flow):
     ```
     https://login.xero.com/identity/connect/authorize?response_type=code&client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&scope=accounting.contacts.read offline_access
     ```
   - Grant permissions to your app
   - You'll receive an authorization code in the redirect

2. **Exchange code for tokens**:
   - Exchange the authorization code for an access token and refresh token
   - You can use Xero's OAuth playground: https://developer.xero.com/myapps/oauth-playground
   - Or make a POST request to `https://identity.xero.com/connect/token` with:
     - `grant_type=authorization_code`
     - `code=YOUR_AUTHORIZATION_CODE`
     - `redirect_uri=YOUR_REDIRECT_URI`
     - `client_id=YOUR_CLIENT_ID`
     - `client_secret=YOUR_CLIENT_SECRET`

3. **Get Tenant ID**:
   - Once you have an access token, make a GET request to:
     ```
     https://api.xero.com/connections
     ```
   - Include the header: `Authorization: Bearer YOUR_ACCESS_TOKEN`
   - The response will contain an array of tenants, each with a `tenantId` field
   - Copy the `tenantId` for the organization you want to use

4. **Set environment variables**:
   - `XERO_CLIENT_ID` - Your Client ID from Step 1
   - `XERO_CLIENT_SECRET` - Your Client Secret from Step 1
   - `XERO_TENANT_ID` - The tenant ID from Step 3
   - `XERO_ACCESS_TOKEN` - The access token from Step 2 (optional if implementing refresh flow)

#### Option 3: Using Access Token Directly (Simpler, but tokens expire)

1. Follow Step 1 above to create your app and get Client ID/Secret
2. Use Xero's OAuth playground (https://developer.xero.com/myapps/oauth-playground) to:
   - Authorize your app
   - Get an access token
   - Get your tenant ID from the connections endpoint
3. Set environment variables:
   - `XERO_ACCESS_TOKEN` - The access token (note: expires after ~30 minutes)
   - `XERO_TENANT_ID` - The tenant ID

**Important Notes**:
- Access tokens expire after 30 minutes. For production, implement token refresh using the refresh token.
- Always include the `offline_access` scope to get a refresh token.
- The redirect URI in your app settings must match exactly with what you use in the OAuth flow.

## Database Setup

1. In Vercel Dashboard, go to your project
2. Navigate to "Storage" → "Create Database" → "Postgres"
3. Create a new Postgres database
4. The `DATABASE_URL` will be automatically added to your environment variables

### Initialize Database Schema

After deploying, call the initialization endpoint once:

```bash
curl https://your-domain.vercel.app/api/init-db
```

Or visit the URL in your browser. This will create the `quotes` table with the required schema.

## Deployment

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Vercel will automatically detect the Vite framework
4. Add all environment variables in Vercel project settings
5. Deploy

## Testing

1. Visit your deployed app
2. You should be redirected to `/login`
3. Sign in with a `@creode.co.uk` email address
4. You should be able to:
   - Create quotes with company/project information
   - View all quotes
   - Accept/delete quotes
   - Search for companies using Xero autocomplete

## Troubleshooting

### Authentication Issues
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set correctly
- Check that the redirect URI matches your domain
- Ensure the email domain restriction is working (only `@creode.co.uk` emails)

### Database Issues
- Verify `DATABASE_URL` is set correctly
- Run the `/api/init-db` endpoint to create tables
- Check Vercel Postgres connection in dashboard

### Xero API Issues
- Verify `XERO_ACCESS_TOKEN` or OAuth credentials are set
- Check that the token has permissions to read contacts
- Ensure `XERO_TENANT_ID` is set if using access token

## Notes

- The quote acceptance workflow is a placeholder (TBC) - you can extend `/api/quotes/[id]/accept.ts` to trigger your workflow
- Additional quote fields can be added to the form in `QuoteForm.tsx`
- All quotes are visible to all authenticated users (no per-user filtering)

