import { useState, useEffect } from 'react';
import { QuoteForm } from './components/QuoteForm';
import { QuoteView } from './components/QuoteView';
import { PricingConfigLoader } from './components/PricingConfigLoader';
import { useQuoteStore } from './store/quoteStore';
import { buildQuote } from './utils/quoteBuilder';
import { Quote } from './types/quote';

// Get Google Sheet ID from environment or use default
// Format: https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit
const GOOGLE_SHEET_ID = import.meta.env.VITE_GOOGLE_SHEET_ID || '';

function App() {
  const { projectType, selectedPhases, answers, phases } = useQuoteStore();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [showQuote, setShowQuote] = useState(false);
  const [showPrices, setShowPrices] = useState(true);

  // Check if we should show quote view
  useEffect(() => {
    if (showQuote && projectType && selectedPhases.length > 0 && phases.length > 0) {
      try {
        const generatedQuote = buildQuote(projectType, answers, phases, selectedPhases);
        setQuote(generatedQuote);
      } catch (error) {
        console.error('Error building quote:', error);
        setShowQuote(false);
      }
    }
  }, [showQuote, projectType, selectedPhases, answers, phases]);

  const handleShowQuote = () => {
    if (projectType && selectedPhases.length > 0) {
      setShowQuote(true);
    }
  };

  const handleEditQuote = () => {
    setShowQuote(false);
    setQuote(null);
  };

  if (showQuote && quote) {
    return <QuoteView quote={quote} onEdit={handleEditQuote} />;
  }

  return (
    <div>
      {GOOGLE_SHEET_ID && (
        <div className="sticky top-0 z-50">
          <PricingConfigLoader 
            sheetId={GOOGLE_SHEET_ID}
            showPrices={showPrices}
            onTogglePrices={() => setShowPrices(!showPrices)}
          />
        </div>
      )}
      <QuoteForm showPrices={showPrices} />
      {projectType && selectedPhases.length > 0 && phases.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={handleShowQuote}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            View Quote
          </button>
        </div>
      )}
    </div>
  );
}

export default App;

