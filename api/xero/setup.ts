import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCurrentUser } from '../../lib/auth';
import { sql, initXeroTokens } from '../../lib/db';
import { getXeroTokens } from '../../lib/xeroTokens';

/**
 * Setup endpoint to initialize Xero integration
 * This endpoint:
 * 1. Ensures xero_tokens table exists
 * 2. Syncs tenant IDs from environment variable
 * 3. Provides status and next steps
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    let user;
    try {
      user = getCurrentUser(req);
    } catch (error: any) {
      console.error('Auth error in setup:', error);
      return res.status(401).json({ error: 'Not authenticated', details: error.message });
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (req.method !== 'POST' && req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    const results: any = {
      timestamp: new Date().toISOString(),
      steps: [],
    };

    // Step 1: Ensure xero_tokens table exists
    try {
      await initXeroTokens();
      results.steps.push({
        step: 'Database table check',
        status: 'success',
        message: 'xero_tokens table exists or was created',
      });
    } catch (error: any) {
      console.error('Error initializing xero_tokens table:', error);
      results.steps.push({
        step: 'Database table check',
        status: 'error',
        message: error.message || 'Failed to create xero_tokens table',
        error: String(error),
      });
      // Don't return error, continue with other checks
    }

    // Step 2: Check environment variables
    const XERO_CLIENT_ID = process.env.XERO_CLIENT_ID?.trim();
    const XERO_CLIENT_SECRET = process.env.XERO_CLIENT_SECRET?.trim();
    const XERO_TENANT_ID = process.env.XERO_TENANT_ID?.trim();

    results.environment = {
      hasClientId: !!XERO_CLIENT_ID,
      hasClientSecret: !!XERO_CLIENT_SECRET,
      hasTenantId: !!XERO_TENANT_ID,
      tenantIds: XERO_TENANT_ID ? XERO_TENANT_ID.split(',').map(id => id.trim()) : [],
    };

    if (!XERO_CLIENT_ID || !XERO_CLIENT_SECRET) {
      results.steps.push({
        step: 'Environment variables',
        status: 'error',
        message: 'XERO_CLIENT_ID and XERO_CLIENT_SECRET must be set',
      });
      return res.status(400).json(results);
    }

    results.steps.push({
      step: 'Environment variables',
      status: 'success',
      message: 'All required environment variables are set',
    });

    // Step 3: Check if tokens exist
    let existingTokens = null;
    try {
      existingTokens = await getXeroTokens();
    } catch (error: any) {
      console.error('Error getting Xero tokens:', error);
      // If table doesn't exist yet, that's okay
      if (error.message?.includes('does not exist') || error.message?.includes('relation')) {
        results.steps.push({
          step: 'Check tokens',
          status: 'pending',
          message: 'xero_tokens table not initialized yet',
        });
      } else {
        results.steps.push({
          step: 'Check tokens',
          status: 'error',
          message: error.message || 'Failed to check tokens',
        });
      }
    }
    
    results.tokens = {
      exists: !!existingTokens,
      hasAccessToken: !!existingTokens?.access_token,
      hasRefreshToken: !!existingTokens?.refresh_token,
      tenantIds: existingTokens?.tenant_ids || [],
    };

    // Step 4: Sync tenant IDs if provided in env and tokens exist
    if (XERO_TENANT_ID && existingTokens) {
      const tenantIds = XERO_TENANT_ID.split(',').map(id => id.trim()).filter(id => id.length > 0);
      
      // Update tenant IDs in database
      try {
        await sql`
          UPDATE xero_tokens
          SET tenant_ids = ${tenantIds},
              updated_at = NOW()
          WHERE id IN (SELECT id FROM xero_tokens LIMIT 1)
        `;
        results.steps.push({
          step: 'Sync tenant IDs',
          status: 'success',
          message: `Synced ${tenantIds.length} tenant ID(s) from environment`,
        });
        results.tokens.tenantIds = tenantIds;
      } catch (error: any) {
        results.steps.push({
          step: 'Sync tenant IDs',
          status: 'error',
          message: error.message,
        });
      }
    } else if (XERO_TENANT_ID && !existingTokens) {
      results.steps.push({
        step: 'Sync tenant IDs',
        status: 'pending',
        message: 'Tenant IDs will be stored when you connect Xero',
      });
    }

    // Step 5: Determine next steps
    if (!existingTokens) {
      results.nextSteps = [
        'Visit /api/auth/xero/redirect to connect your Xero account',
        'Or use the Settings page at /settings/xero',
      ];
      results.status = 'not_connected';
    } else if (!existingTokens.refresh_token) {
      results.nextSteps = [
        'Tokens exist but no refresh token. Reconnect at /api/auth/xero/redirect',
      ];
      results.status = 'needs_reconnect';
    } else {
      results.nextSteps = [
        'Xero is connected and ready to use',
        'Company autocomplete should work in the quote form',
      ];
      results.status = 'ready';
    }

    return res.status(200).json(results);
  } catch (error: any) {
    console.error('Error in Xero setup:', error);
    console.error('Error stack:', error?.stack);
    console.error('Error name:', error?.name);
    console.error('Error message:', error?.message);
    return res.status(500).json({
      error: error?.message || 'Failed to setup Xero',
      details: String(error),
      name: error?.name,
      timestamp: new Date().toISOString(),
    });
  }
}

