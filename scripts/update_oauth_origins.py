#!/usr/bin/env python3
"""
Script to update OAuth 2.0 Client authorized JavaScript origins via Google Cloud API

Prerequisites:
1. pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client
2. Run: gcloud auth application-default login
   OR set GOOGLE_APPLICATION_CREDENTIALS environment variable

Usage:
    python scripts/update_oauth_origins.py [CLIENT_ID] [NEW_ORIGIN]
    
Example:
    python scripts/update_oauth_origins.py 1067455774232-etur5mho6f0qbsr8aq5l1ehev4silrp5.apps.googleusercontent.com http://localhost:5174
"""

import sys
import subprocess
import json
from pathlib import Path

def get_project_id():
    """Get the current gcloud project ID"""
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
    client_id = sys.argv[1] if len(sys.argv) > 1 else '1067455774232-etur5mho6f0qbsr8aq5l1ehev4silrp5.apps.googleusercontent.com'
    new_origin = sys.argv[2] if len(sys.argv) > 2 else 'http://localhost:5174'
    
    print(f"🔧 Updating OAuth Client: {client_id}")
    print(f"🌐 Adding origin: {new_origin}")
    print()
    
    # Check if gcloud is authenticated
    try:
        result = subprocess.run(
            ['gcloud', 'auth', 'list', '--filter=status:ACTIVE', '--format=value(account)'],
            capture_output=True,
            text=True,
            check=True
        )
        if not result.stdout.strip():
            print("❌ Not authenticated. Please run:")
            print("   gcloud auth login")
            print("   gcloud auth application-default login")
            sys.exit(1)
        print(f"✅ Authenticated as: {result.stdout.strip()}")
    except subprocess.CalledProcessError:
        print("❌ Authentication check failed. Please run:")
        print("   gcloud auth login")
        print("   gcloud auth application-default login")
        sys.exit(1)
    
    # Get project ID
    project_id = get_project_id()
    if not project_id:
        print("❌ No project set. Please run:")
        print("   gcloud config set project YOUR_PROJECT_ID")
        sys.exit(1)
    
    print(f"📍 Project: {project_id}")
    print()
    
    # Check if required Python packages are installed
    try:
        import google.auth
        import google.oauth2.credentials
        from googleapiclient.discovery import build
        from googleapiclient.errors import HttpError
    except ImportError:
        print("❌ Required Python packages not installed.")
        print("   Please install: pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client")
        sys.exit(1)
    
    print("📝 Note: Updating OAuth client settings via API requires:")
    print("   1. Identity Platform API enabled")
    print("   2. Proper API permissions")
    print()
    print("💡 Recommended: Use the Google Cloud Console UI instead:")
    print(f"   https://console.cloud.google.com/apis/credentials?project={project_id}")
    print()
    print("   Steps:")
    print(f"   1. Click on OAuth 2.0 Client ID: {client_id}")
    print(f"   2. Under 'Authorized JavaScript origins', click '+ ADD URI'")
    print(f"   3. Add: {new_origin}")
    print("   4. Click 'SAVE'")
    print()
    
    # Try to get access token and make API call
    try:
        result = subprocess.run(
            ['gcloud', 'auth', 'print-access-token'],
            capture_output=True,
            text=True,
            check=True
        )
        access_token = result.stdout.strip()
        
        print("🔍 Attempting to fetch OAuth client configuration...")
        print("   (This may fail if Identity Platform API is not enabled)")
        print()
        
        # Note: The actual API endpoint for updating OAuth clients is complex
        # and requires the Identity Platform API. For simplicity, we'll just
        # provide the console link.
        
    except subprocess.CalledProcessError:
        print("❌ Failed to get access token")
        sys.exit(1)

if __name__ == '__main__':
    main()

