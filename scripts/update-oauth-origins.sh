#!/bin/bash
# Script to update OAuth 2.0 Client authorized JavaScript origins via Google Cloud API
# 
# Prerequisites:
# 1. Run: gcloud auth login
# 2. Run: gcloud config set project YOUR_PROJECT_ID
# 3. Enable Identity Platform API: gcloud services enable identitytoolkit.googleapis.com

set -e

export PATH=/opt/homebrew/share/google-cloud-sdk/bin:"$PATH"

# Configuration
CLIENT_ID="${1:-1067455774232-etur5mho6f0qbsr8aq5l1ehev4silrp5.apps.googleusercontent.com}"
NEW_ORIGIN="${2:-http://localhost:5174}"
PROJECT_ID=$(gcloud config get-value project 2>/dev/null || echo "")

if [ -z "$PROJECT_ID" ]; then
    echo "❌ Error: No project set. Run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo "🔧 Updating OAuth Client: $CLIENT_ID"
echo "📍 Project: $PROJECT_ID"
echo "🌐 Adding origin: $NEW_ORIGIN"
echo ""

# Get access token
ACCESS_TOKEN=$(gcloud auth print-access-token)

# Get current OAuth client configuration
echo "📥 Fetching current OAuth client configuration..."
CURRENT_CONFIG=$(curl -s -X GET \
  "https://apikeys.googleapis.com/v2/projects/$PROJECT_ID/oauthClients/$CLIENT_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" 2>/dev/null || echo "")

if [ -z "$CURRENT_CONFIG" ] || echo "$CURRENT_CONFIG" | grep -q "error"; then
    echo "⚠️  Note: OAuth client API might not be available via this endpoint."
    echo ""
    echo "📝 Alternative: Use the Google Cloud Console UI:"
    echo "   1. Go to: https://console.cloud.google.com/apis/credentials"
    echo "   2. Click on your OAuth 2.0 Client ID: $CLIENT_ID"
    echo "   3. Add '$NEW_ORIGIN' to 'Authorized JavaScript origins'"
    echo "   4. Click 'SAVE'"
    echo ""
    echo "Or use the Identity Platform API directly with a service account."
    exit 1
fi

echo "✅ Current configuration retrieved"
echo ""
echo "📋 Current authorized origins:"
echo "$CURRENT_CONFIG" | grep -o '"allowedOrigins":\[[^]]*\]' || echo "  (none found)"

echo ""
echo "💡 To update via API, you'll need to:"
echo "   1. Enable Identity Platform API: gcloud services enable identitytoolkit.googleapis.com"
echo "   2. Use the Identity Platform REST API to update the client"
echo ""
echo "📝 For now, the easiest way is via the Console UI:"
echo "   https://console.cloud.google.com/apis/credentials?project=$PROJECT_ID"




