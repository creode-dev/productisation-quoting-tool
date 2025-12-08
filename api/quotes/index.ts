import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCurrentUser } from '../lib/auth';
import { sql } from '../lib/db';
import { logAction, createChangesObject } from '../lib/audit';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  // Handle quote by ID if id query param exists
  const { id } = req.query;
  if (id) {
    const quoteId = Array.isArray(id) ? id[0] : id;
    
    if (req.method === 'GET') {
      try {
        const result = await sql`
          SELECT 
            id,
            user_id,
            company_name,
            company_xero_id,
            project_name,
            business_unit,
            target_completion_date,
            quote_data,
            status,
            created_at,
            updated_at,
            accepted_at,
            accepted_by
          FROM quotes
          WHERE id = ${quoteId}
        `;

        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Quote not found' });
        }

        return res.status(200).json({ quote: result.rows[0] });
      } catch (error) {
        console.error('Error fetching quote:', error);
        return res.status(500).json({ error: 'Failed to fetch quote' });
      }
    }

    if (req.method === 'DELETE') {
      try {
        // Get quote before deletion for audit log
        const quoteBefore = await sql`
          SELECT * FROM quotes WHERE id = ${quoteId} LIMIT 1
        `;

        const result = await sql`
          DELETE FROM quotes
          WHERE id = ${quoteId}
          RETURNING id
        `;

        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Quote not found' });
        }

        // Log deletion
        if (quoteBefore.rows.length > 0) {
          await logAction(req, {
            userId: user.email,
            action: 'quote.deleted',
            entityType: 'quote',
            entityId: quoteId,
            changes: createChangesObject(quoteBefore.rows[0], null),
          });
        }

        return res.status(200).json({ success: true });
      } catch (error) {
        console.error('Error deleting quote:', error);
        return res.status(500).json({ error: 'Failed to delete quote' });
      }
    }

    if (req.method === 'PATCH') {
      try {
        // Check if this is an accept action
        if (req.body.action === 'accept') {
          // Get quote before update for audit log
          const quoteBefore = await sql`
            SELECT * FROM quotes WHERE id = ${quoteId} LIMIT 1
          `;

          const result = await sql`
            UPDATE quotes
            SET 
              status = 'accepted',
              accepted_at = NOW(),
              accepted_by = ${user.email},
              updated_at = NOW()
            WHERE id = ${quoteId}
            RETURNING *
          `;

          if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Quote not found' });
          }

          // Log acceptance
          if (quoteBefore.rows.length > 0) {
            await logAction(req, {
              userId: user.email,
              action: 'quote.accepted',
              entityType: 'quote',
              entityId: quoteId,
              changes: createChangesObject(quoteBefore.rows[0], result.rows[0]),
            });
          }

          return res.status(200).json({ 
            quote: result.rows[0],
            message: 'Quote accepted successfully'
          });
        }

        // Get quote before update for audit log
        const quoteBefore = await sql`
          SELECT * FROM quotes WHERE id = ${quoteId} LIMIT 1
        `;

        if (quoteBefore.rows.length === 0) {
          return res.status(404).json({ error: 'Quote not found' });
        }

        // Regular update
        const updates: any = {};

        if (req.body.companyName !== undefined) updates.company_name = req.body.companyName;
        if (req.body.companyXeroId !== undefined) updates.company_xero_id = req.body.companyXeroId;
        if (req.body.projectName !== undefined) updates.project_name = req.body.projectName;
        if (req.body.businessUnit !== undefined) updates.business_unit = req.body.businessUnit;
        if (req.body.targetCompletionDate !== undefined) updates.target_completion_date = req.body.targetCompletionDate;
        if (req.body.quoteData !== undefined) updates.quote_data = JSON.stringify(req.body.quoteData);
        if (req.body.status !== undefined) updates.status = req.body.status;

        updates.updated_at = new Date();

        if (Object.keys(updates).length === 0) {
          return res.status(400).json({ error: 'No fields to update' });
        }

        const setClause = Object.keys(updates)
          .map((key, index) => `${key} = $${index + 1}`)
          .join(', ');

        const values = Object.values(updates);
        values.push(quoteId);

        const result = await sql.query(
          `UPDATE quotes SET ${setClause} WHERE id = $${values.length} RETURNING *`,
          values
        );

        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Quote not found' });
        }

        // Log update
        await logAction(req, {
          userId: user.email,
          action: 'quote.updated',
          entityType: 'quote',
          entityId: quoteId,
          changes: createChangesObject(quoteBefore.rows[0], result.rows[0]),
        });

        return res.status(200).json({ quote: result.rows[0] });
      } catch (error) {
        console.error('Error updating quote:', error);
        return res.status(500).json({ error: 'Failed to update quote' });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (req.method === 'GET') {
    try {
      const result = await sql`
        SELECT 
          id,
          user_id,
          company_name,
          company_xero_id,
          project_name,
          business_unit,
          target_completion_date,
          quote_data,
          status,
          created_at,
          updated_at,
          accepted_at,
          accepted_by
        FROM quotes
        ORDER BY created_at DESC
      `;

      return res.status(200).json({ quotes: result.rows });
    } catch (error) {
      console.error('Error fetching quotes:', error);
      return res.status(500).json({ error: 'Failed to fetch quotes' });
    }
  }

  if (req.method === 'POST') {
    try {
      const {
        companyName,
        companyXeroId,
        projectName,
        businessUnit,
        targetCompletionDate,
        quoteData,
      } = req.body;

      if (!companyName || !projectName || !quoteData) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const result = await sql`
        INSERT INTO quotes (
          user_id,
          company_name,
          company_xero_id,
          project_name,
          business_unit,
          target_completion_date,
          quote_data,
          status
        ) VALUES (
          ${user.email},
          ${companyName},
          ${companyXeroId || null},
          ${projectName},
          ${businessUnit || null},
          ${targetCompletionDate || null},
          ${JSON.stringify(quoteData)},
          'draft'
        )
        RETURNING id, created_at
      `;

      const quoteId = result.rows[0].id;

      // Log creation
      await logAction(req, {
        userId: user.email,
        action: 'quote.created',
        entityType: 'quote',
        entityId: quoteId,
        changes: createChangesObject(null, {
          id: quoteId,
          companyName,
          projectName,
          status: 'draft',
        }),
      });

      return res.status(200).json({
        quote: {
          id: quoteId,
          ...req.body,
          status: 'draft',
          createdAt: result.rows[0].created_at,
        },
      });
    } catch (error) {
      console.error('Error creating quote:', error);
      return res.status(500).json({ error: 'Failed to create quote' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
