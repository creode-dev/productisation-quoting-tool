import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCurrentUser } from '../../lib/auth';
import { sql } from '../../lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const XERO_TENANT_ID = process.env.XERO_TENANT_ID?.trim();
    
    if (!XERO_TENANT_ID) {
      return res.status(400).json({ error: 'XERO_TENANT_ID not configured in environment' });
    }

    const tenantIds = XERO_TENANT_ID.split(',').map(id => id.trim()).filter(id => id.length > 0);
    
    // Update tenant IDs in database if tokens exist
    const result = await sql`
      UPDATE xero_tokens
      SET tenant_ids = ${tenantIds},
          updated_at = NOW()
      WHERE id IN (SELECT id FROM xero_tokens LIMIT 1)
      RETURNING id, tenant_ids
    `;

    if (result.rows.length === 0) {
      return res.status(200).json({ 
        message: 'No tokens found in database. Tenant IDs will be stored when you connect Xero.',
        tenantIds 
      });
    }

    return res.status(200).json({ 
      message: 'Tenant IDs updated successfully',
      tenantIds: result.rows[0].tenant_ids 
    });
  } catch (error: any) {
    console.error('Error syncing tenant IDs:', error);
    return res.status(500).json({ error: error.message || 'Failed to sync tenant IDs' });
  }
}

