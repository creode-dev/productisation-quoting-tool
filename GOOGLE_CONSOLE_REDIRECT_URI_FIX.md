# Google Cloud Console - Redirect URI Configuration Fix

## The Error

"Invalid origin: URIs must not contain a path or end with '/'."

This error occurs when you try to add a URI with a path to the **Authorized JavaScript origins** field, or if there's a trailing slash.

## Correct Configuration

### Step 1: Open OAuth Client Settings

1. Go to: https://console.cloud.google.com/apis/credentials?project=creode-process
2. Find OAuth 2.0 Client ID: `1067455774232-etur5mho6f0qbsr8aq5l1ehev4silrp5`
3. Click the **Edit** icon (pencil)

### Step 2: Configure Authorized JavaScript origins

**This field is for DOMAINS ONLY (no paths, no trailing slash):**

```
https://productisation.vercel.app
```

**NOT:**
- ❌ `https://productisation.vercel.app/` (trailing slash)
- ❌ `https://productisation.vercel.app/api/auth/google/callback` (has path)
- ❌ `https://productisation.vercel.app:443` (port number)

**For server-side OAuth, you can actually REMOVE this field or leave it empty** - it's not required for server-side flow, only for client-side.

### Step 3: Configure Authorized redirect URIs

**This field CAN have paths:**

```
https://productisation.vercel.app/api/auth/google/callback
```

**Important:**
- ✅ Must start with `https://`
- ✅ Must include the full path: `/api/auth/google/callback`
- ✅ **NO trailing slash** at the end
- ✅ Lowercase

**Correct format:**
```
https://productisation.vercel.app/api/auth/google/callback
```

**Wrong formats:**
- ❌ `https://productisation.vercel.app/api/auth/google/callback/` (trailing slash)
- ❌ `http://productisation.vercel.app/api/auth/google/callback` (wrong protocol)
- ❌ `https://productisation.vercel.app` (missing path)

### Step 4: Save

1. Click **Save**
2. Wait 2-3 minutes for changes to propagate

## Field Summary

| Field | Format | Example | Path Allowed? |
|-------|--------|---------|---------------|
| **Authorized JavaScript origins** | Domain only | `https://productisation.vercel.app` | ❌ NO |
| **Authorized redirect URIs** | Full URL with path | `https://productisation.vercel.app/api/auth/google/callback` | ✅ YES |

## Quick Checklist

- [ ] **Authorized JavaScript origins**: `https://productisation.vercel.app` (no path, no trailing slash)
- [ ] **Authorized redirect URIs**: `https://productisation.vercel.app/api/auth/google/callback` (with path, no trailing slash)
- [ ] No trailing slashes anywhere
- [ ] All lowercase
- [ ] Using `https://` (not `http://`)
- [ ] Saved changes
- [ ] Waited 2-3 minutes

## Common Mistakes

1. **Adding redirect URI to JavaScript origins field**
   - JavaScript origins = domain only
   - Redirect URIs = full URL with path

2. **Trailing slash**
   - `https://productisation.vercel.app/` ❌
   - `https://productisation.vercel.app` ✅

3. **Missing path in redirect URI**
   - `https://productisation.vercel.app` ❌ (for redirect URI)
   - `https://productisation.vercel.app/api/auth/google/callback` ✅

## Verification

After saving, verify:

1. **Authorized JavaScript origins** shows:
   - `https://productisation.vercel.app` (if you want to keep it)

2. **Authorized redirect URIs** shows:
   - `https://productisation.vercel.app/api/auth/google/callback`

3. No trailing slashes
4. No duplicates
5. All using `https://`

