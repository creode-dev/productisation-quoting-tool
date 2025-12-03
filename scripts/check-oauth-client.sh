#!/bin/bash
# Script to check and update OAuth 2.0 Client configuration using gcloud

set -e

PROJECT_ID="creode-process"
CLIENT_ID="1067455774232-etur5mho6f0qbsr8aq5l1ehev4silrp5.apps.googleusercontent.com"
PRODUCTION_URL="https://productisation.vercel.app"
LOCAL_URL="http://localhost:5174"

echo "🔍 OAuth 2.0 Client Configuration Check"
echo "========================================"
echo ""
echo "Project: $PROJECT_ID"
echo "Client ID: $CLIENT_ID"
echo ""

echo "📋 To check/update OAuth client configuration:"
echo ""
echo "1. Go to Google Cloud Console:"
echo "   https://console.cloud.google.com/apis/credentials?project=$PROJECT_ID"
echo ""
echo "2. Find OAuth 2.0 Client ID: $CLIENT_ID"
echo ""
echo "3. Verify 'Authorized JavaScript origins' includes:"
echo "   ✅ $PRODUCTION_URL"
echo "   ✅ $LOCAL_URL"
echo ""
echo "4. Verify 'Authorized redirect URIs' includes:"
echo "   ✅ $PRODUCTION_URL/api/auth/google"
echo ""
echo "5. If missing, click 'Edit' and add:"
echo "   - Origin: $PRODUCTION_URL"
echo "   - Redirect URI: $PRODUCTION_URL/api/auth/google"
echo ""
echo "💡 Note: Changes may take a few minutes to propagate"
echo ""

# Try to use gcloud if authenticated
if gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>/dev/null | grep -q .; then
    echo "✅ gcloud is authenticated"
    gcloud config set project $PROJECT_ID > /dev/null 2>&1
    echo ""
    echo "📡 Checking OAuth consent screen..."
    gcloud iap oauth-clients describe $CLIENT_ID --project=$PROJECT_ID 2>&1 || echo "Note: Cannot retrieve via CLI, use web console"
else
    echo "ℹ️  gcloud not authenticated - using web console method"
    echo ""
    echo "To authenticate and check via CLI:"
    echo "  1. gcloud auth login"
    echo "  2. gcloud config set project $PROJECT_ID"
    echo "  3. Run this script again"
fi

echo ""
echo "🔧 Quick Fix Commands:"
echo "---------------------"
echo ""
echo "If you need to update via web console:"
echo "  1. Visit: https://console.cloud.google.com/apis/credentials?project=$PROJECT_ID"
echo "  2. Click on the OAuth 2.0 Client ID"
echo "  3. Add missing origins/URIs"
echo "  4. Save changes"
echo ""

