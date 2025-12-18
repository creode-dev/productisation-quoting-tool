import { create } from 'zustand';
import { SavedQuote } from '../types/quote';
import { quotesAPI } from '../utils/api';

interface QuotesStore {
  quotes: SavedQuote[];
  loading: boolean;
  error: string | null;
  fetchQuotes: () => Promise<void>;
  saveQuote: (quote: {
    // Company name is optional so that quotes can be created without a linked client
    companyName?: string;
    companyXeroId?: string;
    projectName: string;
    businessUnit?: string;
    targetCompletionDate?: string;
    quoteData: any;
  }) => Promise<SavedQuote>;
  deleteQuote: (id: string) => Promise<void>;
  acceptQuote: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useQuotesStore = create<QuotesStore>((set) => ({
  quotes: [],
  loading: false,
  error: null,

  fetchQuotes: async () => {
    set({ loading: true, error: null });
    try {
      const { quotes } = await quotesAPI.getAll();
      set({ quotes, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch quotes', loading: false });
    }
  },

  saveQuote: async (quoteData) => {
    set({ loading: true, error: null });
    try {
      const { quote } = await quotesAPI.create(quoteData);
      const newQuote = quote as SavedQuote;
      set((state) => ({
        quotes: [newQuote, ...state.quotes],
        loading: false,
      }));
      return newQuote;
    } catch (error: any) {
      set({ error: error.message || 'Failed to save quote', loading: false });
      throw error;
    }
  },

  deleteQuote: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await quotesAPI.delete(id);
      set((state) => ({
        quotes: state.quotes.filter((q) => q.id !== id),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to delete quote', loading: false });
      throw error;
    }
  },

  acceptQuote: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await quotesAPI.accept(id);
      set((state) => ({
        quotes: state.quotes.map((q) =>
          q.id === id
            ? { ...q, status: 'accepted' as const, acceptedAt: new Date().toISOString() }
            : q
        ),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to accept quote', loading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));

