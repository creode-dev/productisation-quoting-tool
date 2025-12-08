import { useEffect, useState } from 'react';
import { format } from 'date-fns';

interface ApprovalStatus {
  id: string;
  status: 'pending' | 'signed' | 'declined' | 'cancelled';
  signerEmail: string;
  signerName: string;
  signingUrl: string | null;
  poRequired: boolean;
  poNumber: string | null;
  rejectionReason: string | null;
  signedAt: string | null;
  declinedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface QuoteApprovalStatusProps {
  quoteId: string;
}

export function QuoteApprovalStatus({ quoteId }: QuoteApprovalStatusProps) {
  const [approval, setApproval] = useState<ApprovalStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchApprovalStatus();
  }, [quoteId]);

  const fetchApprovalStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/quotes/${quoteId}/approval-status`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch approval status');
      }

      const data = await response.json();
      setApproval(data.hasApproval ? data.approval : null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="text-gray-600">Loading approval status...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="text-red-800">Error: {error}</div>
      </div>
    );
  }

  if (!approval) {
    return null; // No approval record yet
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    signed: 'bg-green-100 text-green-800 border-green-300',
    declined: 'bg-red-100 text-red-800 border-red-300',
    cancelled: 'bg-gray-100 text-gray-800 border-gray-300',
  };

  const statusLabels: Record<string, string> = {
    pending: 'Pending Signature',
    signed: 'Signed',
    declined: 'Declined',
    cancelled: 'Cancelled',
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Approval Status</h3>
        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${statusColors[approval.status]}`}>
          {statusLabels[approval.status]}
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <span className="text-sm font-medium text-gray-700">Signer: </span>
          <span className="text-sm text-gray-900">{approval.signerName}</span>
          <span className="text-sm text-gray-500 ml-2">({approval.signerEmail})</span>
        </div>

        {approval.status === 'pending' && approval.signingUrl && (
          <div>
            <a
              href={approval.signingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
            >
              View Signing Link
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        )}

        {approval.status === 'signed' && (
          <>
            {approval.poRequired && (
              <div>
                <span className="text-sm font-medium text-gray-700">PO Required: </span>
                <span className="text-sm text-gray-900">Yes</span>
              </div>
            )}
            {approval.poNumber && (
              <div>
                <span className="text-sm font-medium text-gray-700">PO Number: </span>
                <span className="text-sm text-gray-900 font-mono">{approval.poNumber}</span>
              </div>
            )}
            {approval.signedAt && (
              <div>
                <span className="text-sm font-medium text-gray-700">Signed At: </span>
                <span className="text-sm text-gray-900">
                  {format(new Date(approval.signedAt), 'PPpp')}
                </span>
              </div>
            )}
          </>
        )}

        {approval.status === 'declined' && approval.rejectionReason && (
          <div>
            <span className="text-sm font-medium text-gray-700">Rejection Reason: </span>
            <p className="text-sm text-gray-900 mt-1 p-2 bg-white rounded border border-gray-200">
              {approval.rejectionReason}
            </p>
            {approval.declinedAt && (
              <div className="mt-2">
                <span className="text-sm font-medium text-gray-700">Declined At: </span>
                <span className="text-sm text-gray-900">
                  {format(new Date(approval.declinedAt), 'PPpp')}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="pt-2 border-t border-gray-200">
          <span className="text-xs text-gray-500">
            Created: {format(new Date(approval.createdAt), 'PPpp')}
          </span>
        </div>
      </div>
    </div>
  );
}


