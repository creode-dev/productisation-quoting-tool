export type ProjectType = 'web-dev' | 'brand' | 'campaign';

export type QuestionType = 'binary' | 'number' | 'select' | 'range' | 'text';

export type PricingTier = 'essential' | 'refresh' | 'transformation';

export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected';

export interface QuestionOption {
  value: string;
  label: string;
  tier?: PricingTier;
  price?: number;
  isAddOn?: boolean;
}

export interface Question {
  id: string;
  label: string;
  type: QuestionType;
  phaseId: string;
  options?: QuestionOption[];
  defaultValue?: string | number | boolean;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  helpText?: string;
  isAddOn?: boolean;
  dependsOn?: string; // ID of question this depends on
  condition?: (value: any) => boolean; // Condition function for showing this question
  tierValues?: {
    essential: string;
    refresh: string;
    transformation: string;
  };
  // Shared variable fields
  isSharedVariable?: boolean; // True if this question defines a shared variable
  sharedVariableName?: string; // Name of the shared variable (without brackets) if this defines one
  referencesSharedVariable?: string; // Name of the shared variable (without brackets) if this references one
}

export interface Phase {
  id: string;
  name: string;
  order: number;
  isRequired: boolean;
  questions: Question[];
}

export interface Answer {
  questionId: string;
  value: string | number | boolean;
}

export interface QuoteState {
  projectType: ProjectType | null;
  selectedPhases: string[];
  answers: Record<string, Answer>;
  currentPhase: string | null;
  currentStep: number;
}

export interface PricingItem {
  questionId: string;
  label: string;
  quantity: number;
  unitPrice: number;
  total: number;
  isAddOn: boolean;
}

export interface PhasePricing {
  phaseId: string;
  phaseName: string;
  items: PricingItem[];
  subtotal: number;
}

export interface OngoingCosts {
  hosting: {
    package: string;
    monthly: number;
    annual: number;
  };
  maintenance: {
    package: string;
    monthly: number;
    annual: number;
  };
  staging?: {
    monthly: number;
    annual: number;
  };
  totalMonthly: number;
  totalAnnual: number;
}

export interface Quote {
  projectType: ProjectType;
  phases: PhasePricing[];
  addOns: PricingItem[];
  ongoingCosts: OngoingCosts;
  total: number;
  timeline: string;
  createdAt: Date;
  // Extended fields for saved quotes
  id?: string;
  companyName?: string;
  companyXeroId?: string;
  projectName?: string;
  businessUnit?: string;
  targetCompletionDate?: string;
  status?: QuoteStatus;
}

export interface SavedQuote {
  id: string;
  userId: string;
  companyName: string;
  companyXeroId?: string;
  projectName: string;
  businessUnit?: string;
  targetCompletionDate?: string;
  quoteData: Quote;
  status: QuoteStatus;
  createdAt: string;
  updatedAt: string;
  acceptedAt?: string;
  acceptedBy?: string;
}

export interface XeroCompany {
  ContactID: string;
  Name: string;
  ContactStatus?: string;
  EmailAddress?: string;
}
