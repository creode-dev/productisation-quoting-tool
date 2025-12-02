import { Quote, Answer, Phase, ProjectType } from '../types/quote';
import { calculatePricing, calculateOngoingCosts, getTimeline, determineTier } from './pricingCalculator';

export function buildQuote(
  projectType: ProjectType,
  answers: Record<string, Answer>,
  phases: Phase[],
  selectedPhaseIds: string[],
  sharedVariables?: Record<string, number | string | boolean>
): Quote {
  const tier = determineTier(answers, phases);
  const phasePricing = calculatePricing(answers, phases, selectedPhaseIds, sharedVariables);
  
  // Separate add-ons from regular items
  const addOns = phasePricing
    .flatMap(phase => phase.items.filter(item => item.isAddOn))
    .map(item => ({
      ...item,
      phaseId: phasePricing.find(p => p.items.includes(item))?.phaseId || ''
    }));
  
  // Remove add-ons from phase pricing
  phasePricing.forEach(phase => {
    phase.items = phase.items.filter(item => !item.isAddOn);
    phase.subtotal = phase.items.reduce((sum, item) => sum + item.total, 0);
  });
  
  const ongoingCosts = calculateOngoingCosts(tier);
  const timeline = getTimeline(tier);
  
  // Calculate total (excluding ongoing costs)
  const projectTotal = phasePricing.reduce((sum, phase) => sum + phase.subtotal, 0) +
                      addOns.reduce((sum, item) => sum + item.total, 0);
  
  return {
    projectType,
    phases: phasePricing,
    addOns,
    ongoingCosts,
    total: projectTotal,
    timeline,
    createdAt: new Date()
  };
}

