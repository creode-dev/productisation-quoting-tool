#!/bin/bash
# Comprehensive OAuth setup verification script

set -e

PROJECT_ID="creode-process"
CLIENT_ID="1067455774232-etur5mho6f0qbsr8aq5l1ehev4silrp5.apps.googleusercontent.com"
PRODUCTION_URL="https://productisation.vercel.app"

echo "🔍 OAuth Setup Verification"
echo "=========================="
echo ""

echo "📋 OAuth Client Configuration Check"
echo "-------------------------------------"
echo ""
echo "Client ID: $CLIENT_ID"
echo "Project: $PROJECT_ID"
echo ""
echo "✅ REQUIRED Configuration:"
echo ""
echo "Authorized JavaScript origins MUST include:"
echo "  • $PRODUCTION_URL"
echo "  • http://localhost:5174 (for local dev)"
echo ""
echo "Authorized redirect URIs MUST include:"
echo "  • $PRODUCTION_URL/api/auth/google"
echo ""
echo "🔧 To Verify/Update:"
echo "  1. Visit: https://console.cloud.google.com/apis/credentials?project=$PROJECT_ID"
echo "  2. Click on OAuth 2.0 Client ID: $CLIENT_ID"
echo "  3. Check 'Authorized JavaScript origins' section"
echo "  4. Check 'Authorized redirect URIs' section"
echo "  5. Add missing entries if needed"
echo "  6. Click 'Save'"
echo "  7. Wait 2-3 minutes for propagation"
echo ""

echo "🔍 Testing API Endpoints"
echo "----------------------"
echo ""
echo "Testing /api/auth/me..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://productisation.vercel.app/api/auth/me 2>&1)
if [ "$STATUS" = "500" ]; then
    echo "  ❌ Returns 500 - Function is crashing"
    echo "  💡 Check Vercel function logs for details"
elif [ "$STATUS" = "401" ]; then
    echo "  ✅ Returns 401 - Endpoint works (not authenticated)"
else
    echo "  Status: $STATUS"
fi
echo ""

echo "Testing /api/auth/google (POST)..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -d '{"credential":"test"}' \
  https://productisation.vercel.app/api/auth/google 2>&1)
if [ "$STATUS" = "500" ]; then
    echo "  ❌ Returns 500 - Function is crashing"
    echo "  💡 Most likely causes:"
    echo "     - JWT_SECRET issue"
    echo "     - Code error in handler"
    echo "     - Missing environment variable"
elif [ "$STATUS" = "400" ] || [ "$STATUS" = "401" ]; then
    echo "  ✅ Returns $STATUS - Endpoint works (expected error for test credential)"
else
    echo "  Status: $STATUS"
fi
echo ""

echo "📊 Environment Variables Status"
echo "-------------------------------"
vercel env ls 2>&1 | grep -E "(GOOGLE_CLIENT|JWT_SECRET|VITE_GOOGLE)" | head -10
echo ""

echo "💡 Next Steps:"
echo "  1. Verify OAuth client has production URL (see above)"
echo "  2. Check Vercel function logs: https://vercel.com/dashboard"
echo "  3. Regenerate JWT_SECRET if it's the default value"
echo "  4. Wait for OAuth changes to propagate (2-3 minutes)"
echo "  5. Test login again"
echo ""



