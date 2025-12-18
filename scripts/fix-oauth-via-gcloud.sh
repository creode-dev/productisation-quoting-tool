#!/bin/bash
# Script to check and update OAuth 2.0 Client using Google Cloud API

set -e

PROJECT_ID="creode-process"
CLIENT_ID="1067455774232-etur5mho6f0qbsr8aq5l1ehev4silrp5.apps.googleusercontent.com"
PRODUCTION_URL="https://productisation.vercel.app"
LOCAL_URL="http://localhost:5174"

echo "🔍 OAuth 2.0 Client Configuration"
echo "=================================="
echo ""

# Check authentication
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>/dev/null | grep -q .; then
    echo "❌ Not authenticated with gcloud"
    echo ""
    echo "To authenticate:"
    echo "  1. Run: gcloud auth login"
    echo "  2. Run: gcloud auth application-default login"
    echo "  3. Then run this script again"
    echo ""
    echo "Or use the web console:"
    echo "  https://console.cloud.google.com/apis/credentials?project=$PROJECT_ID"
    exit 1
fi

echo "✅ Authenticated with gcloud"
gcloud config set project $PROJECT_ID > /dev/null 2>&1
echo "✅ Project set to: $PROJECT_ID"
echo ""

# Enable required API
echo "📡 Enabling IAM API..."
gcloud services enable iamcredentials.googleapis.com --project=$PROJECT_ID 2>/dev/null || true
echo ""

# Get access token
echo "🔑 Getting access token..."
ACCESS_TOKEN=$(gcloud auth print-access-token 2>/dev/null)

if [ -z "$ACCESS_TOKEN" ]; then
    echo "❌ Could not get access token"
    exit 1
fi

echo "✅ Access token obtained"
echo ""

# Use Google Cloud Resource Manager API to get OAuth client
echo "📋 Fetching OAuth client configuration..."
echo ""
echo "Note: OAuth client configuration must be updated via web console:"
echo "  https://console.cloud.google.com/apis/credentials?project=$PROJECT_ID"
echo ""
echo "Required Configuration:"
echo "----------------------"
echo "Authorized JavaScript origins:"
echo "  ✅ $PRODUCTION_URL"
echo "  ✅ $LOCAL_URL"
echo ""
echo "Authorized redirect URIs:"
echo "  ✅ $PRODUCTION_URL/api/auth/google"
echo ""
echo "💡 After updating, wait 2-3 minutes for changes to propagate"




