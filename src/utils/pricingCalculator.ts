import { Answer, Question, Phase, PricingItem, PhasePricing, OngoingCosts, PricingTier } from '../types/quote';
import { PricingConfig, findPricingItem, calculateItemPrice, getUnitPriceForQuantity, setGlobalPricingConfig } from './pricingConfig';

// Base pricing structure - these would typically come from a pricing config
const TIER_BASE_PRICES: Record<PricingTier, number> = {
  essential: 8000,
  refresh: 20000,
  transformation: 60000
};

// Global pricing config - will be loaded from Google Sheets
let pricingConfig: PricingConfig | null = null;

/**
 * Sets the pricing configuration (loaded from Google Sheets)
 */
export function setPricingConfig(config: PricingConfig) {
  pricingConfig = config;
  setGlobalPricingConfig(config);
}

/**
 * Gets the current pricing configuration
 */
export function getPricingConfig(): PricingConfig | null {
  return pricingConfig;
}

/**
 * Calculate pricing for a single question based on its answer
 */
function calculateQuestionPrice(
  question: Question,
  answer: Answer,
  phaseName: string,
  tier?: PricingTier
): number {
  // Try to find pricing from config first
  if (pricingConfig) {
    const pricingItem = findPricingItem(pricingConfig, phaseName, question.label);
    
    if (pricingItem) {
      // Binary questions
      if (question.type === 'binary') {
        if (!answer.value) return 0;
        return pricingItem.unitCost;
      }
      
      // Number/range questions - use range-based pricing if available
      if (question.type === 'number' || question.type === 'range') {
        const quantity = typeof answer.value === 'number' ? answer.value : parseInt(String(answer.value), 10) || 0;
        if (quantity === 0) return 0;
        // Get unit price based on quantity (handles ranges)
        return getUnitPriceForQuantity(pricingItem, quantity);
      }
      
      // Select questions - use unit cost
      if (question.type === 'select') {
        return pricingItem.unitCost;
      }
      
      // Text questions - use unit cost
      if (question.type === 'text') {
        return pricingItem.unitCost;
      }
    }
  }
  
  // Fallback to old pricing logic if config not available
  // If question has explicit pricing in options
  if (question.options) {
    const selectedOption = question.options.find(opt => opt.value === answer.value);
    if (selectedOption?.price) {
      return selectedOption.price;
    }
    
    // If tier is specified, use tier-based pricing
    if (selectedOption?.tier && tier) {
      return TIER_BASE_PRICES[selectedOption.tier] / 100; // Rough estimate per item
    }
  }
  
  // Binary questions - check if included
  if (question.type === 'binary') {
    if (!answer.value) return 0;
    
    // Estimate based on tier
    if (tier) {
      return TIER_BASE_PRICES[tier] / 200; // Rough estimate
    }
    return 100; // Default binary item price
  }
  
  // Number/range questions - multiply by quantity
  if (question.type === 'number' || question.type === 'range') {
    const quantity = typeof answer.value === 'number' ? answer.value : parseInt(String(answer.value), 10) || 0;
    return quantity * 100; // Default multiplier
  }
  
  // Select questions
  if (question.type === 'select') {
    const selectedOption = question.options?.find(opt => opt.value === answer.value);
    if (selectedOption?.tier) {
      return TIER_BASE_PRICES[selectedOption.tier] / 150;
    }
    return 200;
  }
  
  return 0;
}

/**
 * Determine pricing tier from answers
 */
export function determineTier(answers: Record<string, Answer>, phases: Phase[]): PricingTier {
  // Count how many "transformation" level items are selected
  let transformationCount = 0;
  let refreshCount = 0;
  let essentialCount = 0;
  
  for (const phase of phases) {
    for (const question of phase.questions) {
      const answer = answers[question.id];
      if (!answer) continue;
      
      if (question.options) {
        const selectedOption = question.options.find(opt => opt.value === answer.value);
        if (selectedOption?.tier === 'transformation') transformationCount++;
        else if (selectedOption?.tier === 'refresh') refreshCount++;
        else if (selectedOption?.tier === 'essential') essentialCount++;
      }
    }
  }
  
  // Determine tier based on selections
  if (transformationCount > refreshCount && transformationCount > essentialCount) {
    return 'transformation';
  }
  if (refreshCount > essentialCount) {
    return 'refresh';
  }
  return 'essential';
}

