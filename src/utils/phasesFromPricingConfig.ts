import { Phase, Question, QuestionType } from '../types/quote';
import { PricingConfig, PricingItem } from './pricingConfig';

/**
 * Builds phases and questions from the pricing config (Google Sheet)
 * This makes the Google Sheet the single source of truth for all questions
 */
export function buildPhasesFromPricingConfig(config: PricingConfig): Phase[] {
  // Group items by phase
  const phaseMap = new Map<string, PricingItem[]>();
  
  for (const item of config.items) {
    const phaseName = item.phase.trim();
    if (!phaseMap.has(phaseName)) {
      phaseMap.set(phaseName, []);
    }
    phaseMap.get(phaseName)!.push(item);
  }
  
  // Convert to phases array
  const phases: Phase[] = [];
  let phaseOrder = 0;
  
  // Preserve order from spreadsheet by tracking first occurrence of each phase
  const phaseOrderMap = new Map<string, number>();
  let currentOrder = 0;
  
  for (const item of config.items) {
    const phaseName = item.phase.trim();
    if (!phaseOrderMap.has(phaseName)) {
      phaseOrderMap.set(phaseName, currentOrder++);
    }
  }
  
  // Sort phases by their first occurrence order in the spreadsheet
  const sortedPhaseNames = Array.from(phaseMap.keys()).sort((a, b) => {
    const orderA = phaseOrderMap.get(a) ?? Infinity;
    const orderB = phaseOrderMap.get(b) ?? Infinity;
    return orderA - orderB;
  });
  
  for (const phaseName of sortedPhaseNames) {
    phaseOrder++;
    const items = phaseMap.get(phaseName)!;
    
    const phase: Phase = {
      id: `phase-${phaseOrder}`,
      name: phaseName,
      order: phaseOrder,
      isRequired: phaseOrder === 1, // Discovery is always required
      questions: items.map(item => buildQuestionFromPricingItem(item, phaseOrder))
    };
    
    phases.push(phase);
  }
  
  return phases;
}

/**
 * Builds a Question object from a PricingItem
 */
function buildQuestionFromPricingItem(item: PricingItem, phaseOrder: number): Question {
  const questionId = `phase-${phaseOrder}-${item.item.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  
  // Determine question type
  let questionType: QuestionType = item.questionType || detectQuestionTypeFromTierValues(item);
  
  // Build tier values - preserve numeric values for number/range questions
  let tierValues: { essential: string; refresh: string; transformation: string };
  if (questionType === 'number' || questionType === 'range') {
    // For numeric questions, use the actual numeric values
    tierValues = {
      essential: item.essential.toString(),
      refresh: item.refresh.toString(),
      transformation: item.transformation.toString()
    };
  } else {
    // For binary/select questions, use ✅/❌
    tierValues = {
      essential: item.essential > 0 ? '✅' : '❌',
      refresh: item.refresh > 0 ? '✅' : '❌',
      transformation: item.transformation > 0 ? '✅' : '❌'
    };
  }
  
  const question: Question = {
    id: questionId,
    label: item.item,
    type: questionType,
    phaseId: `phase-${phaseOrder}`,
    tierValues,
    helpText: item.description,
    min: item.min,
    max: item.max
  };
  
  // Set type-specific properties
  switch (questionType) {
    case 'binary':
      question.defaultValue = item.essential > 0;
      break;
      
    case 'select':
      if (item.options) {
        const optionLabels = item.options.split(',').map(opt => opt.trim()).filter(opt => opt);
        question.options = optionLabels.map((label, index) => ({
          value: `option-${index + 1}`,
          label: label,
          tier: undefined,
          price: undefined,
          isAddOn: false
        }));
        question.defaultValue = question.options[0]?.value || 'option-1';
      } else {
        // Fallback: create options from tier values
        question.options = [];
        if (item.essential > 0) {
          question.options.push({
            value: 'essential',
            label: 'Essential',
            tier: 'essential',
            price: item.unitCost,
            isAddOn: false
          });
        }
        if (item.refresh > 0) {
          question.options.push({
            value: 'refresh',
            label: 'Refresh',
            tier: 'refresh',
            price: item.unitCost,
            isAddOn: false
          });
        }
        if (item.transformation > 0) {
          question.options.push({
            value: 'transformation',
            label: 'Transformation',
            tier: 'transformation',
            price: item.unitCost,
            isAddOn: false
          });
        }
        question.defaultValue = question.options[0]?.value || 'essential';
      }
      break;
      
    case 'number':
    case 'range':
      // Use tier values to determine default
      const numValue = item.essential > 0 ? item.essential :
                      item.refresh > 0 ? item.refresh :
                      item.transformation > 0 ? item.transformation : 0;
      question.defaultValue = numValue;
      
      // If ranges are defined, use them for max
      if (item.ranges && item.ranges.length > 0) {
        const maxRange = item.ranges[item.ranges.length - 1];
        if (maxRange.max !== null) {
          question.max = maxRange.max;
        }
      }
      
      // Ensure min is 0 if not specified
      if (question.min === undefined) {
        question.min = 0;
      }
      break;
      
    case 'text':
      question.defaultValue = '';
      break;
  }
  
  return question;
}

/**
 * Detects question type from tier values if not explicitly set
 */
function detectQuestionTypeFromTierValues(item: PricingItem): QuestionType {
  // If options are specified, it's a select
  if (item.options) {
    return 'select';
  }
  
  // If ranges are specified, it's a range
  if (item.ranges && item.ranges.length > 0) {
    return 'range';
  }
  
  // If min/max are specified, it's a number or range
  if (item.min !== undefined || item.max !== undefined) {
    return 'number';
  }
  
  // Check tier values to determine type
  const essential = item.essential;
  const refresh = item.refresh;
  const transformation = item.transformation;
  
  // If all are 0 or 1, it's binary
  const allBinary = [essential, refresh, transformation].every(v => v === 0 || v === 1);
  if (allBinary) {
    return 'binary';
  }
  
  // If values are numeric and different, it might be a number/range
  if (essential > 1 || refresh > 1 || transformation > 1) {
    return 'number';
  }
  
  // Default to binary
  return 'binary';
}

