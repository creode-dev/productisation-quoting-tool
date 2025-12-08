# Complete OAuth 2.0 Settings Guide

## Overview

For a **client-side web application** using `@react-oauth/google`, here are ALL the required OAuth settings:

## ✅ Required Settings

### 1. OAuth 2.0 Client ID Configuration

**Location:** Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client ID

#### Required Fields:

**a) Authorized JavaScript origins**
- ✅ **REQUIRED** for client-side apps
- Must include: `https://productisation.vercel.app`
- Must be EXACT (no trailing slash, lowercase, https)

**b) Authorized redirect URIs**
- ✅ **REQUIRED** if you're using redirect flow
- For your setup: `https://productisation.vercel.app/api/auth/google`
- Note: With `@react-oauth/google`, this might not be strictly needed, but it's good to have

**c) Application type**
- ✅ Must be set to: **"Web application"**

### 2. OAuth Consent Screen

**Location:** Google Cloud Console → APIs & Services → OAuth consent screen

#### Required Configuration:

**a) User Type**
- ✅ Set to: **"Internal"** (for creode.co.uk domain restriction)
- OR **"External"** if you need public access

**b) App Information**
- ✅ **App name**: Your application name (e.g., "Quoting Tool")
- ✅ **User support email**: Your email
- ✅ **Developer contact information**: Your email

**c) Scopes**
- ✅ **Required scopes**:
  - `openid` (for authentication)
  - `email` (to get user email)
  - `profile` (to get user name/picture)
- These are typically added automatically

**d) Authorized domains**
- ✅ Add: `vercel.app` (or your custom domain)
- This verifies you own the domain

**e) Test users** (if using "External" user type)
- Add test users during development
- Not needed for "Internal" apps

### 3. Client Secret

**❌ NOT REQUIRED for client-side apps**

- Client secrets are **ONLY** for server-side OAuth flows
- Since you're using `@react-oauth/google` (client-side), you **DO NOT need a client secret**
- The Client ID is public and safe to expose in frontend code

## 📋 Complete Checklist

### OAuth 2.0 Client ID Settings:
- [ ] Application type: **Web application**
- [ ] Authorized JavaScript origins: `https://productisation.vercel.app`
- [ ] Authorized redirect URIs: `https://productisation.vercel.app/api/auth/google`
- [ ] Client ID is set in `VITE_GOOGLE_CLIENT_ID` environment variable

### OAuth Consent Screen:
- [ ] User type: **Internal** (for creode.co.uk restriction)
- [ ] App name: Set
- [ ] User support email: Set
- [ ] Developer contact: Set
- [ ] Scopes: `openid`, `email`, `profile` (should be auto-added)
- [ ] Authorized domains: `vercel.app` added

### Environment Variables:
- [ ] `VITE_GOOGLE_CLIENT_ID` set in Vercel (Production, Preview, Development)

## 🔍 How to Verify All Settings

### Step 1: Check OAuth Client ID
1. Go to: https://console.cloud.google.com/apis/credentials?project=creode-process
2. Click on your OAuth 2.0 Client ID
3. Verify:
   - Type: **Web application**
   - Authorized JavaScript origins: `https://productisation.vercel.app`
   - Authorized redirect URIs: `https://productisation.vercel.app/api/auth/google`

### Step 2: Check OAuth Consent Screen
1. Go to: https://console.cloud.google.com/apis/credentials/consent?project=creode-process
2. Verify:
   - Publishing status: **Published** (or "Testing" for development)
   - User type: **Internal**
   - App name: Set
   - Scopes: `openid`, `email`, `profile` are listed
   - Authorized domains: `vercel.app` is listed

### Step 3: Check Environment Variables
```bash
vercel env ls | grep VITE_GOOGLE_CLIENT_ID
```

## 🚫 Common Misconceptions

### ❌ "I need a Client Secret"
- **FALSE** for client-side apps
- Client secrets are only for server-side OAuth flows
- Your Client ID is public and safe in frontend code

### ❌ "I only need JavaScript origins"
- **FALSE** - You also need:
  - OAuth Consent Screen configured
  - Proper scopes
  - Authorized domains

### ❌ "Redirect URIs are optional"
- **PARTIALLY TRUE** - With `@react-oauth/google`, the library handles the flow
- But it's still good practice to set it
- Some OAuth flows require it

## 🎯 Your Specific Setup

Based on your code, you're using:
- **Library**: `@react-oauth/google` (client-side)
- **Flow**: Implicit grant flow (no server-side token exchange)
- **Scopes**: `openid`, `email`, `profile` (default for GoogleLogin)

### What You Need:
1. ✅ OAuth Client ID with JavaScript origins
2. ✅ OAuth Consent Screen configured
3. ✅ Client ID in environment variable
4. ❌ **NO Client Secret needed**

## 🔧 If Origin Mismatch Persists

Even with all settings correct, origin mismatch can occur if:

1. **Browser cache** - Clear cache and cookies
2. **Multiple origins** - Check for duplicates or variations
3. **Domain verification** - Ensure `vercel.app` is in authorized domains
4. **Propagation delay** - Wait 2-3 minutes after changes

## 📚 References

- [Google OAuth 2.0 for Client-side Web Apps](https://developers.google.com/identity/protocols/oauth2/javascript-implicit-flow)
- [OAuth Consent Screen](https://console.cloud.google.com/apis/credentials/consent)
- [@react-oauth/google Documentation](https://www.npmjs.com/package/@react-oauth/google)

