// Database initialization endpoint
// Call this endpoint once to initialize the database schema
// GET /api/init-db

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initDatabase, initEmployeePortal } from './lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await initDatabase();
    await initEmployeePortal();
    return res.status(200).json({ success: true, message: 'Database initialized successfully' });
  } catch (error: any) {
    console.error('Database initialization error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

