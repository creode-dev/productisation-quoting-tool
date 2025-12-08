import type { VercelRequest } from '@vercel/node';
import { sql } from './db';

export interface AuditLogData {
  userId: string;
  action: string;
  entityType?: string;
  entityId?: string;
  changes?: any;
  metadata?: any;
}

/**
 * Extract IP address from request
 */
function getIpAddress(req: VercelRequest): string | null {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded)) {
    return forwarded[0]?.split(',')[0].trim() || null;
  }
  return req.headers['x-real-ip'] as string | null || null;
}

/**
 * Extract user agent from request
 */
function getUserAgent(req: VercelRequest): string | null {
  return (req.headers['user-agent'] as string) || null;
}

/**
 * Log an action to the audit trail
 * This function handles errors gracefully to ensure audit logging doesn't break main functionality
 */
export async function logAction(
  req: VercelRequest,
  data: AuditLogData
): Promise<void> {
  try {
    const ipAddress = getIpAddress(req);
    const userAgent = getUserAgent(req);

    await sql`
      INSERT INTO audit_logs (
        user_id,
        action,
        entity_type,
        entity_id,
        changes,
        ip_address,
        user_agent,
        metadata,
        created_at
      ) VALUES (
        ${data.userId},
        ${data.action},
        ${data.entityType || null},
        ${data.entityId || null},
        ${data.changes ? JSON.stringify(data.changes) : null},
        ${ipAddress},
        ${userAgent},
        ${data.metadata ? JSON.stringify(data.metadata) : null},
        NOW()
      )
    `;
  } catch (error) {
    // Log error but don't throw - audit logging should never break main functionality
    console.error('Audit logging error:', error);
  }
}

/**
 * Helper function to create a changes object for before/after states
 */
export function createChangesObject(before: any, after: any): any {
  return {
    before,
    after,
  };
}

/**
 * Helper function to log a simple action without entity details
 */
export async function logSimpleAction(
  req: VercelRequest,
  userId: string,
  action: string,
  metadata?: any
): Promise<void> {
  await logAction(req, {
    userId,
    action,
    metadata,
  });
}


