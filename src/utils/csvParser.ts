import Papa from 'papaparse';
import { Phase, Question } from '../types/quote';
import { detectQuestionType, extractSelectOptions, extractRange, isAddOn } from './questionTypes';

interface CSVRow {
  OUTPUT: string;
  'ESSENTIAL (£8k+)': string;
  'REFRESH (£20k+)': string;
  'TRANSFORMATION (£60k+)': string;
}

export async function parseQuestionnaireCSV(filePath: string): Promise<Phase[]> {
  const response = await fetch(filePath);
  const text = await response.text();
  
  return new Promise((resolve, reject) => {
    Papa.parse<CSVRow>(text, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const phases = parsePhases(results.data);
          resolve(phases);
        } catch (error) {
          reject(error);
        }
      },
      error: (error: Error) => {
        reject(error);
      }
    });
  });
}

function parsePhases(rows: CSVRow[]): Phase[] {
  const phases: Phase[] = [];
  let currentPhase: Phase | null = null;
  let phaseOrder = 0;

  for (const row of rows) {
    const output = row.OUTPUT?.trim() || '';
    
    // Skip empty rows
    if (!output) continue;
    
    // Check if this is a phase header
    if (output.startsWith('PHASE')) {
      // Save previous phase if exists
      if (currentPhase) {
        phases.push(currentPhase);
      }
      
      // Extract phase name
      const phaseMatch = output.match(/PHASE \d+: (.+)/);
      if (phaseMatch) {
        const phaseName = phaseMatch[1].trim();
        phaseOrder++;
        
        currentPhase = {
          id: `phase-${phaseOrder}`,
          name: phaseName,
          order: phaseOrder,
          isRequired: phaseOrder === 1, // Discovery is always required
          questions: []
        };
      }
      continue;
    }
    
    // Skip subtotal rows and other metadata
    if (output.includes('Subtotal') || 
        output.includes('TOTAL') || 
        output.includes('ONGOING') ||
        output === 'TIMELINE' ||
        output === 'OUTPUT') {
      continue;
    }
    
    // Create question from row
    if (currentPhase) {
      const question = createQuestionFromRow(
        output,
        row['ESSENTIAL (£8k+)'] || '',
        row['REFRESH (£20k+)'] || '',
        row['TRANSFORMATION (£60k+)'] || '',
        currentPhase.id
      );
      
      if (question) {
        currentPhase.questions.push(question);
      }
    }
  }
  
  // Add last phase
  if (currentPhase) {
    phases.push(currentPhase);
  }
  
  return phases;
}

function createQuestionFromRow(
  label: string,
  essential: string,
  refresh: string,
  transformation: string,
  phaseId: string
): Question | null {
  // Generate unique ID from label
  const id = `${phaseId}-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  
  // Detect question type
  const type = detectQuestionType(essential, refresh, transformation);
  
  // Check if it's an add-on
  const addOn = isAddOn(essential) || isAddOn(refresh) || isAddOn(transformation);
  
  const question: Question = {
    id,
    label,
    type,
    phaseId,
    isAddOn: addOn,
    tierValues: {
      essential: essential || '',
      refresh: refresh || '',
      transformation: transformation || ''
    }
  };
  
  // Add type-specific properties
  switch (type) {
    case 'binary':
      question.defaultValue = essential === '✅';
      break;
      
    case 'select':
      question.options = extractSelectOptions(essential, refresh, transformation);
      question.defaultValue = question.options[0]?.value || 'essential';
      break;
      
    case 'number':
      // Extract numeric value (take first available)
      const numValue = extractNumericValue(essential) || 
                      extractNumericValue(refresh) || 
                      extractNumericValue(transformation);
      if (numValue !== null) {
        question.defaultValue = numValue;
        question.min = 0;
        question.max = 100;
      }
      break;
      
    case 'range':
      const range = extractRange(essential) || 
                   extractRange(refresh) || 
                   extractRange(transformation);
      if (range) {
        // Always allow 0 as minimum, but use the extracted max
        question.min = 0;
        question.max = range.max;
        question.defaultValue = range.min; // Default to the original min from CSV
        question.step = 1;
      }
      break;
      
    case 'text':
      question.defaultValue = cleanValue(essential) || cleanValue(refresh) || cleanValue(transformation);
      break;
  }
  
  return question;
}

function extractNumericValue(value: string): number | null {
  const match = value.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

function cleanValue(value: string): string {
  return value
    .replace(/^✅\s*/, '')
    .replace(/^❌\s*/, '')
    .replace(/\s*\([^)]*\)/g, '') // Remove parenthetical notes
    .trim();
}

