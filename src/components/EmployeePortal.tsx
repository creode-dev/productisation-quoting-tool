import { useState, useEffect } from 'react';
import { EmployeeProfile } from './EmployeeProfile';
import { DocumentUpload } from './DocumentUpload';
import { HolidayRequestForm } from './HolidayRequestForm';
import { HolidayRequestsList } from './HolidayRequestsList';
import { HolidayCalendar } from './HolidayCalendar';
import { useHolidayStore } from '../store/holidayStore';
import { useEmployeeStore } from '../store/employeeStore';

type Tab = 'profile' | 'documents' | 'holidays' | 'calendar';

export function EmployeePortal() {
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const { remaining, fetchRemaining } = useHolidayStore();
  const { employee, fetchEmployee } = useEmployeeStore();

  useEffect(() => {
    fetchEmployee();
    fetchRemaining();
  }, [fetchEmployee, fetchRemaining]);

  const tabs = [
    { id: 'profile' as Tab, label: 'Profile' },
    { id: 'documents' as Tab, label: 'Documents' },
    { id: 'holidays' as Tab, label: 'Holidays' },
    { id: 'calendar' as Tab, label: 'Calendar' },
  ];

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Employee Portal</h1>

      {remaining && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-900">Holiday Entitlement</h3>
              <div className="text-sm text-blue-700 mt-1">
                <span className="font-medium">{remaining.remainingDays}</span> days remaining
                {remaining.pendingDays > 0 && (
                  <span className="ml-2">
                    ({remaining.pendingDays} pending)
                  </span>
                )}
              </div>
            </div>
            <div className="text-right text-sm text-blue-700">
              <div>Annual: {remaining.annualEntitlement} days</div>
              <div>Pro-rata: {remaining.proRataEntitlement} days</div>
              <div>Used: {remaining.usedDays} days</div>
            </div>
          </div>
        </div>
      )}

      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div>
        {activeTab === 'profile' && <EmployeeProfile />}
        {activeTab === 'documents' && <DocumentUpload />}
        {activeTab === 'holidays' && (
          <div className="space-y-6">
            <HolidayRequestForm
              onSuccess={() => {
                // Refresh lists after successful submission
                fetchRemaining();
              }}
            />
            <div>
              <h2 className="text-xl font-semibold mb-4">My Holiday Requests</h2>
              <HolidayRequestsList />
            </div>
          </div>
        )}
        {activeTab === 'calendar' && (
          <HolidayCalendar teamId={employee?.team_id} />
        )}
      </div>
    </div>
  );
}

