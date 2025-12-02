import { create } from 'zustand';
import { holidaysAPI } from '../utils/api';

export interface HolidayRequest {
  id: string;
  employee_id: string;
  start_date: string;
  end_date: string;
  days_requested: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approver_id?: string;
  approved_at?: string;
  rejection_reason?: string;
  google_calendar_event_id?: string;
  employee_calendar_event_id?: string;
  created_at?: string;
  updated_at?: string;
  employee_name?: string;
  team_id?: string;
  team_name?: string;
  approver_name?: string;
}

export interface RemainingHolidays {
  annualEntitlement: number;
  proRataEntitlement: number;
  usedDays: number;
  pendingDays: number;
  remainingDays: number;
}

interface HolidayStore {
  holidays: HolidayRequest[];
  remaining: RemainingHolidays | null;
  loading: boolean;
  error: string | null;
  fetchHolidays: () => Promise<void>;
  fetchRemaining: () => Promise<void>;
  createHoliday: (data: {
    startDate: string;
    endDate: string;
    daysRequested: number;
  }) => Promise<void>;
  updateHoliday: (id: string, data: {
    startDate?: string;
    endDate?: string;
    daysRequested?: number;
  }) => Promise<void>;
  cancelHoliday: (id: string) => Promise<void>;
  approveHoliday: (id: string) => Promise<void>;
  rejectHoliday: (id: string, reason?: string) => Promise<void>;
  checkOverlaps: (teamId: string, startDate: string, endDate: string, excludeRequestId?: string) => Promise<HolidayRequest[]>;
  reset: () => void;
}

export const useHolidayStore = create<HolidayStore>((set, get) => ({
  holidays: [],
  remaining: null,
  loading: false,
  error: null,

  fetchHolidays: async () => {
    set({ loading: true, error: null });
    try {
      const { holidays } = await holidaysAPI.getMe();
      set({ holidays, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch holidays', loading: false });
    }
  },

  fetchRemaining: async () => {
    try {
      const remaining = await holidaysAPI.getRemaining();
      set({ remaining });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch remaining holidays' });
    }
  },

  createHoliday: async (data) => {
    set({ loading: true, error: null });
    try {
      await holidaysAPI.create(data);
      await get().fetchHolidays();
      await get().fetchRemaining();
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to create holiday', loading: false });
      throw error;
    }
  },

  updateHoliday: async (id, data) => {
    set({ loading: true, error: null });
    try {
      await holidaysAPI.update(id, data);
      await get().fetchHolidays();
      await get().fetchRemaining();
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to update holiday', loading: false });
      throw error;
    }
  },

  cancelHoliday: async (id) => {
    set({ loading: true, error: null });
    try {
      await holidaysAPI.cancel(id);
      await get().fetchHolidays();
      await get().fetchRemaining();
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to cancel holiday', loading: false });
      throw error;
    }
  },

  approveHoliday: async (id) => {
    set({ loading: true, error: null });
    try {
      await holidaysAPI.approve(id);
      await get().fetchHolidays();
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to approve holiday', loading: false });
      throw error;
    }
  },

  rejectHoliday: async (id, reason) => {
    set({ loading: true, error: null });
    try {
      await holidaysAPI.reject(id, reason);
      await get().fetchHolidays();
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to reject holiday', loading: false });
      throw error;
    }
  },

  checkOverlaps: async (teamId, startDate, endDate, excludeRequestId) => {
    try {
      const { overlaps } = await holidaysAPI.checkOverlaps(teamId, startDate, endDate, excludeRequestId);
      return overlaps;
    } catch (error: any) {
      set({ error: error.message || 'Failed to check overlaps' });
      return [];
    }
  },

  reset: () => {
    set({ holidays: [], remaining: null, loading: false, error: null });
  },
}));

