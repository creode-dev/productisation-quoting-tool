import { Quote } from '../types/quote';
import { PricingBreakdown } from './PricingBreakdown';
import { generatePDF } from '../utils/pdfGenerator';
import { sendQuoteEmail } from '../utils/emailService';
import { useQuoteStore } from '../store/quoteStore';

interface QuoteViewProps {
  quote: Quote;
  onEdit: () => void;
}

export function QuoteView({ quote, onEdit }: QuoteViewProps) {
  const reset = useQuoteStore((state) => state.reset);

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
              <p className="text-gray-600">
                {projectTypeLabels[quote.projectType]} Project
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Created: {formatDate(quote.createdAt)}
              </p>
            </div>
            <div className="flex gap-3">
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
              <button
                onClick={handleExportPDF}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Export PDF
              </button>
              <button
                onClick={handleSendEmail}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Send Email
              </button>
            </div>
          </div>
        </div>

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
      </div>
    </div>
  );
}

