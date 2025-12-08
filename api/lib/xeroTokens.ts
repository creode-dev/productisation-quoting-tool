import { sql } from './db';

const XERO_CLIENT_ID = process.env.XERO_CLIENT_ID?.trim();
const XERO_CLIENT_SECRET = process.env.XERO_CLIENT_SECRET?.trim();

export interface XeroTokenData {
  access_token: string;
  refresh_token: string;
  token_type?: string;
  expires_in: number;
  expires_at?: string;
  scope?: string;
  tenant_id?: string;
  tenant_ids?: string[];
}

/**
 * Store Xero tokens in database
 */
export async function storeXeroTokens(tokenData: XeroTokenData): Promise<void> {
  try {
    // Calculate expiration time
    const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));

    // Delete any existing tokens (we only keep one set)
    await sql`DELETE FROM xero_tokens`;

    // Insert new tokens
    await sql`
      INSERT INTO xero_tokens (
        access_token,
        refresh_token,
        token_type,
        expires_in,
        expires_at,
        scope,
        tenant_id,
        tenant_ids,
        created_at,
        updated_at
      ) VALUES (
        ${tokenData.access_token},
        ${tokenData.refresh_token},
        ${tokenData.token_type || 'Bearer'},
        ${tokenData.expires_in},
        ${expiresAt},
        ${tokenData.scope || null},
        ${tokenData.tenant_id || null},
        ${tokenData.tenant_ids || null},
        NOW(),
        NOW()
      )
    `;
  } catch (error) {
    console.error('Error storing Xero tokens:', error);
    throw error;
  }
}

/**
 * Get current Xero tokens from database
 */
export async function getXeroTokens(): Promise<XeroTokenData | null> {
  try {
    const result = await sql`
      SELECT 
        access_token,
        refresh_token,
        token_type,
        expires_in,
        expires_at,
        scope,
        tenant_id,
        tenant_ids
      FROM xero_tokens
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    
    return {
      access_token: row.access_token,
      refresh_token: row.refresh_token,
      token_type: row.token_type,
      expires_in: row.expires_in,
      expires_at: row.expires_at ? new Date(row.expires_at).toISOString() : undefined,
      scope: row.scope,
      tenant_id: row.tenant_id,
      tenant_ids: row.tenant_ids,
    };
  } catch (error) {
    console.error('Error getting Xero tokens:', error);
    return null;
  }
}

/**
 * Refresh Xero access token using refresh token
 */
export async function refreshXeroAccessToken(): Promise<string> {
  if (!XERO_CLIENT_ID || !XERO_CLIENT_SECRET) {
    throw new Error('Xero credentials not configured');
  }

  // Get current tokens
  const currentTokens = await getXeroTokens();
  if (!currentTokens || !currentTokens.refresh_token) {
    throw new Error('No refresh token available. Please re-authenticate with Xero.');
  }

  try {
    // Exchange refresh token for new access token
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: currentTokens.refresh_token,
      client_id: XERO_CLIENT_ID,
      client_secret: XERO_CLIENT_SECRET,
    });

    const response = await fetch('https://identity.xero.com/connect/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Token refresh failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });
      throw new Error(`Token refresh failed: ${response.status} ${response.statusText}`);
    }

    const tokenData = await response.json();

    // Get tenant IDs if not already stored
    let tenantIds = currentTokens.tenant_ids;
    if (!tenantIds || tenantIds.length === 0) {
      const connectionsResponse = await fetch('https://api.xero.com/connections', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Accept': 'application/json',
        },
      });

      if (connectionsResponse.ok) {
        const connections = await connectionsResponse.json();
        tenantIds = connections.map((c: any) => c.tenantId);
      }
    }

    // Store new tokens
    // Note: Xero may not return a new refresh_token, so we keep the existing one
    await storeXeroTokens({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || currentTokens.refresh_token, // Keep existing if not returned
      token_type: tokenData.token_type || currentTokens.token_type || 'Bearer',
      expires_in: tokenData.expires_in || 1800, // Default 30 minutes
      scope: tokenData.scope || currentTokens.scope,
      tenant_id: currentTokens.tenant_id,
      tenant_ids: tenantIds || currentTokens.tenant_ids,
    });

    return tokenData.access_token;
  } catch (error) {
    console.error('Error refreshing Xero token:', error);
    throw error;
  }
}

/**
 * Get valid Xero access token, refreshing if necessary
 */
export async function getValidXeroAccessToken(): Promise<string> {
  const tokens = await getXeroTokens();
  
  if (!tokens) {
    throw new Error('No Xero tokens found. Please authenticate with Xero first.');
  }

  // Check if token is expired or will expire in the next 5 minutes
  // If expires_at is stored, use it; otherwise calculate from expires_in
  let expiresAt: Date;
  if (tokens.expires_at) {
    expiresAt = new Date(tokens.expires_at);
  } else {
    // Calculate from expires_in (assuming it was just stored)
    expiresAt = new Date(Date.now() + (tokens.expires_in * 1000));
  }
  
  const now = new Date();
  const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

  if (expiresAt <= fiveMinutesFromNow) {
    // Token is expired or about to expire, refresh it
    console.log('Xero access token expired or expiring soon, refreshing...');
    return await refreshXeroAccessToken();
  }

  return tokens.access_token;
}

