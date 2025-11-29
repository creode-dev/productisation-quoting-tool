import { useState, useEffect, useCallback } from 'react';
import { parsePricingConfig } from '../utils/pricingConfig';
import { setPricingConfig } from '../utils/pricingCalculator';

import { ProjectType } from '../types/quote';
import { getSheetGidForProjectType } from '../utils/sheetTabs';

interface PricingConfigLoaderProps {
  sheetId?: string;
  projectType?: ProjectType | null;
  onConfigLoaded?: () => void;
  showPrices: boolean;
  onTogglePrices: () => void;
}

export function PricingConfigLoader({ sheetId, projectType, onConfigLoaded, showPrices, onTogglePrices }: PricingConfigLoaderProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval] = useState(30000); // 30 seconds default

  const loadConfig = useCallback(async () => {
    if (!sheetId) return;

    setLoading(true);
    setError(null);

    try {
      // Get the appropriate sheet tab (GID) based on project type
      const gid = getSheetGidForProjectType(projectType || null);
      const config = await parsePricingConfig({ sheetId, gid });
      setPricingConfig(config);
      setLastUpdated(config.lastUpdated || new Date());
      onConfigLoaded?.();
    } catch (err) {
      console.error('Error loading pricing config:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to load pricing configuration: ${errorMessage}. Using default pricing.`);
    } finally {
      setLoading(false);
    }
  }, [sheetId, projectType, onConfigLoaded]);

  useEffect(() => {
    if (sheetId && projectType) {
      loadConfig();
    }
  }, [sheetId, projectType, loadConfig]);

  // Auto-refresh interval
  useEffect(() => {
    if (!sheetId || !projectType || !autoRefresh) return;

    const interval = setInterval(() => {
      loadConfig();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [sheetId, projectType, autoRefresh, refreshInterval, loadConfig]);

  if (!sheetId) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-yellow-800">
          No Google Sheet ID configured. Please set the sheet ID in the environment or config.
        </p>
      </div>
    );
  }

  if (!projectType) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-blue-800">
          Please select a project type to load pricing configuration.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-blue-900">
              Pricing Configuration
            </p>
            {autoRefresh && (
              <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                Auto-refresh: {refreshInterval / 1000}s
              </span>
            )}
          </div>
          {lastUpdated && (
            <p className="text-xs text-blue-700 mt-1">
              Last updated: {lastUpdated.toLocaleString()}
            </p>
          )}
          {error && (
            <p className="text-xs text-red-700 mt-1">{error}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onTogglePrices}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              showPrices
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            title={showPrices ? 'Hide prices' : 'Show prices'}
          >
            {showPrices ? 'Prices: ON' : 'Prices: OFF'}
          </button>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              autoRefresh
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            title={autoRefresh ? 'Disable auto-refresh' : 'Enable auto-refresh'}
          >
            {autoRefresh ? 'Auto: ON' : 'Auto: OFF'}
          </button>
          <button
            onClick={loadConfig}
            disabled={loading}
            className="px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh Now'}
          </button>
        </div>
      </div>
    </div>
  );
}

