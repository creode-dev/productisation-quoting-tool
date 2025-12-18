const XERO_CLIENT_ID = process.env.XERO_CLIENT_ID;
const XERO_CLIENT_SECRET = process.env.XERO_CLIENT_SECRET;
const XERO_TENANT_ID = process.env.XERO_TENANT_ID;

// Get array of tenant IDs (supports comma-separated list)
function getTenantIds(): string[] {
  if (!XERO_TENANT_ID) {
    return [];
  }
  return XERO_TENANT_ID.split(',').map(id => id.trim()).filter(id => id.length > 0);
}

interface XeroTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getXeroAccessToken(): Promise<string> {
  // If we have a valid cached token, return it
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60000) {
    return cachedToken.token;
  }

  // Check if access token is stored in environment (for server-to-server)
  const storedToken = process.env.XERO_ACCESS_TOKEN;
  if (storedToken) {
    cachedToken = {
      token: storedToken,
      expiresAt: Date.now() + (3600 * 1000), // Assume 1 hour validity
    };
    return storedToken;
  }

  if (!XERO_CLIENT_ID || !XERO_CLIENT_SECRET) {
    throw new Error('Xero credentials not configured. Please set XERO_ACCESS_TOKEN or XERO_CLIENT_ID and XERO_CLIENT_SECRET');
  }

  // For server-to-server OAuth, you may need to use a refresh token flow
  // This is a placeholder - you'll need to implement the actual OAuth flow
  // or use a stored access token from environment variables
  
  throw new Error('Xero access token not available. Please set XERO_ACCESS_TOKEN environment variable or implement OAuth flow.');
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
      console.error(`Xero API request failed for tenant ${tenantId}: ${response.statusText}`);
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
  const tenantIds = getTenantIds();
  
  if (tenantIds.length === 0) {
    throw new Error('Xero tenant ID not configured');
  }

  if (!query || query.trim().length < 2) {
    return [];
  }

  try {
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
    return [];
  }
}

