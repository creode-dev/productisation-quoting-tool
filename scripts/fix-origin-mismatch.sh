#!/bin/bash
# Script to diagnose and fix OAuth origin mismatch error

set -e

PROJECT_ID="creode-process"
CLIENT_ID="1067455774232-etur5mho6f0qbsr8aq5l1ehev4silrp5.apps.googleusercontent.com"

echo "🔍 OAuth Origin Mismatch Diagnostic"
echo "===================================="
echo ""
echo "According to Google's documentation:"
echo "https://developers.google.com/identity/protocols/oauth2/javascript-implicit-flow#authorization-errors-origin-match"
echo ""
echo "The origin MUST match EXACTLY what's configured in Google Cloud Console."
echo ""

echo "📋 Required Configuration:"
echo "-------------------------"
echo ""
echo "1. Go to: https://console.cloud.google.com/apis/credentials?project=$PROJECT_ID"
echo "2. Click on OAuth 2.0 Client ID: $CLIENT_ID"
echo "3. Click 'Edit'"
echo ""
echo "4. In 'Authorized JavaScript origins', you MUST have EXACTLY:"
echo "   ✅ https://productisation.vercel.app"
echo "   (NO trailing slash, NO port, lowercase, https)"
echo ""
echo "5. Common mistakes to avoid:"
echo "   ❌ https://productisation.vercel.app/ (trailing slash)"
echo "   ❌ http://productisation.vercel.app (wrong protocol)"
echo "   ❌ https://productisation.vercel.app:443 (port number)"
echo "   ❌ HTTPS://PRODUCTISATION.VERCEL.APP (uppercase)"
echo ""
echo "6. Also verify 'Authorized redirect URIs' includes:"
echo "   ✅ https://productisation.vercel.app/api/auth/google"
echo ""
echo "7. Click 'Save'"
echo "8. Wait 2-3 minutes for changes to propagate"
echo ""

echo "🔍 Current Application Origin:"
echo "-------------------------------"
echo "The app is running at: https://productisation.vercel.app"
echo "This EXACT string must be in 'Authorized JavaScript origins'"
echo ""

echo "💡 Quick Fix Steps:"
echo "------------------"
echo "1. Open: https://console.cloud.google.com/apis/credentials?project=$PROJECT_ID"
echo "2. Find Client ID: $CLIENT_ID"
echo "3. Click Edit"
echo "4. Check 'Authorized JavaScript origins'"
echo "5. If 'https://productisation.vercel.app' is NOT there, add it"
echo "6. If it IS there, check for:"
echo "   - Trailing slash"
echo "   - Wrong protocol (http vs https)"
echo "   - Port numbers"
echo "   - Case sensitivity"
echo "7. Save and wait 2-3 minutes"
echo ""

echo "🧪 Test After Fix:"
echo "------------------"
echo "1. Wait 2-3 minutes after saving"
echo "2. Clear browser cache/cookies"
echo "3. Try login again: https://productisation.vercel.app/login"
echo ""




