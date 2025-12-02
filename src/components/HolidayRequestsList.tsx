import { useEffect } from 'react';
import { useHolidayStore } from '../store/holidayStore';
import { format } from 'date-fns';

export function HolidayRequestsList() {
  const { holidays, loading, error, fetchHolidays, cancelHoliday } = useHolidayStore();

  useEffect(() => {
    fetchHolidays();
  }, [fetchHolidays]);

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this holiday request?')) {
      return;
    }

    try {
      await cancelHoliday(id);
    } catch (error) {
      // Error handled by store
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'cancelled':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return <div className="text-center text-gray-600">Loading holidays...</div>;
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
        No holiday requests yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {holidays.map((holiday) => (
        <div
          key={holiday.id}
          className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="font-medium">
                  {format(new Date(holiday.start_date), 'MMM d')} -{' '}
                  {format(new Date(holiday.end_date), 'MMM d, yyyy')}
                </span>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(
                    holiday.status
                  )}`}
                >
                  {holiday.status.charAt(0).toUpperCase() + holiday.status.slice(1)}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                {holiday.days_requested} day{holiday.days_requested !== 1 ? 's' : ''} requested
              </div>
              {holiday.rejection_reason && (
                <div className="mt-2 text-sm text-red-600">
                  Rejection reason: {holiday.rejection_reason}
                </div>
              )}
              {holiday.approver_name && (
                <div className="mt-1 text-sm text-gray-500">
                  {holiday.status === 'pending'
                    ? `Awaiting approval from ${holiday.approver_name}`
                    : `${holiday.status === 'approved' ? 'Approved' : 'Rejected'} by ${holiday.approver_name}`}
                </div>
              )}
            </div>
            {holiday.status === 'pending' && (
              <button
                onClick={() => handleCancel(holiday.id)}
                className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

