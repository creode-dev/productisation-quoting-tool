import { useEffect, useState } from 'react';
import { employeesAPI, teamsAPI } from '../utils/api';

export function EmployeeManagement() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [employeesRes, teamsRes] = await Promise.all([
        employeesAPI.getAll(),
        teamsAPI.getAll(),
      ]);
      setEmployees(employeesRes.employees);
      setTeams(teamsRes.teams);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (employee: any) => {
    setEditingId(employee.id);
    setEditData({
      startDate: employee.start_date || '',
      holidayEntitlementDays: employee.holiday_entitlement_days || 25,
      teamId: employee.team_id || '',
      approverId: employee.approver_id || '',
    });
  };

  const handleSave = async () => {
    if (!editingId) return;

    try {
      await employeesAPI.update(editingId, editData);
      await fetchData();
      setEditingId(null);
      setEditData({});
    } catch (err: any) {
      alert(err.message || 'Failed to update employee');
    }
  };

  if (loading) {
    return <div className="text-center text-gray-600">Loading employees...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Employee Management</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {employees.length === 0 ? (
        <div className="text-center text-gray-500 py-8">No employees found.</div>
      ) : (
        <div className="space-y-4">
          {employees.map((employee) => (
            <div
              key={employee.id}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              {editingId === employee.id ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={editData.startDate}
                        onChange={(e) =>
                          setEditData({ ...editData, startDate: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Holiday Entitlement (days)
                      </label>
                      <input
                        type="number"
                        value={editData.holidayEntitlementDays}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            holidayEntitlementDays: parseInt(e.target.value) || 25,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Team
                      </label>
                      <select
                        value={editData.teamId}
                        onChange={(e) =>
                          setEditData({ ...editData, teamId: e.target.value || null })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="">No team</option>
                        {teams.map((team) => (
                          <option key={team.id} value={team.id}>
                            {team.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Approver
                      </label>
                      <select
                        value={editData.approverId}
                        onChange={(e) =>
                          setEditData({ ...editData, approverId: e.target.value || null })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="">Auto-approve</option>
                        {employees
                          .filter((e) => e.id !== employee.id)
                          .map((emp) => (
                            <option key={emp.id} value={emp.id}>
                              {emp.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setEditData({});
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{employee.name}</h3>
                    <p className="text-sm text-gray-600">{employee.user_id}</p>
                    <div className="text-sm text-gray-500 mt-1">
                      {employee.team_name && `Team: ${employee.team_name} • `}
                      Entitlement: {employee.holiday_entitlement_days || 25} days
                      {employee.approver_name && ` • Approver: ${employee.approver_name}`}
                    </div>
                  </div>
                  <button
                    onClick={() => handleEdit(employee)}
                    className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

