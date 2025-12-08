import { useEffect, useState } from 'react';
import { holidaysAPI } from '../utils/api';
import { format } from 'date-fns';

interface HolidayRequest {
  id: string;
  employee_name: string;
  start_date: string;
  end_date: string;
  days_requested: number;
  status: string;
  created_at: string;
}

export function HolidayApprovalQueue() {
  const [holidays, setHolidays] = useState<HolidayRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingHolidays();
  }, []);

  const fetchPendingHolidays = async () => {
    try {
      setLoading(true);
      const { holidays: allHolidays } = await holidaysAPI.getAll({ status: 'pending' });
      setHolidays(allHolidays);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch pending holidays');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await holidaysAPI.approve(id);
      await fetchPendingHolidays();
    } catch (err: any) {
      alert(err.message || 'Failed to approve holiday');
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Please provide a reason for rejection (optional):');
    if (reason === null) return; // User cancelled

    try {
      await holidaysAPI.reject(id, reason || undefined);
      await fetchPendingHolidays();
    } catch (err: any) {
      alert(err.message || 'Failed to reject holiday');
    }
  };

  if (loading) {
    return <div className="text-center text-gray-600">Loading pending requests...</div>;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        {error}
      </div>
    );
  }

  if (holidays.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No pending holiday requests.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Holiday Approval Queue</h1>

      <div className="space-y-4">
        {holidays.map((holiday) => (
          <div
            key={holiday.id}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-medium">{holiday.employee_name}</h3>
                <div className="text-sm text-gray-600 mt-1">
                  {format(new Date(holiday.start_date), 'MMM d')} -{' '}
                  {format(new Date(holiday.end_date), 'MMM d, yyyy')}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {holiday.days_requested} day{holiday.days_requested !== 1 ? 's' : ''} requested
                  • Requested on {format(new Date(holiday.created_at), 'MMM d, yyyy')}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleApprove(holiday.id)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleReject(holiday.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}




