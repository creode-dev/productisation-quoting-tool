import { Phase, PricingTier, Answer } from '../types/quote';

/**
 * Populates answers based on the selected tier
 * Maps CSV values to form answers based on Essential/Refresh/Transformation columns
 */
export function populateAnswersFromTier(
  phases: Phase[],
  tier: PricingTier,
  csvData: Map<string, { essential: string; refresh: string; transformation: string }>
): Record<string, Answer> {
  const answers: Record<string, Answer> = {};
  
  phases.forEach((phase) => {
    phase.questions.forEach((question) => {
      const csvRow = csvData.get(question.label);
      if (!csvRow) return;
      
      let tierValue: string;
      switch (tier) {
        case 'essential':
          tierValue = csvRow.essential;
          break;
        case 'refresh':
          tierValue = csvRow.refresh;
          break;
        case 'transformation':
          tierValue = csvRow.transformation;
          break;
      }
      
      if (!tierValue || tierValue.trim() === '') return;
      
      // Convert CSV value to appropriate answer type
      const answerValue = convertCsvValueToAnswer(tierValue, question);
      if (answerValue !== null && answerValue !== undefined) {
        answers[question.id] = { questionId: question.id, value: answerValue };
      }
    });
  });
  
  return answers;
}

function convertCsvValueToAnswer(
  csvValue: string,
  question: Phase['questions'][0]
): string | number | boolean | null {
  // Handle binary (✅/❌)
  if (csvValue === '✅') {
    return true;
  }
  if (csvValue === '❌') {
    return false;
  }
  
  // Handle numbers
  const numberMatch = csvValue.match(/^(\d+)$/);
  if (numberMatch) {
    return parseInt(numberMatch[1], 10);
  }
  
  // Handle ranges (take the first number or max)
  const rangeMatch = csvValue.match(/^(\d+)-(\d+)$/);
  if (rangeMatch) {
    // For tier population, use the first number (min)
    return parseInt(rangeMatch[1], 10);
  }
  
  // Handle "Up to X"
  const upToMatch = csvValue.match(/^Up to (\d+)$/i);
  if (upToMatch) {
    return parseInt(upToMatch[1], 10);
  }
  
  // Handle select options - find matching option
  if (question.type === 'select' && question.options) {
    // Try to find option by label match
    const matchingOption = question.options.find(opt => 
      csvValue.includes(opt.label) || opt.label.includes(csvValue)
    );
    if (matchingOption) {
      return matchingOption.value;
    }
    
    // Try to find by tier
    const tierOption = question.options.find(opt => opt.tier === 'essential');
    if (tierOption) {
      return tierOption.value;
    }
  }
  
  // For text, return cleaned value
  const cleaned = csvValue
    .replace(/^✅\s*/, '')
    .replace(/^❌\s*/, '')
    .replace(/\s*\([^)]*\)/g, '')
    .trim();
  
  return cleaned || null;
}

