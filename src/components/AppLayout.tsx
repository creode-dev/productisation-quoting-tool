import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { PricingConfigLoader } from './PricingConfigLoader';
import { useQuoteStore } from '../store/quoteStore';

// Get Google Sheet ID from environment
const GOOGLE_SHEET_ID = import.meta.env.VITE_GOOGLE_SHEET_ID || '';

export function AppLayout() {
  const { projectType } = useQuoteStore();
  const [showPrices, setShowPrices] = useState(true);
  const location = useLocation();
  
  // Only show pricing config loader on quote pages (not documentation)
  const isQuotePage = location.pathname === '/' || !location.pathname.startsWith('/docs');

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        {GOOGLE_SHEET_ID && isQuotePage && (
          <div className="sticky top-0 z-40">
            <PricingConfigLoader
              sheetId={GOOGLE_SHEET_ID}
              projectType={projectType}
              showPrices={showPrices}
              onTogglePrices={() => setShowPrices(!showPrices)}
            />
          </div>
        )}
        <main className="flex-1">
          <Outlet context={{ showPrices }} />
        </main>
      </div>
    </div>
  );
}

