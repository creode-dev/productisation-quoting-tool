#!/bin/bash
# Script to check OAuth 2.0 Client configuration using gcloud CLI

set -e

PROJECT_ID="creode-process"
CLIENT_ID="1067455774232-etur5mho6f0qbsr8aq5l1ehev4silrp5.apps.googleusercontent.com"

echo "🔍 Checking OAuth 2.0 Client Configuration"
echo "Project: $PROJECT_ID"
echo "Client ID: $CLIENT_ID"
echo ""

# Check if authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "❌ Not authenticated with gcloud"
    echo "Run: gcloud auth login"
    exit 1
fi

# Set project
gcloud config set project $PROJECT_ID > /dev/null 2>&1
echo "✅ Project set to: $PROJECT_ID"
echo ""

# Enable required APIs
echo "📡 Enabling required APIs..."
gcloud services enable iamcredentials.googleapis.com --project=$PROJECT_ID 2>/dev/null || true
gcloud services enable cloudresourcemanager.googleapis.com --project=$PROJECT_ID 2>/dev/null || true
echo ""

# Try to get OAuth client info using REST API
echo "🔍 Fetching OAuth client configuration..."
ACCESS_TOKEN=$(gcloud auth print-access-token 2>/dev/null)

if [ -z "$ACCESS_TOKEN" ]; then
    echo "❌ Could not get access token"
    exit 1
fi

# Use Google Cloud Console API to get OAuth client
RESPONSE=$(curl -s -H "Authorization: Bearer $ACCESS_TOKEN" \
    "https://iamcredentials.googleapis.com/v1/projects/$PROJECT_ID" 2>&1) || true

# Alternative: Check via OAuth consent screen
echo "📋 Checking OAuth consent screen..."
gcloud iap oauth-clients list --project=$PROJECT_ID 2>&1 || echo "Note: IAP API might not be available"

echo ""
echo "💡 To check OAuth client configuration manually:"
echo "   1. Go to: https://console.cloud.google.com/apis/credentials?project=$PROJECT_ID"
echo "   2. Find OAuth 2.0 Client ID: $CLIENT_ID"
echo "   3. Check 'Authorized JavaScript origins':"
echo "      - Should include: https://productisation.vercel.app"
echo "      - Should include: http://localhost:5174 (for local dev)"
echo "   4. Check 'Authorized redirect URIs':"
echo "      - Should include: https://productisation.vercel.app/api/auth/google"
echo ""



