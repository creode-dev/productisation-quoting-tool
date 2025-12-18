#!/bin/bash
# Script to set up gcloud CLI for OAuth management

set -e

export PATH=/opt/homebrew/share/google-cloud-sdk/bin:"$PATH"

echo "🔧 Setting up Google Cloud CLI"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI not found. Installing..."
    brew install --cask google-cloud-sdk
    export PATH=/opt/homebrew/share/google-cloud-sdk/bin:"$PATH"
fi

echo "✅ gcloud CLI found: $(gcloud --version | head -1)"
echo ""

# Check authentication
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &> /dev/null; then
    echo "🔐 Authentication required"
    echo ""
    echo "Please run the following command in your terminal:"
    echo "  gcloud auth login"
    echo ""
    echo "This will open a browser for you to sign in with your Google account."
    echo ""
    read -p "Press Enter after you've completed authentication..."
fi

# Get current account
ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -1)
echo "✅ Authenticated as: $ACCOUNT"
echo ""

# List projects
echo "📋 Available projects:"
gcloud projects list --format="table(projectId,name)" || echo "  (no projects found)"
echo ""

# Get current project
CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null || echo "")
if [ -z "$CURRENT_PROJECT" ]; then
    echo "⚠️  No project selected"
    echo ""
    echo "Please set your project:"
    echo "  gcloud config set project YOUR_PROJECT_ID"
    echo ""
    echo "Or initialize gcloud:"
    echo "  gcloud init"
else
    echo "✅ Current project: $CURRENT_PROJECT"
fi

echo ""
echo "🎯 Next steps:"
echo "   1. Ensure your project is set: gcloud config set project YOUR_PROJECT_ID"
echo "   2. Update OAuth origins via Console UI (recommended):"
echo "      https://console.cloud.google.com/apis/credentials?project=$CURRENT_PROJECT"
echo ""
echo "   Or use the update script:"
echo "      ./scripts/update-oauth-origins.sh"





