#!/bin/bash

# Xero Integration Setup Script
# This script helps set up the Xero integration

set -e

echo "🔧 Xero Integration Setup"
echo "========================"
echo ""

# Get production domain
DOMAIN="${1:-agency.creode.dev}"

echo "Using domain: https://${DOMAIN}"
echo ""

# Step 1: Initialize database
echo "Step 1: Initializing database..."
RESPONSE=$(curl -s "https://${DOMAIN}/api/init-db")
if echo "$RESPONSE" | grep -q '"success":true'; then
  echo "✅ Database initialized successfully"
else
  echo "❌ Database initialization failed:"
  echo "$RESPONSE"
  exit 1
fi
echo ""

# Step 2: Run Xero setup
echo "Step 2: Running Xero setup check..."
SETUP_RESPONSE=$(curl -s -X POST "https://${DOMAIN}/api/xero/setup" \
  -H "Cookie: $(cat ~/.vercel/cookies 2>/dev/null || echo '')")
echo "$SETUP_RESPONSE" | jq '.' 2>/dev/null || echo "$SETUP_RESPONSE"
echo ""

# Step 3: Check token status
echo "Step 3: Checking token status..."
STATUS_RESPONSE=$(curl -s "https://${DOMAIN}/api/xero/token-status")
echo "$STATUS_RESPONSE" | jq '.' 2>/dev/null || echo "$STATUS_RESPONSE"
echo ""

echo "📋 Next Steps:"
echo "1. If not connected, visit: https://${DOMAIN}/settings/xero"
echo "2. Click 'Connect Xero Account' to authenticate"
echo "3. After connecting, click 'Run Setup' to sync tenant IDs"
echo "4. Test company autocomplete in the quote form"
echo ""

