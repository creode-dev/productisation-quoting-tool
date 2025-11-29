import { QuestionType, QuestionOption } from '../types/quote';

/**
 * Detects the question type based on CSV values
 */
export function detectQuestionType(
  essential: string,
  refresh: string,
  transformation: string
): QuestionType {
  // Check for binary (✅/❌)
  const isBinary = 
    (essential === '✅' || essential === '❌') &&
    (refresh === '✅' || refresh === '❌') &&
    (transformation === '✅' || transformation === '❌');
  
  if (isBinary) {
    return 'binary';
  }

  // Check for numeric values
  const hasNumbers = 
    /\d+/.test(essential) || 
    /\d+/.test(refresh) || 
    /\d+/.test(transformation);
  
  if (hasNumbers) {
    // Check if it's a range (e.g., "1-2", "4-5")
    const isRange = /^\d+-\d+$/.test(essential) || 
                    /^\d+-\d+$/.test(refresh) || 
                    /^\d+-\d+$/.test(transformation);
    
    if (isRange) {
      return 'range';
    }
    
    // Check for "Up to X" pattern
    const isUpTo = /^Up to \d+$/i.test(essential) || 
                   /^Up to \d+$/i.test(refresh) || 
                   /^Up to \d+$/i.test(transformation);
    
    if (isUpTo) {
      return 'range';
    }
    
    // Single numbers
    if (/^\d+$/.test(essential) || /^\d+$/.test(refresh) || /^\d+$/.test(transformation)) {
      return 'number';
    }
  }

  // Check for select options (text descriptions)
  if (essential && refresh && transformation && 
      essential !== refresh && refresh !== transformation) {
    return 'select';
  }

  // Default to text
  return 'text';
}

/**
 * Extracts options from CSV values for select-type questions
 */
export function extractSelectOptions(
  essential: string,
  refresh: string,
  transformation: string
): QuestionOption[] {
  const options: QuestionOption[] = [];
  
  if (essential && essential !== '❌') {
    options.push({
      value: 'essential',
      label: cleanValue(essential),
      tier: 'essential'
    });
  }
  
  if (refresh && refresh !== '❌') {
    options.push({
      value: 'refresh',
      label: cleanValue(refresh),
      tier: 'refresh'
    });
  }
  
  if (transformation && transformation !== '❌') {
    options.push({
      value: 'transformation',
      label: cleanValue(transformation),
      tier: 'transformation'
    });
  }
  
  return options;
}

/**
 * Cleans value by removing checkmarks and extra formatting
 */
function cleanValue(value: string): string {
  return value
    .replace(/^✅\s*/, '')
    .replace(/^❌\s*/, '')
    .trim();
}

/**
 * Extracts numeric range from value
 */
export function extractRange(value: string): { min: number; max: number } | null {
  // Handle "1-2" format
  const rangeMatch = value.match(/^(\d+)-(\d+)$/);
  if (rangeMatch) {
    return {
      min: parseInt(rangeMatch[1], 10),
      max: parseInt(rangeMatch[2], 10)
    };
  }
  
  // Handle "Up to X" format
  const upToMatch = value.match(/^Up to (\d+)$/i);
  if (upToMatch) {
    return {
      min: 0,
      max: parseInt(upToMatch[1], 10)
    };
  }
  
  // Handle single number
  const singleMatch = value.match(/^(\d+)$/);
  if (singleMatch) {
    const num = parseInt(singleMatch[1], 10);
    return { min: num, max: num };
  }
  
  return null;
}

/**
 * Checks if a value indicates an add-on
 */
export function isAddOn(value: string): boolean {
  return value.toLowerCase().includes('add-on') || 
         value.toLowerCase().includes('(add-on');
}

