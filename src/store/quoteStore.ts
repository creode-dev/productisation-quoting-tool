import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { QuoteState, ProjectType, Answer, Phase, PricingTier } from '../types/quote';

interface QuoteStore extends QuoteState {
  phases: Phase[];
  selectedTier: PricingTier | null;
  setPhases: (phases: Phase[]) => void;
  setProjectType: (type: ProjectType) => void;
  setSelectedPhases: (phaseIds: string[]) => void;
  setAnswer: (questionId: string, value: string | number | boolean) => void;
  removeAnswer: (questionId: string) => void;
  setCurrentPhase: (phaseId: string | null) => void;
  setCurrentStep: (step: number) => void;
  setSelectedTier: (tier: PricingTier | null) => void;
  populateFromTier: (tier: PricingTier) => void;
  reset: () => void;
}

const initialState: QuoteState = {
  projectType: null,
  selectedPhases: [],
  answers: {},
  currentPhase: null,
  currentStep: 0
};

export const useQuoteStore = create<QuoteStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      phases: [],
      selectedTier: null,
      
      setPhases: (phases) => set({ phases }),
      
      setProjectType: (type) => set((state) => {
        // Select all phases by default, or keep existing selection if phases haven't loaded yet
        const allPhaseIds = state.phases.length > 0 
          ? state.phases.map(p => p.id)
          : ['phase-1']; // Fallback if phases not loaded
        return {
          projectType: type,
          selectedPhases: allPhaseIds
        };
      }),
      
      setSelectedPhases: (phaseIds) => set({ selectedPhases: phaseIds }),
      
      setAnswer: (questionId, value) => set((state) => ({
        answers: {
          ...state.answers,
          [questionId]: { questionId, value }
        }
      })),
      
      removeAnswer: (questionId) => set((state) => {
        const newAnswers = { ...state.answers };
        delete newAnswers[questionId];
        return { answers: newAnswers };
      }),
      
      setCurrentPhase: (phaseId) => set({ currentPhase: phaseId }),
      
      setCurrentStep: (step) => set({ currentStep: step }),
      
      setSelectedTier: (tier) => set({ selectedTier: tier }),
      
      populateFromTier: (tier) => {
        const state = get();
        const newAnswers: Record<string, Answer> = {};
        
        // Populate answers based on tier
        state.phases.forEach((phase) => {
          phase.questions.forEach((question) => {
            const tierValue = getTierValue(question, tier);
            if (tierValue !== null && tierValue !== undefined) {
              newAnswers[question.id] = { questionId: question.id, value: tierValue };
            }
          });
        });
        
        set({ answers: newAnswers, selectedTier: tier });
      },
      
      reset: () => set({ ...initialState, phases: [], selectedTier: null })
    }),
    {
      name: 'quote-storage',
      storage: createJSONStorage(() => localStorage)
    }
  )
);

// Helper function to get tier-specific value for a question
function getTierValue(question: Phase['questions'][0], tier: PricingTier): string | number | boolean | null {
  if (!question.tierValues) {
    return question.defaultValue as string | number | boolean | null;
  }
  
  const tierValue = question.tierValues[tier];
  if (!tierValue || tierValue.trim() === '') {
    return question.defaultValue as string | number | boolean | null;
  }
  
  // Convert CSV value to appropriate answer type
  // Handle binary (✅/❌)
  if (tierValue === '✅') {
    return true;
  }
  if (tierValue === '❌') {
    return false;
  }
  
  // Handle numbers
  const numberMatch = tierValue.match(/^(\d+)$/);
  if (numberMatch) {
    return parseInt(numberMatch[1], 10);
  }
  
  // Handle ranges (take the first number)
  const rangeMatch = tierValue.match(/^(\d+)-(\d+)$/);
  if (rangeMatch) {
    return parseInt(rangeMatch[1], 10);
  }
  
  // Handle "Up to X"
  const upToMatch = tierValue.match(/^Up to (\d+)$/i);
  if (upToMatch) {
    return parseInt(upToMatch[1], 10);
  }
  
  // For select questions, find the option matching the tier
  if (question.type === 'select' && question.options) {
    const tierOption = question.options.find(opt => opt.tier === tier);
    if (tierOption) {
      return tierOption.value;
    }
  }
  
  // For text, return cleaned value
  const cleaned = tierValue
    .replace(/^✅\s*/, '')
    .replace(/^❌\s*/, '')
    .replace(/\s*\([^)]*\)/g, '')
    .trim();
  
  return cleaned || question.defaultValue as string | number | boolean | null;
}

