#!/bin/bash

# Deployment script for Vercel
# This script helps set up and deploy to Vercel

echo "🚀 Vercel Deployment Setup"
echo ""

# Check if vercel is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

echo "🔐 Step 1: Login to Vercel"
echo "Please login to Vercel when prompted..."
npx vercel login

echo ""
echo "🔗 Step 2: Linking project to Vercel"
npx vercel link

echo ""
echo "📝 Step 3: Setting environment variables"
echo "Setting VITE_GOOGLE_SHEET_ID for all environments..."
echo "1jIGuVrI6cPtY-zDLHwV3muej2zi4jjRAnNu8aODr27k" | npx vercel env add VITE_GOOGLE_SHEET_ID production
echo "1jIGuVrI6cPtY-zDLHwV3muej2zi4jjRAnNu8aODr27k" | npx vercel env add VITE_GOOGLE_SHEET_ID preview
echo "1jIGuVrI6cPtY-zDLHwV3muej2zi4jjRAnNu8aODr27k" | npx vercel env add VITE_GOOGLE_SHEET_ID development

echo ""
echo "🌐 Step 4: Deploying to Production"
npx vercel --prod

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Go to Vercel Dashboard: https://vercel.com/dashboard"
echo "2. Find your project: productisation-quoting-tool"
echo "3. Go to Settings > General > Visibility"
echo "4. Change visibility to 'Public' to allow third-party access"
echo ""
echo "To deploy to staging, create a 'staging' branch and push:"
echo "  git checkout -b staging"
echo "  git push origin staging"
echo "  npx vercel"

