import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCurrentUser } from '../lib/auth';
import { sql } from '../lib/db';

function calculateProRataEntitlement(
  annualEntitlement: number,
  startDate: Date | null,
  currentYear: number
): number {
  if (!startDate) {
    return annualEntitlement;
  }

  const start = new Date(startDate);
  const yearStart = new Date(currentYear, 0, 1);
  const yearEnd = new Date(currentYear, 11, 31);

  // If started before this year, full entitlement
  if (start < yearStart) {
    return annualEntitlement;
  }

  // If started after this year, no entitlement
  if (start > yearEnd) {
    return 0;
  }

  // Calculate pro-rata: days remaining in year / total days in year
  const daysInYear = 365;
  const daysRemaining = Math.ceil((yearEnd.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const proRata = (daysRemaining / daysInYear) * annualEntitlement;

  return Math.round(proRata * 10) / 10; // Round to 1 decimal place
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  if (req.method === 'GET') {
    try {
      // Get employee
      const employee = await sql`
        SELECT 
          id,
          start_date,
          holiday_entitlement_days
        FROM employees 
        WHERE user_id = ${user.email} 
        LIMIT 1
      `;

      if (employee.rows.length === 0) {
        return res.status(404).json({ error: 'Employee profile not found' });
      }

      const emp = employee.rows[0];
      const currentYear = new Date().getFullYear();
      const annualEntitlement = emp.holiday_entitlement_days || 25;

      // Calculate pro-rata entitlement
      const proRataEntitlement = calculateProRataEntitlement(
        annualEntitlement,
        emp.start_date ? new Date(emp.start_date) : null,
        currentYear
      );

      // Get approved and pending holidays for this year
      const yearStart = `${currentYear}-01-01`;
      const yearEnd = `${currentYear}-12-31`;

      const holidays = await sql`
        SELECT 
          days_requested,
          status
        FROM holiday_requests
        WHERE employee_id = ${emp.id}
          AND start_date >= ${yearStart}
          AND start_date <= ${yearEnd}
          AND status IN ('approved', 'pending')
      `;

      let usedDays = 0;
      let pendingDays = 0;

      for (const holiday of holidays.rows) {
        const days = parseFloat(holiday.days_requested);
        if (holiday.status === 'approved') {
          usedDays += days;
        } else if (holiday.status === 'pending') {
          pendingDays += days;
        }
      }

      const remainingDays = proRataEntitlement - usedDays - pendingDays;

      return res.status(200).json({
        annualEntitlement,
        proRataEntitlement,
        usedDays,
        pendingDays,
        remainingDays: Math.max(0, remainingDays),
      });
    } catch (error) {
      console.error('Error calculating remaining holidays:', error);
      return res.status(500).json({ error: 'Failed to calculate remaining holidays' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}




