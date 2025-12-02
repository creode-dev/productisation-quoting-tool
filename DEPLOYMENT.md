# Deployment Guide

## GitHub Repository
✅ Repository created: https://github.com/creode-dev/productisation-quoting-tool

## Vercel Deployment

### Step 1: Login to Vercel
```bash
npx vercel login
```

### Step 2: Link Project to Vercel
```bash
npx vercel link
```
- Choose your Vercel account/team
- Create a new project or link to existing
- Project name: `productisation-quoting-tool`

### Step 3: Set Environment Variables

#### Production Environment
```bash
# Google Sheet ID
npx vercel env add VITE_GOOGLE_SHEET_ID production
# Enter: 1jIGuVrI6cPtY-zDLHwV3muej2zi4jjRAnNu8aODr27k

# Google OAuth Client ID (for authentication)
npx vercel env add VITE_GOOGLE_CLIENT_ID production
# Enter: Your Google OAuth Client ID (see SETUP.md for instructions)
```

#### Preview/Staging Environment
```bash
# Google Sheet ID
npx vercel env add VITE_GOOGLE_SHEET_ID preview
# Enter: 1jIGuVrI6cPtY-zDLHwV3muej2zi4jjRAnNu8aODr27k

# Google OAuth Client ID
npx vercel env add VITE_GOOGLE_CLIENT_ID preview
# Enter: Your Google OAuth Client ID
```

#### Development Environment
```bash
# Google Sheet ID
npx vercel env add VITE_GOOGLE_SHEET_ID development
# Enter: 1jIGuVrI6cPtY-zDLHwV3muej2zi4jjRAnNu8aODr27k

# Google OAuth Client ID
npx vercel env add VITE_GOOGLE_CLIENT_ID development
# Enter: Your Google OAuth Client ID
```

### Step 4: Deploy to Production
```bash
npx vercel --prod
```

### Step 5: Deploy to Staging
```bash
npx vercel
```

## Alternative: Deploy via Vercel Dashboard

1. Go to https://vercel.com
2. Click "Add New Project"
3. Import the GitHub repository: `creode-dev/productisation-quoting-tool`
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add Environment Variables:
   - **Name**: `VITE_GOOGLE_SHEET_ID`
     - **Value**: `1jIGuVrI6cPtY-zDLHwV3muej2zi4jjRAnNu8aODr27k`
     - Add to: Production, Preview, and Development
   - **Name**: `VITE_GOOGLE_CLIENT_ID`
     - **Value**: Your Google OAuth Client ID (see SETUP.md for instructions)
     - Add to: Production, Preview, and Development
6. Click "Deploy"

## Setting Up Staging Environment

1. In Vercel Dashboard, go to Project Settings
2. Go to "Git" section
3. Under "Production Branch", set to `main`
4. Create a new branch called `staging`:
   ```bash
   git checkout -b staging
   git push origin staging
   ```
5. In Vercel, go to Settings > Git
6. Under "Production Branch", you can configure:
   - **Production**: `main` branch
   - **Preview**: All other branches (including `staging`)

## Making Project Public

1. In Vercel Dashboard, go to Project Settings
2. Go to "General" section
3. Under "Visibility", change to "Public"
4. This allows third parties to view the deployed application

## Environment URLs

After deployment, you'll get:
- **Production**: `https://productisation-quoting-tool.vercel.app` (or your custom domain)
- **Staging/Preview**: `https://productisation-quoting-tool-git-staging.vercel.app` (or similar)

## Notes

- The `.env` file is gitignored and should not be committed
- Environment variables are set in Vercel dashboard or via CLI
- Each environment (production, preview, development) can have different values
- The Google Sheet must be publicly accessible for the tool to work
- **Important**: For Google OAuth, you don't need to enable any specific API. Google Identity Services works by default with OAuth 2.0 credentials.

