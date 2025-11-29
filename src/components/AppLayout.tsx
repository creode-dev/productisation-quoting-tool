import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { PricingConfigLoader } from './PricingConfigLoader';
import { useQuoteStore } from '../store/quoteStore';

// Get Google Sheet ID from environment
const GOOGLE_SHEET_ID = import.meta.env.VITE_GOOGLE_SHEET_ID || '';

export function AppLayout() {
  const { projectType } = useQuoteStore();
  const [showPrices, setShowPrices] = useState(true);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        {GOOGLE_SHEET_ID && (
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

