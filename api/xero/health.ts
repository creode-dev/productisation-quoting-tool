import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Simple health check endpoint for Xero integration
 * No authentication required - just checks if the endpoint is accessible
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    return res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'Xero API endpoints are accessible',
    });
  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      error: error.message || 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
}

