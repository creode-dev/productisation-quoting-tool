#!/bin/bash
# Script to check OAuth 2.0 Client configuration using Google Cloud API

set -e

export PATH=/opt/homebrew/share/google-cloud-sdk/bin:"$PATH"

CLIENT_ID="1067455774232-etur5mho6f0qbsr8aq5l1ehev4silrp5.apps.googleusercontent.com"

echo "🔍 Checking OAuth 2.0 Client Configuration"
echo "Client ID: $CLIENT_ID"
echo ""

# Check if authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &> /dev/null; then
    echo "❌ Not authenticated with gcloud"
    echo ""
    echo "Please run:"
    echo "  gcloud auth login"
    echo ""
    echo "Then run this script again."
    exit 1
fi

ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -1)
echo "✅ Authenticated as: $ACCOUNT"
echo ""

# Get project ID
PROJECT_ID=$(gcloud config get-value project 2>/dev/null || echo "")
if [ -z "$PROJECT_ID" ]; then
    echo "⚠️  No project set"
    echo "Please set your project:"
    echo "  gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo "📍 Project: $PROJECT_ID"
echo ""

# Get access token
echo "🔑 Getting access token..."
ACCESS_TOKEN=$(gcloud auth print-access-token)

# Note: OAuth 2.0 clients are managed through Google Cloud Console API
# The API endpoint is: https://console.cloud.google.com/apis/api/iamcredentials.googleapis.com
# But OAuth client details are typically accessed through the Console UI

echo "📝 Note: OAuth 2.0 client configuration (authorized origins) is managed"
echo "   through the Google Cloud Console API, which requires specific permissions."
echo ""
echo "💡 To check the configuration:"
echo "   1. Go to: https://console.cloud.google.com/apis/credentials?project=$PROJECT_ID"
echo "   2. Click on your OAuth 2.0 Client ID"
echo "   3. Check 'Authorized JavaScript origins'"
echo ""
echo "🔍 Expected origin: http://localhost:5174"
echo "   (Must be exact match - no trailing slash, lowercase, http not https)"
echo ""

# Try to use the IAM API to check (though this might be for IAM OAuth clients, not Console OAuth clients)
echo "Attempting to check via API..."
echo ""

# The OAuth 2.0 clients created in Console are different from IAM OAuth clients
# For Console OAuth clients, we'd need to use a different API endpoint
echo "⚠️  OAuth 2.0 clients created in Google Cloud Console are managed"
echo "   through the Console UI, not directly via gcloud CLI commands."
echo ""
echo "✅ Best way to verify:"
echo "   1. Open: https://console.cloud.google.com/apis/credentials?project=$PROJECT_ID"
echo "   2. Find client: $CLIENT_ID"
echo "   3. Verify 'Authorized JavaScript origins' includes: http://localhost:5174"

