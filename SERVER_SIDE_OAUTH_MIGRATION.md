# Server-Side OAuth Flow Migration Guide

## Overview

You can switch from client-side OAuth (using `@react-oauth/google`) to server-side OAuth (authorization code flow). This would eliminate the origin mismatch issue since the OAuth flow happens entirely on the server.

## Current Setup (Client-Side)

**Flow:**
1. User clicks "Sign in" → `@react-oauth/google` opens Google popup
2. Google authenticates → Returns ID token to frontend
3. Frontend sends ID token to `/api/auth/google`
4. Backend verifies token → Creates JWT session

**Issues:**
- Requires "Authorized JavaScript origins" (origin mismatch errors)
- Client ID exposed in frontend code

## Server-Side OAuth Flow

**Flow:**
1. User clicks "Sign in" → Redirects to `/api/auth/google/redirect`
2. Backend redirects to Google OAuth with authorization code request
3. Google redirects back to `/api/auth/google/callback` with code
4. Backend exchanges code for tokens (using Client Secret)
5. Backend creates JWT session → Redirects user to app

**Benefits:**
- ✅ No "Authorized JavaScript origins" needed (only redirect URIs)
- ✅ Client Secret stays on server (more secure)
- ✅ No origin mismatch issues
- ✅ Better for production apps

**Drawbacks:**
- ❌ More complex implementation
- ❌ Requires Client Secret in environment variables
- ❌ Full page redirects (no popup)
- ❌ More code to maintain

## Implementation Steps

### Step 1: Update Google Cloud Console

1. **Get Client Secret:**
   - Go to: https://console.cloud.google.com/apis/credentials?project=creode-process
   - Find your OAuth Client ID
   - Copy the **Client Secret** (you'll need this)

2. **Update Redirect URIs:**
   - Keep: `https://productisation.vercel.app/api/auth/google/callback`
   - Remove JavaScript origins requirement (or keep for other purposes)

### Step 2: Add Environment Variables

```bash
# Add to Vercel
vercel env add GOOGLE_CLIENT_ID production
# Enter your Client ID

vercel env add GOOGLE_CLIENT_SECRET production
# Enter your Client Secret (keep this secret!)

# Remove frontend Client ID (or keep for other features)
# vercel env rm VITE_GOOGLE_CLIENT_ID production
```

### Step 3: Create Server-Side Auth Endpoints

#### `/api/auth/google/redirect.ts` - Initiate OAuth

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const REDIRECT_URI = `${process.env.VERCEL_URL || 'https://productisation.vercel.app'}/api/auth/google/callback`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!GOOGLE_CLIENT_ID) {
    return res.status(500).json({ error: 'GOOGLE_CLIENT_ID not configured' });
  }

  // Generate state for CSRF protection
  const state = Buffer.from(Math.random().toString()).toString('base64');
  
  // Store state in cookie (you might want to use a session store)
  res.setHeader('Set-Cookie', `oauth-state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`);

  // Build OAuth URL
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile',
    state: state,
    access_type: 'offline',
    prompt: 'consent',
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  
  // Redirect to Google
  res.redirect(302, authUrl);
}
```

#### `/api/auth/google/callback.ts` - Handle OAuth Callback

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateToken, getAuthCookie } from '../../lib/auth';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = `${process.env.VERCEL_URL || 'https://productisation.vercel.app'}/api/auth/google/callback`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code, state, error } = req.query;

    // Check for errors from Google
    if (error) {
      return res.redirect(302, `/login?error=${encodeURIComponent(error as string)}`);
    }

    if (!code) {
      return res.redirect(302, '/login?error=no_code');
    }

    // Verify state (CSRF protection)
    const cookies = req.headers.cookie || '';
    const stateCookie = cookies.split('oauth-state=')[1]?.split(';')[0];
    if (state !== stateCookie) {
      return res.redirect(302, '/login?error=invalid_state');
    }

    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code: code as string,
        client_id: GOOGLE_CLIENT_ID!,
        client_secret: GOOGLE_CLIENT_SECRET!,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.json();
      console.error('Token exchange error:', error);
      return res.redirect(302, '/login?error=token_exchange_failed');
    }

    const tokens = await tokenResponse.json();
    const { id_token } = tokens;

    // Verify ID token and get user info
    const userInfoResponse = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${id_token}`
    );

    if (!userInfoResponse.ok) {
      return res.redirect(302, '/login?error=invalid_token');
    }

    const googleUser = await userInfoResponse.json();

    // Verify email domain restriction
    if (!googleUser.email || !googleUser.email.endsWith('@creode.co.uk')) {
      return res.redirect(302, '/login?error=domain_restricted');
    }

    // Generate JWT token
    const user = {
      email: googleUser.email,
      name: googleUser.name,
      picture: googleUser.picture,
    };

    const token = generateToken(user);

    // Set httpOnly cookie and clear OAuth state
    res.setHeader('Set-Cookie', [
      getAuthCookie(token),
      'oauth-state=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0',
    ]);

    // Redirect to app
    res.redirect(302, '/');
  } catch (error: any) {
    console.error('OAuth callback error:', error);
    res.redirect(302, `/login?error=${encodeURIComponent(error.message || 'unknown_error')}`);
  }
}
```

### Step 4: Update Frontend

#### Remove `@react-oauth/google` dependency (optional)

```bash
npm uninstall @react-oauth/google
```

#### Update `src/main.tsx`

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
// Remove: import { GoogleOAuthProvider } from '@react-oauth/google'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* Remove GoogleOAuthProvider wrapper */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
```

