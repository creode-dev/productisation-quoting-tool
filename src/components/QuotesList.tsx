import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuotesStore } from '../store/quotesStore';
import { QuoteStatus } from '../types/quote';
import { format } from 'date-fns';

const statusColors: Record<QuoteStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  sent: 'bg-blue-100 text-blue-800',
  accepted: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

export function QuotesList() {
  const navigate = useNavigate();
  const { quotes, loading, error, fetchQuotes, deleteQuote, acceptQuote } = useQuotesStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | 'all'>('all');

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this quote?')) {
      try {
        await deleteQuote(id);
      } catch (error) {
        alert('Failed to delete quote');
      }
    }
  };

  const handleAccept = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to accept this quote?')) {
      try {
        await acceptQuote(id);
      } catch (error) {
        alert('Failed to accept quote');
      }
    }
  };

  const filteredQuotes = quotes.filter((quote) => {
    const matchesSearch =
      quote.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quote.projectName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || quote.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading && quotes.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading quotes...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Quotes</h1>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Create New Quote
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-800">
            {error}
          </div>
        )}

        <div className="mb-6 flex gap-4">
          <input
            type="text"
            placeholder="Search by company or project..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as QuoteStatus | 'all')}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {filteredQuotes.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">
              {quotes.length === 0
                ? 'No quotes yet. Create your first quote to get started.'
                : 'No quotes match your search criteria.'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Business Unit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredQuotes.map((quote) => (
                  <tr
                    key={quote.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/quotes/${quote.id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {quote.companyName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{quote.projectName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {quote.businessUnit || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          statusColors[quote.status]
                        }`}
                      >
                        {quote.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(quote.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/quotes/${quote.id}`);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </button>
                        {quote.status !== 'accepted' && (
                          <button
                            onClick={(e) => handleAccept(quote.id, e)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Accept
                          </button>
                        )}
                        <button
                          onClick={(e) => handleDelete(quote.id, e)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

