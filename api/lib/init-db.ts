// Database initialization script
// Run this once to set up the database schema
// You can call this from a Vercel serverless function or run it manually

import { initDatabase } from './db';

export default async function handler() {
  try {
    await initDatabase();
    return { success: true, message: 'Database initialized successfully' };
  } catch (error) {
    console.error('Database initialization error:', error);
    return { success: false, error: String(error) };
  }
}

