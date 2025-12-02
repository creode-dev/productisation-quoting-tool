import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useHolidayStore } from '../store/holidayStore';
import { useEmployeeStore } from '../store/employeeStore';
import { differenceInDays } from 'date-fns';

interface HolidayFormData {
  startDate: string;
  endDate: string;
  daysRequested: number;
}

export function HolidayRequestForm({ onSuccess }: { onSuccess?: () => void }) {
  const { createHoliday, checkOverlaps, error: holidayError } = useHolidayStore();
  const { employee } = useEmployeeStore();
  const [overlaps, setOverlaps] = useState<any[]>([]);
  const [checkingOverlaps, setCheckingOverlaps] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<HolidayFormData>();

  const startDate = watch('startDate');
  const endDate = watch('endDate');

  useEffect(() => {
    if (startDate && endDate && employee?.team_id) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start <= end) {
        checkForOverlaps(startDate, endDate);
      }
    } else {
      setOverlaps([]);
    }
  }, [startDate, endDate, employee?.team_id]);

  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start <= end) {
        const days = differenceInDays(end, start) + 1;
        setValue('daysRequested', days);
      }
    }
  }, [startDate, endDate, setValue]);

  const checkForOverlaps = async (start: string, end: string) => {
    if (!employee?.team_id) return;

    try {
      setCheckingOverlaps(true);
      const overlapsList = await checkOverlaps(employee.team_id, start, end);
      setOverlaps(overlapsList);
    } catch (error) {
      console.error('Error checking overlaps:', error);
    } finally {
      setCheckingOverlaps(false);
    }
  };

  const onSubmit = async (data: HolidayFormData) => {
    try {
      await createHoliday({
        startDate: data.startDate,
        endDate: data.endDate,
        daysRequested: data.daysRequested,
      });
      setSuccess(true);
      reset();
      setTimeout(() => {
        setSuccess(false);
        if (onSuccess) onSuccess();
      }, 2000);
    } catch (error) {
      // Error handled by store
    }
  };

  const minDate = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Request Holiday</h2>

      {holidayError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {holidayError}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          Holiday request submitted successfully!
        </div>
      )}

      {overlaps.length > 0 && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-2">Team Overlap Warning</h3>
          <p className="text-sm text-yellow-700 mb-2">
            The following team members also have holidays during this period:
          </p>
          <ul className="list-disc list-inside text-sm text-yellow-700">
            {overlaps.map((overlap) => (
              <li key={overlap.id}>
                {overlap.employee_name} ({overlap.start_date} to {overlap.end_date})
              </li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date *
            </label>
            <input
              type="date"
              {...register('startDate', {
                required: 'Start date is required',
                validate: (value) => {
                  if (new Date(value) < new Date(minDate)) {
                    return 'Start date cannot be in the past';
                  }
                  return true;
                },
              })}
              min={minDate}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.startDate && (
              <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date *
            </label>
            <input
              type="date"
              {...register('endDate', {
                required: 'End date is required',
                validate: (value) => {
                  if (startDate && new Date(value) < new Date(startDate)) {
                    return 'End date must be after start date';
                  }
                  return true;
                },
              })}
              min={startDate || minDate}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.endDate && (
              <p className="mt-1 text-sm text-red-600">{errors.endDate.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Days Requested *
          </label>
          <input
            type="number"
            step="0.5"
            min="0.5"
            {...register('daysRequested', {
              required: 'Days requested is required',
              min: { value: 0.5, message: 'Must be at least 0.5 days' },
            })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.daysRequested && (
            <p className="mt-1 text-sm text-red-600">{errors.daysRequested.message}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            You can request half days (e.g., 2.5)
          </p>
        </div>

        {checkingOverlaps && (
          <div className="text-sm text-gray-600">Checking for team overlaps...</div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>
    </div>
  );
}

