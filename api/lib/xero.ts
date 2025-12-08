const XERO_TENANT_ID = process.env.XERO_TENANT_ID?.trim();
import { getValidXeroAccessToken, getXeroTokens } from './xeroTokens';

// Get array of tenant IDs (supports comma-separated list from env or database)
async function getTenantIds(): Promise<string[]> {
  // First try to get from database tokens
  const tokens = await getXeroTokens();
  if (tokens?.tenant_ids && tokens.tenant_ids.length > 0) {
    return tokens.tenant_ids;
  }

  // Fallback to environment variable
  if (XERO_TENANT_ID) {
    return XERO_TENANT_ID.split(',').map(id => id.trim()).filter(id => id.length > 0);
  }

  return [];
}

/**
 * Get Xero access token, automatically refreshing if expired
 */
async function getXeroAccessToken(): Promise<string> {
  try {
    // Use the token service which handles refresh automatically
    return await getValidXeroAccessToken();
  } catch (error: any) {
    // Fallback to environment variable if database tokens not available
    const storedToken = process.env.XERO_ACCESS_TOKEN?.trim();
    if (storedToken) {
      console.warn('[Xero] Using fallback XERO_ACCESS_TOKEN from environment. Automatic refresh not available.');
      // Check if token is still valid by making a test call
      // For now, just return it - the API call will fail if invalid
      return storedToken;
    }

    console.error('[Xero] Access token error:', error);
    throw new Error(`Xero access token not available: ${error.message}. Please authenticate with Xero at /api/auth/xero/redirect or visit /settings/xero`);
  }
}

export interface XeroCompany {
  ContactID: string;
  Name: string;
  ContactStatus?: string;
  EmailAddress?: string;
}

async function searchXeroCompaniesForTenant(
  query: string,
  tenantId: string,
  token: string
): Promise<XeroCompany[]> {
  try {
    const response = await fetch(
      `https://api.xero.com/api.xro/2.0/Contacts?where=Name.Contains("${encodeURIComponent(query)}")&order=Name`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Xero-tenant-id': tenantId,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unable to read error response');
      console.error(`Xero API request failed for tenant ${tenantId}:`, {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        tokenLength: token.length,
        tokenStart: token.substring(0, 10),
        query,
      });
      
      // If token is invalid/expired, try to refresh
      if (response.status === 401) {
        console.error('Xero token appears to be expired or invalid, attempting refresh...');
        // The token refresh should happen automatically on next call
      }
      
      return [];
    }

    const data = await response.json();
    console.log(`Xero API response for tenant ${tenantId}, query "${query}":`, {
      totalContacts: data.Contacts?.length || 0,
      hasContacts: !!data.Contacts,
    });
    
    // Filter to only return contacts (companies) - be less restrictive
    // Include contacts that are customers (IsCustomer === true or undefined)
    // Exclude only if explicitly marked as supplier-only
    const contacts = (data.Contacts || []).filter((contact: any) => {
      // Include if it's a customer (or not explicitly marked as supplier-only)
      const isCustomer = contact.IsCustomer !== false; // true or undefined
      const isNotSupplierOnly = contact.IsSupplier !== true; // false or undefined
      return isCustomer && isNotSupplierOnly;
    });
    
    console.log(`Filtered contacts for tenant ${tenantId}:`, {
      beforeFilter: data.Contacts?.length || 0,
      afterFilter: contacts.length,
    });

    return contacts.map((contact: any) => ({
      ContactID: contact.ContactID,
      Name: contact.Name,
      ContactStatus: contact.ContactStatus,
      EmailAddress: contact.EmailAddress,
    }));
  } catch (error) {
    console.error(`Error searching Xero companies for tenant ${tenantId}:`, error);
    return [];
  }
}

export async function searchXeroCompanies(query: string): Promise<XeroCompany[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  try {
    console.log(`[Xero Search] Starting search for query: "${query}"`);
    
    const tenantIds = await getTenantIds();
    console.log(`[Xero Search] Tenant IDs found:`, tenantIds);
    
    if (tenantIds.length === 0) {
      console.error('[Xero Search] Xero tenant ID not configured. Check XERO_TENANT_ID env var or connect via OAuth.');
      // Try to get from env as fallback
      const XERO_TENANT_ID = process.env.XERO_TENANT_ID?.trim();
      if (XERO_TENANT_ID) {
        const envTenantIds = XERO_TENANT_ID.split(',').map(id => id.trim()).filter(id => id.length > 0);
        console.log(`[Xero Search] Using tenant IDs from env var:`, envTenantIds);
        if (envTenantIds.length > 0) {
          // Use env tenant IDs for this search
          const token = await getXeroAccessToken();
          const searchPromises = envTenantIds.map(tenantId => 
            searchXeroCompaniesForTenant(query, tenantId, token)
          );
          const results = await Promise.all(searchPromises);
          const allCompanies = results.flat();
          const uniqueCompanies = new Map<string, XeroCompany>();
          for (const company of allCompanies) {
            if (!uniqueCompanies.has(company.ContactID)) {
              uniqueCompanies.set(company.ContactID, company);
            }
          }
          return Array.from(uniqueCompanies.values()).sort((a, b) => 
            a.Name.localeCompare(b.Name)
          );
        }
      }
      return [];
    }

    const token = await getXeroAccessToken();
    console.log(`[Xero Search] Token obtained, length: ${token.length}`);
    
    // Search across all tenants in parallel
    const searchPromises = tenantIds.map(tenantId => 
      searchXeroCompaniesForTenant(query, tenantId, token)
    );
    
    const results = await Promise.all(searchPromises);
    console.log(`[Xero Search] Results from all tenants:`, results.map(r => r.length));
    
    // Merge results from all tenants
    const allCompanies = results.flat();
    console.log(`[Xero Search] Total companies found: ${allCompanies.length}`);
    
    // Remove duplicates based on ContactID (in case same company exists in multiple tenants)
    const uniqueCompanies = new Map<string, XeroCompany>();
    for (const company of allCompanies) {
      if (!uniqueCompanies.has(company.ContactID)) {
        uniqueCompanies.set(company.ContactID, company);
      }
    }
    
    // Sort by name
    const sorted = Array.from(uniqueCompanies.values()).sort((a, b) => 
      a.Name.localeCompare(b.Name)
    );
    
    console.log(`[Xero Search] Final unique companies: ${sorted.length}`);
    return sorted;
  } catch (error) {
    console.error('[Xero Search] Error searching Xero companies:', error);
    // Log the full error details for debugging
    if (error instanceof Error) {
      console.error('[Xero Search] Error message:', error.message);
      console.error('[Xero Search] Error stack:', error.stack);
    }
    return [];
  }
}

