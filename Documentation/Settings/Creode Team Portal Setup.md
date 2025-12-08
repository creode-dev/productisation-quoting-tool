# Creode Team Portal Setup

This guide will walk you through setting up the Creode Team Portal feature, including Google service account configuration and environment variables.

## Prerequisites

1. Google Cloud Console access
2. Vercel account with database initialized
3. Google Calendar and Google Drive access

## Step 1: Set Up Google Service Account

The Creode Team Portal requires a Google Service Account to access Google Calendar and Google Drive APIs.

### 1.1 Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click **"New Project"**
4. Enter a project name (e.g., "Creode Team Portal")
5. Click **"Create"**
6. Wait for the project to be created and select it

### 1.2 Enable Required APIs

1. In the Google Cloud Console, go to **"APIs & Services"** > **"Library"**
2. Search for and enable the following APIs:
   - **Google Calendar API**
   - **Google Drive API**

### 1.3 Create a Service Account

1. Go to **"APIs & Services"** > **"Credentials"**
2. Click **"Create Credentials"** > **"Service Account"**
3. Fill in the details:
   - **Service account name**: `creode-team-portal-service`
   - **Service account ID**: (auto-generated, you can change it)
   - **Description**: `Service account for Creode Team Portal Calendar and Drive access`
4. Click **"Create and Continue"**
5. Skip the optional steps (Grant access, Grant users access) and click **"Done"**

### 1.4 Create and Download Service Account Key

