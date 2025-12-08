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
  const [setupInfo, setSetupInfo] = useState<any>(null);

  useEffect(() => {
    checkStatus();
    // Also run setup check
    checkSetup();
  }, []);

  const checkSetup = async () => {
    try {
      const response = await fetch('/api/xero/setup');
      const data = await response.json();
      setSetupInfo(data);
      // Update status if setup provides more info
      if (data.tokens) {
        setStatus(prev => ({
          ...prev,
          authenticated: data.tokens.exists,
          tenantIds: data.tokens.tenantIds || prev?.tenantIds,
        }));
      }
    } catch (error) {
      console.error('Error checking Xero setup:', error);
    }
  };

  const runSetup = async () => {
    try {
      setSyncing(true);
      const response = await fetch('/api/xero/setup', { method: 'POST' });
      const data = await response.json();
      setSetupInfo(data);
      if (data.tokens) {
        await checkStatus();
      }
      alert(data.status === 'ready' ? 'Setup complete! Xero is ready to use.' : `Setup: ${data.status}`);
    } catch (error) {
      console.error('Error running setup:', error);
      alert('Error running setup');
    } finally {
      setSyncing(false);
    }
  };

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

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={runSetup}
                disabled={syncing}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {syncing ? 'Running Setup...' : 'Run Setup'}
              </button>
              <button
                onClick={handleSyncTenantIds}
                disabled={syncing}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
              >
                {syncing ? 'Syncing...' : 'Sync Tenant IDs'}
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
                Refresh
              </button>
            </div>
            
            {setupInfo && setupInfo.steps && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-semibold">Setup Steps:</p>
                {setupInfo.steps.map((step: any, idx: number) => (
                  <div key={idx} className={`text-sm p-2 rounded ${
                    step.status === 'success' ? 'bg-green-50 text-green-800' :
                    step.status === 'error' ? 'bg-red-50 text-red-800' :
                    'bg-yellow-50 text-yellow-800'
                  }`}>
                    {step.status === 'success' ? '✓' : step.status === 'error' ? '✗' : '○'} {step.step}: {step.message}
                  </div>
                ))}
              </div>
            )}
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

