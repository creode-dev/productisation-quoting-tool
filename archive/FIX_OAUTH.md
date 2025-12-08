# Fix OAuth Configuration

## Issue
Google OAuth is showing: "The given origin is not allowed for the given client ID"

## Solution

You need to add `http://localhost:5174` to your Google OAuth Client ID's authorized origins.

### Steps:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** > **Credentials**
3. Find your OAuth 2.0 Client ID (the one ending in `.apps.googleusercontent.com`)
4. Click on it to edit
5. Under **Authorized JavaScript origins**, add:
   - `http://localhost:5174`
6. Click **Save**

### Your Current Client ID
Based on your `.env` file:
```
1067455774232-etur5mho6f0qbsr8aq5l1ehev4silrp5.apps.googleusercontent.com
```

After adding the origin, refresh your browser and try logging in again.




