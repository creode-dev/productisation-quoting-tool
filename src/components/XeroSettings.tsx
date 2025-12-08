import { useState, useEffect } from 'react';
import { xeroAPI } from '../utils/api';

interface XeroStatus {
  authenticated: boolean;
  expiresAt?: string;
  expiresInMinutes?: number;
  isExpired?: boolean;
  hasRefreshToken?: boolean;
  tenantIds?: string[];
  scope?: string;
  message?: string;
}

export function XeroSettings() {
  const [status, setStatus] = useState<XeroStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/xero/token-status');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Error checking Xero status:', error);
      setStatus({ authenticated: false, message: 'Error checking status' });
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => {
    // Redirect to Xero OAuth
    window.location.href = '/api/auth/xero/redirect';
  };

  const handleSyncTenantIds = async () => {
    try {
      setSyncing(true);
      const response = await fetch('/api/xero/sync-tenant-ids', {
        method: 'POST',
      });
      const data = await response.json();
      if (response.ok) {
        alert(`Success: ${data.message}`);
        await checkStatus();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error syncing tenant IDs:', error);
      alert('Error syncing tenant IDs');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">Loading Xero connection status...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl">
      <h2 className="text-2xl font-bold mb-6">Xero Integration</h2>
      
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        {!status?.authenticated ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="font-semibold text-red-600">Not Connected</span>
            </div>
            <p className="text-gray-600">
              Connect your Xero account to enable company autocomplete in quotes. 
              This is a one-time setup that will be shared across all users.
            </p>
            <button
              onClick={handleConnect}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Connect Xero Account
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="font-semibold text-green-600">Connected</span>
            </div>
            
            {status.expiresAt && (
              <div>
                <p className="text-sm text-gray-600">
                  Token expires: {new Date(status.expiresAt).toLocaleString()}
                </p>
                {status.expiresInMinutes !== undefined && (
                  <p className="text-sm text-gray-600">
                    Expires in: {status.expiresInMinutes} minutes
                  </p>
                )}
                {status.isExpired && (
                  <p className="text-sm text-red-600 font-semibold">
                    Token expired - will auto-refresh on next use
                  </p>
                )}
              </div>
            )}

            {status.tenantIds && status.tenantIds.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-700">Tenant IDs:</p>
                <ul className="list-disc list-inside text-sm text-gray-600">
                  {status.tenantIds.map((id, idx) => (
                    <li key={idx}>{id}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleSyncTenantIds}
                disabled={syncing}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
              >
                {syncing ? 'Syncing...' : 'Sync Tenant IDs from Env'}
              </button>
              <button
                onClick={handleConnect}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Reconnect Xero
              </button>
              <button
                onClick={checkStatus}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Refresh Status
              </button>
            </div>
          </div>
        )}

        {status?.message && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">{status.message}</p>
          </div>
        )}
      </div>

      <div className="mt-6 text-sm text-gray-500">
        <p>
          <strong>Note:</strong> This is a shared connection. Once connected, all users 
          will be able to use Xero company autocomplete. The connection will automatically 
          refresh tokens when they expire.
        </p>
      </div>
    </div>
  );
}

