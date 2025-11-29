import { useState, useEffect } from 'react';
import { Routes, Route, useOutletContext } from 'react-router-dom';
import { QuoteForm } from './components/QuoteForm';
import { QuoteView } from './components/QuoteView';
import { DocumentationPage } from './components/DocumentationPage';
import { AppLayout } from './components/AppLayout';
import { useQuoteStore } from './store/quoteStore';
import { buildQuote } from './utils/quoteBuilder';
import { Quote } from './types/quote';

interface OutletContext {
  showPrices: boolean;
}

function QuoteApp() {
  const { showPrices } = useOutletContext<OutletContext>();
  const { projectType, selectedPhases, answers, phases } = useQuoteStore();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [showQuote, setShowQuote] = useState(false);

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
    <>
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
    </>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<QuoteApp />} />
        <Route path="docs/*" element={<DocumentationPage />} />
      </Route>
    </Routes>
  );
}

export default App;