1. In the **"Credentials"** page, find your newly created service account
2. Click on the service account email
3. Go to the **"Keys"** tab
4. Click **"Add Key"** > **"Create new key"**
5. Select **"JSON"** format
6. Click **"Create"**
7. A JSON file will be downloaded - **SAVE THIS FILE SECURELY** (you'll need it for environment variables)

The JSON file will look like this:
```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "creode-team-portal-service@your-project-id.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

### 1.5 Set Up Google Calendar

1. **Create a Central Company Calendar:**
   - Go to [Google Calendar](https://calendar.google.com/)
   - Click the **"+"** next to "Other calendars" on the left
   - Select **"Create new calendar"**
   - Name it (e.g., "Company Holidays")
   - Click **"Create calendar"**
   - Go to **"Settings and sharing"** for this calendar
   - Under **"Share with specific people"**, add your service account email (from step 1.4)
   - Give it **"Make changes to events"** permission
   - Copy the **Calendar ID** (found in "Integrate calendar" section, it looks like: `abc123@group.calendar.google.com`)

2. **Share Individual Employee Calendars:**
   - For each employee, they need to share their Google Calendar with the service account
   - Employee goes to their Google Calendar settings
   - Under "Share with specific people", add the service account email
   - Give it **"Make changes to events"** permission

### 1.6 Set Up Google Drive

1. **Create a Root Folder for Employee Documents:**
   - Go to [Google Drive](https://drive.google.com/)
   - Create a new folder (e.g., "Employee Documents")
   - Right-click the folder > **"Share"**
   - Add your service account email (from step 1.4)
   - Give it **"Editor"** permission
   - Click **"Done"**
   - Right-click the folder > **"Get link"** > **"Copy link"**
   - The folder ID is in the URL: `https://drive.google.com/drive/folders/FOLDER_ID_HERE`
   - Copy the `FOLDER_ID_HERE` part

## Step 2: Configure Environment Variables

You need to set the following environment variables. The method depends on where you're running the application.

### 2.1 Required Environment Variables

| Variable Name | Description | Example |
|--------------|-------------|---------|
| `GOOGLE_CALENDAR_ID` | The Calendar ID of your central company calendar | `abc123@group.calendar.google.com` |
| `GOOGLE_DRIVE_FOLDER_ID` | The folder ID where employee documents will be stored | `1a2b3c4d5e6f7g8h9i0j` |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | The service account email from the JSON key | `creode-team-portal-service@project-id.iam.gserviceaccount.com` |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | The private key from the JSON file (see formatting below) | `-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n` |

### 2.2 Formatting the Service Account Key

The `GOOGLE_SERVICE_ACCOUNT_KEY` needs special formatting. From the JSON file you downloaded:

1. Find the `"private_key"` field
2. Copy the entire value including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
3. Replace all `\n` with actual newlines OR keep them as `\n` (the code handles both)

**Important:** The private key must be on a single line with `\n` characters, or properly formatted with actual newlines.

### 2.3 Setting Environment Variables

#### For Local Development (.env file)

1. Create a `.env` file in the project root (if it doesn't exist)
2. Add the following:

```bash
# Google Calendar & Drive Configuration
GOOGLE_CALENDAR_ID=abc123@group.calendar.google.com
GOOGLE_DRIVE_FOLDER_ID=1a2b3c4d5e6f7g8h9i0j
GOOGLE_SERVICE_ACCOUNT_EMAIL=creode-team-portal-service@your-project-id.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```

**Note:** Make sure to:
- Wrap the private key in quotes
- Keep the `\n` characters (they represent newlines)
- Replace the example values with your actual values

3. Restart your development server after adding these variables

#### For Vercel Deployment (Production)

**Using Vercel CLI:**

```bash
# Install Vercel CLI if not already installed
npm install -g vercel

# Login to Vercel
vercel login

# Link your project (if not already linked)
vercel link

# Add environment variables
vercel env add GOOGLE_CALENDAR_ID production
# Paste your calendar ID when prompted

vercel env add GOOGLE_DRIVE_FOLDER_ID production
# Paste your folder ID when prompted

vercel env add GOOGLE_SERVICE_ACCOUNT_EMAIL production
# Paste your service account email when prompted

vercel env add GOOGLE_SERVICE_ACCOUNT_KEY production
# Paste your private key when prompted (you can paste the entire multi-line key)
```

**Using Vercel Dashboard:**

1. Go to your project on [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on **"Settings"** > **"Environment Variables"**
3. Add each variable:
   - Click **"Add New"**
   - Enter the variable name
   - Enter the value
   - Select environments (Production, Preview, Development)
   - Click **"Save"**
4. Repeat for all 4 variables

**Important for Vercel:**
- For `GOOGLE_SERVICE_ACCOUNT_KEY`, you can paste the entire private key including newlines
- Vercel will handle the formatting automatically
- After adding variables, you may need to redeploy your application

## Step 3: Test the Setup

Once everything is configured:

1. **Start your development server:**
   ```bash
   npm run dev:vercel
   # or
   npx vercel dev
   ```

2. **Test Creode Team Portal:**
   - Navigate to `/portal` in your application
   - Try creating an employee profile
   - Try uploading a document
   - Try creating a holiday request

3. **Check for Errors:**
   - Check the browser console for any errors
   - Check server logs for API errors
   - Common issues:
     - Missing environment variables
     - Incorrect calendar/folder IDs
     - Service account permissions not set correctly

## Troubleshooting

### Google Calendar API Errors
- **Error:** "Google Calendar credentials not configured"
- **Solution:**
  - Verify `GOOGLE_SERVICE_ACCOUNT_EMAIL` and `GOOGLE_SERVICE_ACCOUNT_KEY` are set
  - Check that the service account has access to the calendar
  - Verify the Calendar API is enabled in Google Cloud Console

### Google Drive API Errors
- **Error:** "Google Drive credentials not configured"
- **Solution:**
  - Verify `GOOGLE_SERVICE_ACCOUNT_EMAIL` and `GOOGLE_SERVICE_ACCOUNT_KEY` are set
  - Check that the service account has Editor access to the root folder
  - Verify the Drive API is enabled in Google Cloud Console

### Calendar Event Creation Fails
- **Error:** "Error creating calendar event"
- **Solution:**
  - Verify `GOOGLE_CALENDAR_ID` is correct
  - Check that the service account has "Make changes to events" permission on the calendar
  - For employee calendars, ensure employees have shared their calendar with the service account

### Document Upload Fails
- **Error:** "Error uploading document"
- **Solution:**
  - Verify `GOOGLE_DRIVE_FOLDER_ID` is correct
  - Check that the service account has Editor access to the folder
  - Verify file size is under 10MB (current limit)

## Security Notes

1. **Never commit the service account JSON file or private key to version control**
2. **Keep your `.env` file in `.gitignore`**
3. **Rotate service account keys periodically**
4. **Use the principle of least privilege** - only grant necessary permissions
5. **Monitor API usage in Google Cloud Console**

## Next Steps

After setup is complete:

1. Create teams in the Creode Team Portal admin interface (`/portal/teams`)
2. Add employees and assign them to teams (`/portal/employees`)
3. Set up approvers for holiday requests
4. Test the full holiday request workflow
5. Train employees on using the portal




