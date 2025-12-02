import { useEffect, useState } from 'react';
import { holidaysAPI } from '../utils/api';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth } from 'date-fns';

interface Holiday {
  id: string;
  employee_name: string;
  start_date: string;
  end_date: string;
  status: string;
  days_requested: number;
}

export function HolidayCalendar({ teamId }: { teamId?: string }) {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHolidays();
  }, [currentDate, teamId]);

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      
      const filters: any = {};
      if (teamId) filters.teamId = teamId;
      
      const { holidays: allHolidays } = await holidaysAPI.getAll(filters);
      
      // Filter holidays that overlap with current month
      const monthHolidays = allHolidays.filter((h: Holiday) => {
        const start = new Date(h.start_date);
        const end = new Date(h.end_date);
        return (start <= monthEnd && end >= monthStart) && h.status === 'approved';
      });
      
      setHolidays(monthHolidays);
    } catch (error) {
      console.error('Error fetching holidays:', error);
    } finally {
      setLoading(false);
    }
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get holidays for a specific date
  const getHolidaysForDate = (date: Date) => {
    return holidays.filter((h) => {
      const start = new Date(h.start_date);
      const end = new Date(h.end_date);
      return date >= start && date <= end;
    });
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  if (loading) {
    return <div className="text-center text-gray-600">Loading calendar...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={previousMonth}
          className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          ← Previous
        </button>
        <h2 className="text-xl font-semibold">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <button
          onClick={nextMonth}
          className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          Next →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center text-sm font-medium text-gray-700">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const dayHolidays = getHolidaysForDate(day);
          return (
            <div
              key={day.toISOString()}
              className={`min-h-[80px] p-2 border border-gray-200 rounded ${
                !isSameMonth(day, currentDate) ? 'bg-gray-50' : 'bg-white'
              }`}
            >
              <div className="text-sm font-medium mb-1">
                {format(day, 'd')}
              </div>
              <div className="space-y-1">
                {dayHolidays.slice(0, 2).map((holiday) => (
                  <div
                    key={holiday.id}
                    className="text-xs bg-blue-100 text-blue-700 px-1 rounded truncate"
                    title={`${holiday.employee_name}: ${format(new Date(holiday.start_date), 'MMM d')} - ${format(new Date(holiday.end_date), 'MMM d')}`}
                  >
                    {holiday.employee_name}
                  </div>
                ))}
                {dayHolidays.length > 2 && (
                  <div className="text-xs text-gray-500">
                    +{dayHolidays.length - 2} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

