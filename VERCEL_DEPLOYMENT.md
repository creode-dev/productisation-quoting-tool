# Vercel Deployment Information

## ✅ Deployment Complete

Your application has been successfully deployed to Vercel!

## 🌐 URLs

### Production
- **URL**: https://productisation-njfp417ht-guy-westons-projects.vercel.app
- **Status**: ✅ Ready
- **Environment**: Production
- **Branch**: `main`

### Staging/Preview
- **URL**: https://productisation-nfym6zsdg-guy-westons-projects.vercel.app
- **Status**: ✅ Ready
- **Environment**: Preview
- **Branch**: `staging`

## 🔧 Environment Variables

All environment variables have been configured for all environments:

- **VITE_GOOGLE_SHEET_ID**: `1jIGuVrI6cPtY-zDLHwV3muej2zi4jjRAnNu8aODr27k`
  - ✅ Production
  - ✅ Preview
  - ✅ Development

## 📋 Next Steps

### 1. Make Project Public (Important!)

To allow third parties to view your application:

1. Go to https://vercel.com/dashboard
2. Select your project: `productisation`
3. Go to **Settings** → **General**
4. Scroll to **Visibility**
5. Change from "Private" to **"Public"**
6. Click **Save**

### 2. Set Up Custom Domain (Optional)

If you want a custom domain:

1. Go to **Settings** → **Domains**
2. Add your domain
3. Follow the DNS configuration instructions

### 3. Configure Git Integration (Optional)

The GitHub repository connection had an issue. To connect it:

1. Go to **Settings** → **Git**
2. Click **Connect Git Repository**
3. Select `creode-dev/productisation-quoting-tool`
4. This will enable automatic deployments on push

### 4. Staging Environment

The staging branch is set up and will automatically deploy preview builds:
- Push to `staging` branch → Creates preview deployment
- Push to `main` branch → Creates production deployment (if Git is connected)

## 🔄 Deployment Commands

### Deploy to Production
```bash
npx vercel --prod
```

### Deploy to Preview/Staging
```bash
npx vercel
```

### View Deployments
```bash
npx vercel ls
```

### View Logs
```bash
npx vercel inspect <deployment-url> --logs
```

## 📝 Notes

- The project is linked to Vercel account: `guy-westons-projects`
- Build command: `npm run build`
- Output directory: `dist`
- Framework: Vite (auto-detected)

## 🐛 Troubleshooting

If you encounter issues:

1. Check build logs: `npx vercel inspect <url> --logs`
2. Verify environment variables: `npx vercel env ls`
3. Check project settings in Vercel dashboard
4. Ensure Google Sheet is public and accessible

