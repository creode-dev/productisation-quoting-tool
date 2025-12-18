import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useEmployeeStore } from '../store/employeeStore';

interface EmployeeFormData {
  name: string;
  address: string;
  phone: string;
  nextOfKinName: string;
  nextOfKinRelationship: string;
  nextOfKinPhone: string;
}

export function EmployeeProfile() {
  const { employee, loading, error, fetchEmployee, updateEmployee } = useEmployeeStore();
  const [success, setSuccess] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeFormData>();

  useEffect(() => {
    fetchEmployee();
  }, [fetchEmployee]);

  useEffect(() => {
    if (employee) {
      reset({
        name: employee.name || '',
        address: employee.address || '',
        phone: employee.phone || '',
        nextOfKinName: employee.next_of_kin_name || '',
        nextOfKinRelationship: employee.next_of_kin_relationship || '',
        nextOfKinPhone: employee.next_of_kin_phone || '',
      });
    }
  }, [employee, reset]);

  const onSubmit = async (data: EmployeeFormData) => {
    try {
      await updateEmployee({
        name: data.name,
        address: data.address,
        phone: data.phone,
        next_of_kin_name: data.nextOfKinName,
        next_of_kin_relationship: data.nextOfKinRelationship,
        next_of_kin_phone: data.nextOfKinPhone,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      // Error is handled by store
    }
  };

  if (loading && !employee) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center text-gray-600">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Employee Profile</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          Profile updated successfully!
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name *
          </label>
          <input
            type="text"
            {...register('name', { required: 'Name is required' })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address
          </label>
          <textarea
            {...register('address')}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone
          </label>
          <input
            type="tel"
            {...register('phone')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="border-t pt-6">
          <h2 className="text-lg font-semibold mb-4">Next of Kin</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                {...register('nextOfKinName')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Relationship
              </label>
              <input
                type="text"
                {...register('nextOfKinRelationship')}
                placeholder="e.g., Spouse, Parent, Sibling"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                {...register('nextOfKinPhone')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}





