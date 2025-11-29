import { Question } from '../types/quote';
import { getPricingConfig, findPricingItem } from './pricingConfig';

/**
 * Applies question configuration from pricing config to a question
 * This allows the spreadsheet to override question types, options, and validation
 */
export function applyQuestionConfig(question: Question, phaseName: string): Question {
  const pricingConfig = getPricingConfig();
  if (!pricingConfig) {
    // Don't log this - it's expected on initial render before config loads
    return question;
  }
  
  // Normalize phase name for matching (handle "DISCOVERY" vs "Discovery")
  const normalizedPhaseName = phaseName.trim();
  const pricingItem = findPricingItem(pricingConfig, normalizedPhaseName, question.label);
  if (!pricingItem) {
    // Only log if we're in development mode and there's actually a mismatch
    // (not just missing items from the spreadsheet)
    if (import.meta.env.DEV) {
      // Check if there are any items in this phase at all
      const phaseItems = pricingConfig.items.filter(item => 
        item.phase.toLowerCase().trim() === normalizedPhaseName.toLowerCase().trim()
      );
      if (phaseItems.length > 0) {
        // Phase exists but item doesn't match - this might be a real issue
        // Only log if it's not a common pattern (e.g., items that might not be in pricing config)
        console.debug(`[QuestionConfig] No matching pricing item for phase: "${phaseName}", item: "${question.label}"`);
      }
    }
    return question;
  }
  
  // Only log in dev mode and only if config actually changed something
  if (import.meta.env.DEV && (pricingItem.questionType || pricingItem.options || pricingItem.min !== undefined || pricingItem.max !== undefined)) {
    console.debug(`[QuestionConfig] Applied config to: ${question.label}`, {
      questionType: pricingItem.questionType,
      options: pricingItem.options,
      min: pricingItem.min,
      max: pricingItem.max
    });
  }
  
  const updatedQuestion = { ...question };
  
  // Override question type if specified
  if (pricingItem.questionType) {
    updatedQuestion.type = pricingItem.questionType;
  }
  
  // Override options if specified (for select questions)
  if (pricingItem.options && (pricingItem.questionType === 'select' || updatedQuestion.type === 'select')) {
    const optionLabels = pricingItem.options.split(',').map(opt => opt.trim()).filter(opt => opt);
    if (optionLabels.length > 0) {
      updatedQuestion.options = optionLabels.map((label, index) => ({
        value: `option-${index + 1}`,
        label: label,
        tier: undefined,
        price: undefined,
        isAddOn: false
      }));
      // Set default value to first option if not already set
      if (!updatedQuestion.defaultValue) {
        updatedQuestion.defaultValue = updatedQuestion.options[0].value;
      }
    }
  }
  
  // Override min/max if specified
  if (pricingItem.min !== undefined) {
    updatedQuestion.min = pricingItem.min;
  }
  if (pricingItem.max !== undefined) {
    updatedQuestion.max = pricingItem.max;
  }
  
  // Store validation rules
  if (pricingItem.validation) {
    updatedQuestion.helpText = pricingItem.validation;
  }
  
  return updatedQuestion;
}

