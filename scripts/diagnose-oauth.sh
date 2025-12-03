#!/bin/bash
# Comprehensive OAuth and API diagnostic script

set -e

echo "🔍 Diagnosing OAuth and API Issues"
echo "=================================="
echo ""

# Check Vercel environment variables
echo "1️⃣ Checking Vercel Environment Variables..."
echo "-------------------------------------------"
vercel env ls 2>&1 | grep -E "(GOOGLE|JWT)" || echo "Could not fetch env vars"
echo ""

# Check OAuth Client ID
echo "2️⃣ OAuth Client ID Configuration"
echo "----------------------------------"
CLIENT_ID=$(vercel env get VITE_GOOGLE_CLIENT_ID production 2>&1 | grep -v "Retrieving" | head -1 || echo "NOT_SET")
echo "VITE_GOOGLE_CLIENT_ID: ${CLIENT_ID:0:50}..."
echo ""

# Check JWT_SECRET
echo "3️⃣ JWT_SECRET Status"
echo "-------------------"
JWT_SECRET=$(vercel env get JWT_SECRET production 2>&1 | grep -v "Retrieving" | head -1 || echo "NOT_SET")
if [ "$JWT_SECRET" = "NOT_SET" ] || [ -z "$JWT_SECRET" ]; then
    echo "❌ JWT_SECRET is NOT set or empty"
    echo "   This will cause authentication to fail!"
else
    echo "✅ JWT_SECRET is set (length: ${#JWT_SECRET} chars)"
fi
echo ""

# Test API endpoints
echo "4️⃣ Testing API Endpoints"
echo "------------------------"
echo "Testing /api/auth/me..."
curl -s -o /dev/null -w "Status: %{http_code}\n" https://productisation.vercel.app/api/auth/me || echo "Failed"
echo ""

echo "Testing /api/auth/google (POST)..."
curl -s -o /dev/null -w "Status: %{http_code}\n" -X POST \
  -H "Content-Type: application/json" \
  -d '{"credential":"test"}' \
  https://productisation.vercel.app/api/auth/google || echo "Failed"
echo ""

# OAuth Client Configuration Instructions
echo "5️⃣ OAuth Client Configuration Check"
echo "-----------------------------------"
echo "Client ID: 1067455774232-etur5mho6f0qbsr8aq5l1ehev4silrp5.apps.googleusercontent.com"
echo ""
echo "📋 Manual Check Required:"
echo "   1. Go to: https://console.cloud.google.com/apis/credentials?project=creode-process"
echo "   2. Find OAuth 2.0 Client ID: 1067455774232-etur5mho6f0qbsr8aq5l1ehev4silrp5"
echo "   3. Verify 'Authorized JavaScript origins' includes:"
echo "      ✅ https://productisation.vercel.app"
echo "      ✅ http://localhost:5174"
echo "   4. Verify 'Authorized redirect URIs' includes:"
echo "      ✅ https://productisation.vercel.app/api/auth/google"
echo ""

# Check latest deployment
echo "6️⃣ Latest Deployment Status"
echo "---------------------------"
vercel ls 2>&1 | head -3
echo ""

echo "✅ Diagnostic complete!"
echo ""
echo "🔧 Next Steps:"
echo "   1. Verify JWT_SECRET is set in Vercel Production"
echo "   2. Check OAuth client authorized origins (see above)"
echo "   3. Check Vercel function logs for detailed errors"
echo "   4. Initialize database: https://productisation.vercel.app/api/init-db"

