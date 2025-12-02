# Authentication Setup

This guide explains how to configure Google OAuth authentication for the application.

## Prerequisites

1. Google Cloud Console access
2. A Google account with access to create OAuth credentials

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
   - Copy the Client Secret (you'll need this for `GOOGLE_CLIENT_SECRET`)

## Environment Variables

Add the following environment variables:

### Backend
- `GOOGLE_CLIENT_ID` - Your Google OAuth 2.0 Client ID
- `GOOGLE_CLIENT_SECRET` - Your Google OAuth 2.0 Client Secret
- `JWT_SECRET` - A random secret string for JWT token signing (generate with `openssl rand -base64 32`)

### Frontend
- `VITE_GOOGLE_CLIENT_ID` - Same as GOOGLE_CLIENT_ID (for frontend OAuth)

## Testing

1. Visit your deployed app
2. You should be redirected to `/login`
3. Sign in with a `@creode.co.uk` email address
4. You should be authenticated and redirected to the main application

## Troubleshooting

### Authentication Issues
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set correctly
- Check that the redirect URI matches your domain
- Ensure the email domain restriction is working (only `@creode.co.uk` emails)
- Verify authorized JavaScript origins include your domain

