# Long-Term Plan: Google OAuth Login Implementation

## Overview

Implement Google OAuth 2.0 authentication to secure the application and restrict access to authorized users with `@creode.co.uk` email addresses.

## Status

**Status:** Not Started  
**Priority:** Medium  
**Estimated Complexity:** Medium  
**Dependencies:** None

## Requirements

### Functional Requirements

1. **Authentication Flow**
   - Users must sign in with Google OAuth
   - Only users with `@creode.co.uk` email addresses can access the application
   - Session management via JWT tokens stored in HttpOnly cookies
   - Automatic session refresh
   - Secure logout functionality

2. **User Experience**
   - Redirect to login page if not authenticated
   - Show user profile information (name, email, picture) when logged in
   - Clear error messages for authentication failures
   - Loading states during authentication

3. **Security**
   - CSRF protection using state parameter
   - Secure cookie settings (HttpOnly, Secure, SameSite)
   - JWT token expiration (7 days)
   - Domain restriction enforcement

## Technical Implementation

### Server-Side OAuth Flow (Recommended)

**Flow:**
1. User clicks "Sign in" → Redirects to `/api/auth/google/redirect`
2. Backend redirects to Google OAuth with authorization code request
3. Google redirects back to `/api/auth/google/callback` with code
4. Backend exchanges code for tokens (using Client Secret)
5. Backend verifies email domain (`@creode.co.uk`)
6. Backend creates JWT session → Redirects user to app

**Benefits:**
- ✅ No "Authorized JavaScript origins" needed (only redirect URIs)
- ✅ Client Secret stays on server (more secure)
- ✅ No origin mismatch issues
- ✅ Better for production apps

### API Endpoints Required

1. **`GET /api/auth/google/redirect`**
   - Generates CSRF state token
   - Redirects user to Google OAuth
   - Stores state in secure cookie

2. **`GET /api/auth/google/callback`**
   - Verifies CSRF state
   - Exchanges authorization code for tokens
   - Verifies user email domain
   - Creates JWT session
   - Redirects user to app

3. **`GET /api/auth/me`**
   - Returns current authenticated user
   - Returns 401 if not authenticated

4. **`POST /api/auth/logout`**
   - Clears authentication cookie
   - Returns success response

### Frontend Components

1. **`LoginPage.tsx`**
   - Display "Sign in with Google" button
   - Handle OAuth redirect
   - Show error messages from query params
   - Display domain restriction notice

2. **`ProtectedRoute.tsx`**
   - Check authentication status
   - Redirect to login if not authenticated
   - Show loading state during auth check

3. **`AuthContext.tsx`**
   - Manage authentication state
   - Provide `login()`, `logout()`, `refreshUser()` functions
   - Expose `user`, `isAuthenticated`, `loading` state

### Environment Variables

**Backend:**
- `GOOGLE_CLIENT_ID` - Google OAuth 2.0 Client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth 2.0 Client Secret
- `JWT_SECRET` - Random secret for JWT token signing (min 32 characters)

**Frontend:**
- None required (server-side flow)

### Google Cloud Console Configuration

1. **OAuth 2.0 Client ID**
   - Application type: Web application
   - Authorized redirect URIs:
     - `https://productisation.vercel.app/api/auth/google/callback`
     - (Add staging/preview URLs if needed)
   - Copy Client ID and Client Secret

2. **OAuth Consent Screen**
   - User Type: Internal (for domain restriction)
   - App name: Quoting Tool
   - Scopes: `openid`, `email`, `profile`
   - Authorized domains: `vercel.app`

## Implementation Steps

1. **Setup Google Cloud Console**
   - Create OAuth 2.0 Client ID
   - Configure OAuth Consent Screen
   - Note Client ID and Client Secret

2. **Add Environment Variables**
   - Add `GOOGLE_CLIENT_ID` to Vercel (production, preview, development)
   - Add `GOOGLE_CLIENT_SECRET` to Vercel (production, preview, development)
   - Ensure `JWT_SECRET` is set (regenerate if needed)

3. **Create API Endpoints**
   - Implement `/api/auth/google/redirect.ts`
   - Implement `/api/auth/google/callback.ts`
   - Update `/api/auth/me.ts` to use JWT verification
   - Ensure `/api/auth/logout.ts` clears cookies

4. **Update Frontend**
   - Update `LoginPage.tsx` to trigger OAuth redirect
   - Update `AuthContext.tsx` to remove client-side OAuth
   - Update `ProtectedRoute.tsx` to check authentication
   - Update `api.ts` to remove client-side login calls

5. **Testing**
   - Test login flow with valid `@creode.co.uk` email
   - Test domain restriction with non-creode email
   - Test logout functionality
   - Test session persistence
   - Test redirect after login
   - Test protected routes

## Files to Create/Modify

### New Files
- `api/auth/google/redirect.ts` - OAuth initiation endpoint
- `api/auth/google/callback.ts` - OAuth callback handler

### Modified Files
- `api/auth/me.ts` - JWT verification
- `api/auth/logout.ts` - Cookie clearing
- `api/lib/auth.ts` - JWT utilities (already exists)
- `src/components/LoginPage.tsx` - OAuth redirect button
- `src/contexts/AuthContext.tsx` - Remove client-side OAuth
- `src/components/ProtectedRoute.tsx` - Auth check
- `src/utils/api.ts` - Remove client-side login

### Files to Remove (if they exist)
- `api/auth/google.ts` - Old client-side OAuth endpoint
- Any client-side OAuth dependencies

## Testing Checklist

- [ ] Login with valid `@creode.co.uk` email works
- [ ] Login with non-creode email is rejected
- [ ] Session persists across page refreshes
- [ ] Logout clears session
- [ ] Protected routes redirect to login when not authenticated
- [ ] OAuth state CSRF protection works
- [ ] Error messages display correctly
- [ ] Works in production environment
- [ ] Works in staging/preview environments (if applicable)

## Notes

- Server-side OAuth flow is recommended over client-side for better security
- Always use production URL for OAuth redirects to avoid staging/preview URL mismatches
- JWT_SECRET must be at least 32 characters for security
- Consider implementing session refresh mechanism in the future
- Consider adding "Remember me" functionality if needed

## Related Documentation

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)
- [OAuth 2.0 Security Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)



