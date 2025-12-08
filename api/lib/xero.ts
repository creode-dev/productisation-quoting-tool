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
      console.warn('Using fallback XERO_ACCESS_TOKEN from environment. Automatic refresh not available.');
      return storedToken;
    }

    console.error('Xero access token error:', error);
    throw new Error(`Xero access token not available: ${error.message}. Please authenticate with Xero at /api/auth/xero/redirect`);
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
      });
      
      // If token is invalid/expired, clear cache
      if (response.status === 401) {
        console.error('Xero token appears to be expired or invalid');
        cachedToken = null;
      }
      
      return [];
    }

    const data = await response.json();
    
    // Filter to only return contacts (companies) not individuals
    const contacts = (data.Contacts || []).filter((contact: any) => 
      contact.IsSupplier === false && contact.IsCustomer !== false
    );

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
    const tenantIds = await getTenantIds();
    
    if (tenantIds.length === 0) {
      console.error('Xero tenant ID not configured');
      return [];
    }

    const token = await getXeroAccessToken();
    
    // Search across all tenants in parallel
    const searchPromises = tenantIds.map(tenantId => 
      searchXeroCompaniesForTenant(query, tenantId, token)
    );
    
    const results = await Promise.all(searchPromises);
    
    // Merge results from all tenants
    const allCompanies = results.flat();
    
    // Remove duplicates based on ContactID (in case same company exists in multiple tenants)
    const uniqueCompanies = new Map<string, XeroCompany>();
    for (const company of allCompanies) {
      if (!uniqueCompanies.has(company.ContactID)) {
        uniqueCompanies.set(company.ContactID, company);
      }
    }
    
    // Sort by name
    return Array.from(uniqueCompanies.values()).sort((a, b) => 
      a.Name.localeCompare(b.Name)
    );
  } catch (error) {
    console.error('Error searching Xero companies:', error);
    // Log the full error details for debugging
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return [];
  }
}

