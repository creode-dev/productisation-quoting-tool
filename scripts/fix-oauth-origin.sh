#!/bin/bash
# Script to help diagnose and fix OAuth origin issues

set -e

CLIENT_ID="1067455774232-etur5mho6f0qbsr8aq5l1ehev4silrp5.apps.googleusercontent.com"
PROJECT_ID="creode-process"

echo "🔍 OAuth Origin Diagnostic Tool"
echo "================================"
echo ""
echo "Client ID: $CLIENT_ID"
echo "Project: $PROJECT_ID"
echo ""

echo "📋 Current Authorized JavaScript Origins (from Console):"
echo "   - https://productisation.vercel.app"
echo "   - https://process.creode.co.uk"
echo "   - http://localhost:5174"
echo ""

echo "⚠️  Common Issues:"
echo "   1. Accessing via 127.0.0.1 instead of localhost"
echo "   2. Accessing via a deployed URL not in the list"
echo "   3. Protocol mismatch (http vs https)"
echo "   4. Trailing slash in URL"
echo ""

echo "🔧 Solution: Add missing origins to Google Console"
echo ""
echo "You need to add the following origin if accessing via 127.0.0.1:"
echo "   http://127.0.0.1:5174"
echo ""

echo "📝 Steps to fix:"
echo "   1. Go to: https://console.cloud.google.com/apis/credentials?project=$PROJECT_ID"
echo "   2. Click on OAuth 2.0 Client ID: $CLIENT_ID"
echo "   3. Under 'Authorized JavaScript origins', click '+ ADD URI'"
echo "   4. Add: http://127.0.0.1:5174"
echo "   5. Click 'SAVE'"
echo "   6. Wait 1-5 minutes for changes to propagate"
echo ""

echo "💡 Alternative: Access your app via http://localhost:5174 (not 127.0.0.1)"
echo ""

echo "🌐 To check what origin you're currently using:"
echo "   Open browser console and check window.location.origin"
echo ""