#### Update `src/components/LoginPage.tsx`

```typescript
import { useNavigate } from 'react-router-dom';

export function LoginPage() {
  const navigate = useNavigate();

  const handleLogin = () => {
    // Simply redirect to server-side OAuth endpoint
    window.location.href = '/api/auth/google/redirect';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Quoting Tool
          </h1>
          <p className="text-gray-600 mb-8">
            Sign in with your creode.co.uk email address
          </p>
        </div>
        <div className="flex justify-center">
          <button
            onClick={handleLogin}
            className="flex items-center gap-3 px-6 py-3 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="text-gray-700 font-medium">Sign in with Google</span>
          </button>
        </div>
        <p className="text-xs text-gray-500 text-center mt-4">
          Access is restricted to creode.co.uk email addresses
        </p>
      </div>
    </div>
  );
}
```

### Step 5: Update `src/contexts/AuthContext.tsx`

Remove the `login` function that takes a credential, since login now happens via redirect:

```typescript
// Remove the login function that takes credential
// The login now happens via redirect to /api/auth/google/redirect
```

## Comparison

| Feature | Client-Side (Current) | Server-Side (Proposed) |
|---------|----------------------|------------------------|
| **Origin Requirements** | ✅ JavaScript origins required | ❌ Only redirect URIs |
| **Client Secret** | ❌ Not needed | ✅ Required (server-side only) |
| **User Experience** | Popup window | Full page redirect |
| **Security** | Client ID exposed | Client Secret hidden |
| **Complexity** | Simple | More complex |
| **Origin Mismatch** | Can occur | Won't occur |

## Recommendation

**Stick with client-side IF:**
- You can fix the origin mismatch issue
- You prefer popup-based login
- You want simpler code

**Switch to server-side IF:**
- Origin mismatch keeps happening
- You want better security (Client Secret on server)
- You don't mind full page redirects
- You want a more production-ready approach

## Migration Checklist

- [ ] Get Client Secret from Google Cloud Console
- [ ] Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to Vercel env vars
- [ ] Create `/api/auth/google/redirect.ts`
- [ ] Create `/api/auth/google/callback.ts`
- [ ] Update `LoginPage.tsx` to redirect instead of using `@react-oauth/google`
- [ ] Remove `GoogleOAuthProvider` from `main.tsx`
- [ ] Optionally remove `@react-oauth/google` package
- [ ] Test the flow end-to-end
- [ ] Update redirect URI in Google Cloud Console

## Testing

1. Visit `/login`
2. Click "Sign in with Google"
3. Should redirect to Google OAuth
4. After authentication, should redirect back to app
5. Should be logged in with JWT cookie set

