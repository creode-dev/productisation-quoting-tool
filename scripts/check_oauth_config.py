#!/usr/bin/env python3
"""
Check OAuth 2.0 Client configuration using Google Cloud Console API
"""

import subprocess
import sys
import json

CLIENT_ID = "1067455774232-etur5mho6f0qbsr8aq5l1ehev4silrp5.apps.googleusercontent.com"

def get_access_token():
    """Get access token from gcloud"""
    try:
        result = subprocess.run(
            ['gcloud', 'auth', 'print-access-token'],
            capture_output=True,
            text=True,
            check=True
        )
        return result.stdout.strip()
    except subprocess.CalledProcessError:
        return None

def get_project_id():
    """Get current gcloud project"""
    try:
        result = subprocess.run(
            ['gcloud', 'config', 'get-value', 'project'],
            capture_output=True,
            text=True,
            check=True
        )
        return result.stdout.strip()
    except subprocess.CalledProcessError:
        return None

def main():
    print("🔍 Checking OAuth 2.0 Client Configuration\n")
    print(f"Client ID: {CLIENT_ID}\n")
    
    # Check authentication
    access_token = get_access_token()
    if not access_token:
        print("❌ Not authenticated with gcloud")
        print("\nPlease run:")
        print("  gcloud auth login")
        print("  gcloud auth application-default login")
        sys.exit(1)
    
    print("✅ Authenticated with gcloud")
    
    project_id = get_project_id()
    if not project_id:
        print("\n⚠️  No project set")
        print("Please run: gcloud config set project YOUR_PROJECT_ID")
        sys.exit(1)
    
    print(f"📍 Project: {project_id}\n")
    
    print("📝 Note: OAuth 2.0 clients created in Google Cloud Console")
    print("   are managed through the Console UI, not directly via API.")
    print("   The authorized JavaScript origins are stored in the Console.")
    print()
    print("💡 To verify the configuration:")
    print(f"   1. Go to: https://console.cloud.google.com/apis/credentials?project={project_id}")
    print(f"   2. Click on OAuth 2.0 Client ID: {CLIENT_ID}")
    print("   3. Check 'Authorized JavaScript origins' section")
    print()
    print("🔍 Expected origin: http://localhost:5174")
    print("   Requirements:")
    print("   - No trailing slash")
    print("   - Lowercase")
    print("   - http (not https)")
    print("   - Exact match required")
    print()
    print("⚠️  If the origin is correct but still getting errors:")
    print("   - Wait 2-5 minutes for changes to propagate")
    print("   - Clear browser cache")
    print("   - Try incognito/private window")
    print("   - Check for typos (localhost vs 127.0.0.1)")

if __name__ == '__main__':
    main()




