import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCurrentUser, isAdmin } from '../lib/auth';
import { sql } from '../lib/db';
import { getQueryParam } from '../lib/utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = getCurrentUser(req);
  
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  if (!isAdmin(user)) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  if (req.method === 'GET') {
    try {
      // Check if requesting a specific audit log by ID
      const id = getQueryParam(req.query, 'id');
      if (id) {
        const result = await sql`
          SELECT * FROM audit_logs
          WHERE id = ${id}
          LIMIT 1
        `;
        
        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Audit log not found' });
        }
        
        return res.status(200).json(result.rows[0]);
      }

      // List audit logs with filters
      const userId = getQueryParam(req.query, 'userId');
      const action = getQueryParam(req.query, 'action');
      const entityType = getQueryParam(req.query, 'entityType');
      const entityId = getQueryParam(req.query, 'entityId');
      const startDate = getQueryParam(req.query, 'startDate');
      const endDate = getQueryParam(req.query, 'endDate');
      const page = parseInt(getQueryParam(req.query, 'page') || '1', 10);
      const limit = parseInt(getQueryParam(req.query, 'limit') || '50', 10);
      const offset = (page - 1) * limit;

      // Build query with conditional filters using sql template literal
      // Use type assertions to help TypeScript with conditional fragments
      let result;
      let countResult;
      
      if (userId && action) {
        result = await sql`
          SELECT * FROM audit_logs
          WHERE user_id = ${userId} AND action = ${action}
          ${entityType ? sql`AND entity_type = ${entityType}` : sql`` as any}
          ${entityId ? sql`AND entity_id = ${entityId}` : sql`` as any}
          ${startDate ? sql`AND created_at >= ${startDate}::timestamp` : sql`` as any}
          ${endDate ? sql`AND created_at <= ${endDate}::timestamp` : sql`` as any}
          ORDER BY created_at DESC
          LIMIT ${limit}
          OFFSET ${offset}
        `;
        countResult = await sql`
          SELECT COUNT(*) as total FROM audit_logs
          WHERE user_id = ${userId} AND action = ${action}
          ${entityType ? sql`AND entity_type = ${entityType}` : sql`` as any}
          ${entityId ? sql`AND entity_id = ${entityId}` : sql`` as any}
          ${startDate ? sql`AND created_at >= ${startDate}::timestamp` : sql`` as any}
          ${endDate ? sql`AND created_at <= ${endDate}::timestamp` : sql`` as any}
        `;
      } else if (userId) {
        result = await sql`
          SELECT * FROM audit_logs
          WHERE user_id = ${userId}
          ${action ? sql`AND action = ${action}` : sql`` as any}
          ${entityType ? sql`AND entity_type = ${entityType}` : sql`` as any}
          ${entityId ? sql`AND entity_id = ${entityId}` : sql`` as any}
          ${startDate ? sql`AND created_at >= ${startDate}::timestamp` : sql`` as any}
          ${endDate ? sql`AND created_at <= ${endDate}::timestamp` : sql`` as any}
          ORDER BY created_at DESC
          LIMIT ${limit}
          OFFSET ${offset}
        `;
        countResult = await sql`
          SELECT COUNT(*) as total FROM audit_logs
          WHERE user_id = ${userId}
          ${action ? sql`AND action = ${action}` : sql`` as any}
          ${entityType ? sql`AND entity_type = ${entityType}` : sql`` as any}
          ${entityId ? sql`AND entity_id = ${entityId}` : sql`` as any}
          ${startDate ? sql`AND created_at >= ${startDate}::timestamp` : sql`` as any}
          ${endDate ? sql`AND created_at <= ${endDate}::timestamp` : sql`` as any}
        `;
      } else {
        result = await sql`
          SELECT * FROM audit_logs
          WHERE 1=1
          ${action ? sql`AND action = ${action}` : sql`` as any}
          ${entityType ? sql`AND entity_type = ${entityType}` : sql`` as any}
          ${entityId ? sql`AND entity_id = ${entityId}` : sql`` as any}
          ${startDate ? sql`AND created_at >= ${startDate}::timestamp` : sql`` as any}
          ${endDate ? sql`AND created_at <= ${endDate}::timestamp` : sql`` as any}
          ORDER BY created_at DESC
          LIMIT ${limit}
          OFFSET ${offset}
        `;
        countResult = await sql`
          SELECT COUNT(*) as total FROM audit_logs
          WHERE 1=1
          ${action ? sql`AND action = ${action}` : sql`` as any}
          ${entityType ? sql`AND entity_type = ${entityType}` : sql`` as any}
          ${entityId ? sql`AND entity_id = ${entityId}` : sql`` as any}
          ${startDate ? sql`AND created_at >= ${startDate}::timestamp` : sql`` as any}
          ${endDate ? sql`AND created_at <= ${endDate}::timestamp` : sql`` as any}
        `;
      }

      const total = parseInt(countResult.rows[0].total, 10);

      return res.status(200).json({
        logs: result.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error: any) {
      console.error('Error fetching audit logs:', error);
      return res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

