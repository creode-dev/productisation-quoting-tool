import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Quote, SavedQuote } from '../types/quote';
import { PricingBreakdown } from './PricingBreakdown';
import { generatePDF } from '../utils/pdfGenerator';
import { sendQuoteEmail } from '../utils/emailService';
import { useQuoteStore } from '../store/quoteStore';
import { useQuotesStore } from '../store/quotesStore';
import { format } from 'date-fns';
import { SendForSigningModal } from './SendForSigningModal';
import { QuoteApprovalStatus } from './QuoteApprovalStatus';
import { useAuth } from '../contexts/AuthContext';

interface QuoteViewProps {
  quote: Quote;
  savedQuote?: SavedQuote;
  onEdit: () => void;
}

export function QuoteView({ quote, savedQuote, onEdit }: QuoteViewProps) {
  const navigate = useNavigate();
  const reset = useQuoteStore((state) => state.reset);
  const { deleteQuote, acceptQuote } = useQuotesStore();
  const { user } = useAuth();
  const [showSendModal, setShowSendModal] = useState(false);
  const [hasApproval, setHasApproval] = useState(false);
  
  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    sent: 'bg-blue-100 text-blue-800',
    accepted: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };
  
  const handleDelete = async () => {
    if (!savedQuote) return;
    if (window.confirm('Are you sure you want to delete this quote?')) {
      try {
        await deleteQuote(savedQuote.id);
        navigate('/quotes');
      } catch (error) {
        alert('Failed to delete quote');
      }
    }
  };
  
  const handleAccept = async () => {
    if (!savedQuote) return;
    if (window.confirm('Are you sure you want to accept this quote?')) {
      try {
        await acceptQuote(savedQuote.id);
        alert('Quote accepted successfully!');
      } catch (error) {
        alert('Failed to accept quote');
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const handleExportPDF = () => {
    generatePDF(quote);
  };

  const handleSendEmail = async () => {
    const email = prompt('Enter email address to send quote:');
    if (email) {
      try {
        await sendQuoteEmail(quote, email);
        alert('Quote sent successfully!');
      } catch (error) {
        alert('Error sending quote. Please try again.');
        console.error(error);
      }
    }
  };

  const handleStartOver = () => {
    if (window.confirm('Are you sure you want to start over? All your progress will be lost.')) {
      reset();
      window.location.reload();
    }
  };

  const handleSendForSigning = async (data: { signerEmail: string; signerName: string; message?: string }) => {
    if (!savedQuote) {
      throw new Error('Quote must be saved before sending for signing');
    }

    const response = await fetch(`/api/quotes/${savedQuote.id}/send-for-signing`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send quote for signing');
    }

    const result = await response.json();
    alert(`Quote sent for signing! Signing URL: ${result.signingUrl}`);
    setHasApproval(true);
    // Refresh the page to show updated status
    window.location.reload();
  };

  // Check if quote has approval record
  useEffect(() => {
    if (savedQuote) {
      fetch(`/api/quotes/${savedQuote.id}/approval-status`)
        .then(res => res.json())
        .then(data => {
          setHasApproval(data.hasApproval);
        })
        .catch(() => {
          // Ignore errors
        });
    }
  }, [savedQuote]);

  // Check if user can send for signing (quote creator or admin)
  const canSendForSigning = savedQuote && 
    (savedQuote.userId === user?.email || user?.email?.endsWith('@creode.co.uk')) &&
    savedQuote.status !== 'accepted' &&
    savedQuote.status !== 'rejected' &&
    !hasApproval;

  const projectTypeLabels: Record<string, string> = {
    'web-dev': 'Web Development',
    'brand': 'Brand',
    'campaign': 'Campaign'
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Quote</h1>
              {savedQuote && (
                <>
                  <div className="mb-2">
                    <p className="text-gray-700">
                      <span className="font-semibold">Company:</span> {savedQuote.companyName}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-semibold">Project:</span> {savedQuote.projectName}
                    </p>
                    {savedQuote.businessUnit && (
                      <p className="text-gray-700">
                        <span className="font-semibold">Business Unit:</span> {savedQuote.businessUnit}
                      </p>
                    )}
                    {savedQuote.targetCompletionDate && (
                      <p className="text-gray-700">
                        <span className="font-semibold">Target Completion:</span>{' '}
                        {format(new Date(savedQuote.targetCompletionDate), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold">Status:</span>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        statusColors[savedQuote.status] || statusColors.draft
                      }`}
                    >
                      {savedQuote.status}
                    </span>
                  </div>
                </>
              )}
              <p className="text-gray-600">
                {projectTypeLabels[quote.projectType]} Project
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Created: {formatDate(quote.createdAt)}
              </p>
            </div>
            <div className="flex gap-3 flex-wrap">
              {savedQuote && (
                <>
                  {canSendForSigning && (
                    <button
                      onClick={() => setShowSendModal(true)}
                      className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                    >
                      Send for Signing
                    </button>
                  )}
                  {savedQuote.status !== 'accepted' && savedQuote.status !== 'rejected' && !hasApproval && (
                    <button
                      onClick={handleAccept}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      Accept Quote
                    </button>
                  )}
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Delete
                  </button>
                </>
              )}
              {!savedQuote && (
                <>
                  <button
                    onClick={handleStartOver}
                    className="px-4 py-2 text-gray-600 hover:text-gray-900 rounded-md flex items-center space-x-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <span>Start Over</span>
                  </button>
                  <button
                    onClick={onEdit}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                  >
                    Edit Quote
                  </button>
                </>
              )}
              <button
                onClick={handleExportPDF}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Export PDF
              </button>
              {savedQuote && (
                <button
                  onClick={handleSendEmail}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                  title="Opens your email client (use 'Send for Signing' for electronic signatures)"
                >
                  Open in Email
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Approval Status */}
        {savedQuote && hasApproval && (
          <div className="mb-6">
            <QuoteApprovalStatus quoteId={savedQuote.id} />
          </div>
        )}

        {/* Summary */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Project Total</h3>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(quote.total)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Timeline</h3>
              <p className="text-xl font-semibold text-gray-900">{quote.timeline}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Phases Included</h3>
              <p className="text-xl font-semibold text-gray-900">{quote.phases.length}</p>
            </div>
          </div>
        </div>

        {/* Pricing Breakdown */}
        <PricingBreakdown
          phases={quote.phases}
          addOns={quote.addOns}
          ongoingCosts={quote.ongoingCosts}
          total={quote.total}
        />

        {/* Send for Signing Modal */}
        {savedQuote && (
          <SendForSigningModal
            isOpen={showSendModal}
            onClose={() => setShowSendModal(false)}
            onSend={handleSendForSigning}
            quoteId={savedQuote.id}
          />
        )}
      </div>
    </div>
  );
}




