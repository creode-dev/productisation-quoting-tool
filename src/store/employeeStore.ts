import { create } from 'zustand';
import { employeesAPI } from '../utils/api';

export interface Employee {
  id: string;
  user_id: string;
  name: string;
  address?: string;
  phone?: string;
  next_of_kin_name?: string;
  next_of_kin_relationship?: string;
  next_of_kin_phone?: string;
  start_date?: string;
  holiday_entitlement_days?: number;
  team_id?: string;
  approver_id?: string;
  team_name?: string;
  approver_name?: string;
  created_at?: string;
  updated_at?: string;
}

interface EmployeeStore {
  employee: Employee | null;
  loading: boolean;
  error: string | null;
  fetchEmployee: () => Promise<void>;
  updateEmployee: (data: Partial<Employee>) => Promise<void>;
  reset: () => void;
}

export const useEmployeeStore = create<EmployeeStore>((set, get) => ({
  employee: null,
  loading: false,
  error: null,

  fetchEmployee: async () => {
    set({ loading: true, error: null });
    try {
      const { employee } = await employeesAPI.getMe();
      set({ employee, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch employee', loading: false });
    }
  },

  updateEmployee: async (data: Partial<Employee>) => {
    set({ loading: true, error: null });
    try {
      const { employee } = await employeesAPI.updateMe({
        name: data.name,
        address: data.address,
        phone: data.phone,
        nextOfKinName: data.next_of_kin_name,
        nextOfKinRelationship: data.next_of_kin_relationship,
        nextOfKinPhone: data.next_of_kin_phone,
      });
      set({ employee, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to update employee', loading: false });
      throw error;
    }
  },

  reset: () => {
    set({ employee: null, loading: false, error: null });
  },
}));

