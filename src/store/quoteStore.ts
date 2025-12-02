import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { QuoteState, ProjectType, Answer, Phase, PricingTier } from '../types/quote';

interface QuoteStore extends QuoteState {
  phases: Phase[];
  selectedTier: PricingTier | null;
  // Quote metadata
  companyName: string;
  companyXeroId: string | null;
  projectName: string;
  businessUnit: string;
  targetCompletionDate: string;
  // Shared variables (values that can be referenced across phases)
  sharedVariables: Record<string, number | string | boolean>;
  setPhases: (phases: Phase[]) => void;
  setProjectType: (type: ProjectType) => void;
  setSelectedPhases: (phaseIds: string[]) => void;
  setAnswer: (questionId: string, value: string | number | boolean) => void;
  removeAnswer: (questionId: string) => void;
  setCurrentPhase: (phaseId: string | null) => void;
  setCurrentStep: (step: number) => void;
  setSelectedTier: (tier: PricingTier | null) => void;
  setCompanyName: (name: string) => void;
  setCompanyXeroId: (id: string | null) => void;
  setProjectName: (name: string) => void;
  setBusinessUnit: (unit: string) => void;
  setTargetCompletionDate: (date: string) => void;
  setSharedVariable: (name: string, value: number | string | boolean) => void;
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

const initialMetadata = {
  companyName: '',
  companyXeroId: null as string | null,
  projectName: '',
  businessUnit: '',
  targetCompletionDate: '',
  sharedVariables: {} as Record<string, number | string | boolean>,
};

export const useQuoteStore = create<QuoteStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      ...initialMetadata,
      phases: [],
      selectedTier: null,
      sharedVariables: {},
      
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
      
      setAnswer: (questionId, value) => set((state) => {
        // Find the question to check if it's a shared variable definition
        let sharedVarName: string | undefined;
        for (const phase of state.phases) {
          const question = phase.questions.find(q => q.id === questionId);
          if (question?.isSharedVariable && question.sharedVariableName) {
            sharedVarName = question.sharedVariableName;
            break;
          }
        }
        
        // Update shared variable if this question defines one
        const newSharedVariables = sharedVarName
          ? { ...state.sharedVariables, [sharedVarName]: value }
          : state.sharedVariables;
        
        return {
          answers: {
            ...state.answers,
            [questionId]: { questionId, value }
          },
          sharedVariables: newSharedVariables
        };
      }),
      
      removeAnswer: (questionId) => set((state) => {
        const newAnswers = { ...state.answers };
        delete newAnswers[questionId];
        return { answers: newAnswers };
      }),
      
      setCurrentPhase: (phaseId) => set({ currentPhase: phaseId }),
      
      setCurrentStep: (step) => set({ currentStep: step }),
      
      setSelectedTier: (tier) => set({ selectedTier: tier }),
      
      setCompanyName: (name) => set({ companyName: name }),
      setCompanyXeroId: (id) => set({ companyXeroId: id }),
      setProjectName: (name) => set({ projectName: name }),
      setBusinessUnit: (unit) => set({ businessUnit: unit }),
      setTargetCompletionDate: (date) => set({ targetCompletionDate: date }),
      
      setSharedVariable: (name, value) => set((state) => ({
        sharedVariables: {
          ...state.sharedVariables,
          [name]: value
        }
      })),
      
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
      
      reset: () => set({ ...initialState, ...initialMetadata, phases: [], selectedTier: null, sharedVariables: {} })
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