/**
 * Calculate pricing for all phases
 */
export function calculatePricing(
  answers: Record<string, Answer>,
  phases: Phase[],
  selectedPhaseIds: string[]
): PhasePricing[] {
  const tier = determineTier(answers, phases);
  const phasePricing: PhasePricing[] = [];
  
  for (const phase of phases) {
    if (!selectedPhaseIds.includes(phase.id)) continue;
    
    const items: PricingItem[] = [];
    
    for (const question of phase.questions) {
      const answer = answers[question.id];
      if (!answer) continue;
      
      // Skip if binary and not selected
      if (question.type === 'binary' && !answer.value) continue;
      
      // Only process questions that exist in pricing config
      if (pricingConfig) {
        const pricingItem = findPricingItem(pricingConfig, phase.name, question.label);
        if (!pricingItem) {
          // Skip questions not in pricing config
          continue;
        }
      }
      
      const unitPrice = calculateQuestionPrice(question, answer, phase.name, tier);
      const quantity = typeof answer.value === 'number' 
        ? answer.value 
        : (question.type === 'binary' ? 1 : (parseInt(String(answer.value), 10) || 1));
      
      // Calculate total price
      let total: number;
      let displayUnitPrice: number;
      
      if (pricingConfig) {
        const pricingItem = findPricingItem(pricingConfig, phase.name, question.label);
        if (pricingItem?.ranges && pricingItem.ranges.length > 0) {
          // Range-based pricing - calculateItemPrice returns total for all units
          total = calculateItemPrice(pricingItem, quantity);
          displayUnitPrice = quantity > 0 ? total / quantity : 0; // Average unit price for display
        } else {
          // Unit pricing - unitPrice is already the per-unit cost
          total = unitPrice * quantity;
          displayUnitPrice = unitPrice;
        }
      } else {
        total = unitPrice * quantity;
        displayUnitPrice = unitPrice;
      }
      
      if (total > 0) {
        items.push({
          questionId: question.id,
          label: question.label,
          quantity,
          unitPrice: displayUnitPrice,
          total,
          isAddOn: question.isAddOn || false
        });
      }
    }
    
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    
    phasePricing.push({
      phaseId: phase.id,
      phaseName: phase.name,
      items,
      subtotal
    });
  }
  
  return phasePricing;
}

/**
 * Calculate ongoing costs based on tier
 */
export function calculateOngoingCosts(tier: PricingTier): OngoingCosts {
  const costs: Record<PricingTier, OngoingCosts> = {
    essential: {
      hosting: {
        package: 'Bronze',
        monthly: 120,
        annual: 1440
      },
      maintenance: {
        package: 'Essential',
        monthly: 280,
        annual: 3360
      },
      totalMonthly: 400,
      totalAnnual: 4800
    },
    refresh: {
      hosting: {
        package: 'Silver',
        monthly: 180,
        annual: 2160
      },
      maintenance: {
        package: 'Advanced',
        monthly: 395,
        annual: 4740
      },
      staging: {
        monthly: 30,
        annual: 360
      },
      totalMonthly: 605,
      totalAnnual: 7260
    },
    transformation: {
      hosting: {
        package: 'Gold',
        monthly: 240,
        annual: 2880
      },
      maintenance: {
        package: 'Premium',
        monthly: 510,
        annual: 6120
      },
      staging: {
        monthly: 30,
        annual: 360
      },
      totalMonthly: 780,
      totalAnnual: 9360
    }
  };
  
  return costs[tier];
}

/**
 * Get timeline estimate based on tier
 */
export function getTimeline(tier: PricingTier): string {
  const timelines: Record<PricingTier, string> = {
    essential: '4-6 weeks',
    refresh: '8-10 weeks',
    transformation: '14-18 weeks'
  };
  
  return timelines[tier];
}

