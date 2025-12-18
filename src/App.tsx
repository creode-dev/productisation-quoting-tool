import { useState, useEffect } from 'react';
import { Routes, Route, useOutletContext, useParams, Navigate } from 'react-router-dom';
import { QuoteForm } from './components/QuoteForm';
import { QuoteView } from './components/QuoteView';
import { QuotesList } from './components/QuotesList';
import { LoginPage } from './components/LoginPage';
import { DocumentationPage } from './components/DocumentationPage';
import { AppLayout } from './components/AppLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { useQuoteStore } from './store/quoteStore';
import { useQuotesStore } from './store/quotesStore';
import { buildQuote } from './utils/quoteBuilder';
import { Quote, SavedQuote } from './types/quote';

interface OutletContext {
  showPrices: boolean;
}

function QuoteApp() {
  const { showPrices } = useOutletContext<OutletContext>();
  const { projectType, selectedPhases, answers, phases } = useQuoteStore();
  const { saveQuote } = useQuotesStore();
  const [showQuote, setShowQuote] = useState(false);

  const handleShowQuote = () => {
    if (projectType && selectedPhases.length > 0) {
      setShowQuote(true);
    }
  };

  const handleSave = async () => {
    const state = useQuoteStore.getState();
    if (!state.projectName || !state.projectType || state.selectedPhases.length === 0) {
      alert('Please fill in all required fields and complete the quote');
      return;
    }
    
    try {
      const quote = buildQuote(state.projectType, state.answers, state.phases, state.selectedPhases);
      await saveQuote({
        companyName: state.companyName || undefined,
        companyXeroId: state.companyXeroId || undefined,
        projectName: state.projectName,
        businessUnit: state.businessUnit || undefined,
        targetCompletionDate: state.targetCompletionDate || undefined,
        quoteData: quote,
      });
      alert('Quote saved successfully!');
    } catch (error: any) {
      alert(error.message || 'Failed to save quote');
    }
  };

  if (showQuote && projectType && selectedPhases.length > 0 && phases.length > 0) {
    try {
      const quote = buildQuote(projectType, answers, phases, selectedPhases);
      return <QuoteView quote={quote} onEdit={() => setShowQuote(false)} />;
    } catch (error) {
      console.error('Error building quote:', error);
      setShowQuote(false);
    }
  }

  return (
    <>
      <QuoteForm showPrices={showPrices} />
      {projectType && selectedPhases.length > 0 && phases.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
          <button
            onClick={handleShowQuote}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            View Quote
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
          >
            Save Quote
          </button>
        </div>
      )}
    </>
  );
}

function SavedQuoteView() {
  const { id } = useParams<{ id: string }>();
  const { quotes, fetchQuotes } = useQuotesStore();
  const [quote, setQuote] = useState<SavedQuote | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchQuotes().then(() => {
        const found = quotes.find((q) => q.id === id);
        if (found) {
          setQuote(found);
        }
        setLoading(false);
      });
    }
  }, [id, fetchQuotes, quotes]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading quote...</div>
      </div>
    );
  }

  if (!quote) {
    return <Navigate to="/quotes" replace />;
  }

  const quoteData = quote.quoteData as Quote;
  return <QuoteView quote={quoteData} savedQuote={quote} onEdit={() => {}} />;
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<AppLayout />}>
          <Route
            index
            element={
              <ProtectedRoute>
                <QuoteApp />
              </ProtectedRoute>
            }
          />
          <Route
            path="quotes"
            element={
              <ProtectedRoute>
                <QuotesList />
              </ProtectedRoute>
            }
          />
          <Route
            path="quotes/:id"
            element={
              <ProtectedRoute>
                <SavedQuoteView />
              </ProtectedRoute>
            }
          />
          <Route path="docs/*" element={<DocumentationPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;

