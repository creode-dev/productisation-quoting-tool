import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCurrentUser } from '../lib/auth.js';
import { getXeroTokens, getValidXeroAccessToken } from '../lib/xeroTokens.js';

// Helper to get tenant IDs (same logic as xero.ts)
async function getTenantIdsHelper(): Promise<string[]> {
  const tokens = await getXeroTokens();
  if (tokens?.tenant_ids && tokens.tenant_ids.length > 0) {
    return tokens.tenant_ids;
  }
  const XERO_TENANT_ID = process.env.XERO_TENANT_ID?.trim();
  if (XERO_TENANT_ID) {
    return XERO_TENANT_ID.split(',').map(id => id.trim()).filter(id => id.length > 0);
  }
  return [];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      user: user.email,
    };

    // Check tokens
    const tokens = await getXeroTokens();
    diagnostics.tokens = {
      exists: !!tokens,
      hasAccessToken: !!tokens?.access_token,
      hasRefreshToken: !!tokens?.refresh_token,
      expiresAt: tokens?.expires_at,
      tenantIds: tokens?.tenant_ids || [],
    };

    // Check tenant IDs
    const tenantIds = await getTenantIdsHelper();
    diagnostics.tenantIds = {
      fromDatabase: tokens?.tenant_ids || [],
      fromEnv: process.env.XERO_TENANT_ID?.split(',').map(id => id.trim()).filter(id => id.length > 0) || [],
      final: tenantIds,
      count: tenantIds.length,
    };

    // Try to get a valid token
    try {
      const token = await getValidXeroAccessToken();
      diagnostics.tokenValidation = {
        success: true,
        tokenLength: token.length,
        tokenPreview: token.substring(0, 20) + '...',
      };

      // Test API call with first tenant
      if (tenantIds.length > 0) {
        const testQuery = 'test';
        const testResponse = await fetch(
          `https://api.xero.com/api.xro/2.0/Contacts?where=Name.Contains("${encodeURIComponent(testQuery)}")&order=Name&page=1`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Xero-tenant-id': tenantIds[0],
              'Accept': 'application/json',
            },
          }
        );

        diagnostics.apiTest = {
          status: testResponse.status,
          statusText: testResponse.statusText,
          ok: testResponse.ok,
        };

        if (testResponse.ok) {
          const testData = await testResponse.json();
          diagnostics.apiTest.response = {
            totalContacts: testData.Contacts?.length || 0,
            hasContacts: !!testData.Contacts,
            sampleContact: testData.Contacts?.[0] ? {
              name: testData.Contacts[0].Name,
              isCustomer: testData.Contacts[0].IsCustomer,
              isSupplier: testData.Contacts[0].IsSupplier,
            } : null,
          };
        } else {
          const errorText = await testResponse.text();
          diagnostics.apiTest.error = errorText;
        }
      }
    } catch (tokenError: any) {
      diagnostics.tokenValidation = {
        success: false,
        error: tokenError.message,
      };
    }

    return res.status(200).json(diagnostics);
  } catch (error: any) {
    console.error('Error in test connection:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to test connection',
      diagnostics: {
        timestamp: new Date().toISOString(),
      }
    });
  }
}

