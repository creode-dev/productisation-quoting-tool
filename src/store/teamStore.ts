import { create } from 'zustand';
import { teamsAPI } from '../utils/api';

export interface Team {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

interface TeamStore {
  teams: Team[];
  loading: boolean;
  error: string | null;
  fetchTeams: () => Promise<void>;
  createTeam: (data: { name: string; description?: string }) => Promise<void>;
  updateTeam: (id: string, data: { name: string; description?: string }) => Promise<void>;
  deleteTeam: (id: string) => Promise<void>;
  reset: () => void;
}

export const useTeamStore = create<TeamStore>((set, get) => ({
  teams: [],
  loading: false,
  error: null,

  fetchTeams: async () => {
    set({ loading: true, error: null });
    try {
      const { teams } = await teamsAPI.getAll();
      set({ teams, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch teams', loading: false });
    }
  },

  createTeam: async (data) => {
    set({ loading: true, error: null });
    try {
      await teamsAPI.create(data);
      await get().fetchTeams();
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to create team', loading: false });
      throw error;
    }
  },

  updateTeam: async (id, data) => {
    set({ loading: true, error: null });
    try {
      await teamsAPI.update(id, data);
      await get().fetchTeams();
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to update team', loading: false });
      throw error;
    }
  },

  deleteTeam: async (id) => {
    set({ loading: true, error: null });
    try {
      await teamsAPI.delete(id);
      await get().fetchTeams();
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to delete team', loading: false });
      throw error;
    }
  },

  reset: () => {
    set({ teams: [], loading: false, error: null });
  },
}));

