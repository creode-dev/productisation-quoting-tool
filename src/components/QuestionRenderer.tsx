import { useState, useEffect } from 'react';
import { Question, Answer } from '../types/quote';
import { getPricingConfig, findPricingItem, onPricingConfigUpdate, calculateItemPrice } from '../utils/pricingConfig';
import { applyQuestionConfig } from '../utils/questionConfig';
import { useQuoteStore } from '../store/quoteStore';
import { SharedVariableEditor } from './SharedVariableEditor';

interface QuestionRendererProps {
  question: Question;
  answer?: Answer;
  onChange: (value: string | number | boolean) => void;
  phaseName?: string; // Phase name for looking up pricing config
  showPrices?: boolean; // Whether to show prices next to questions
}

// Format price with commas and no decimals
function formatPrice(price: number): string {
  return Math.round(price).toLocaleString('en-GB');
}

// Calculate price for a question based on current answer
function calculateQuestionPrice(
  question: Question,
  answer: Answer | undefined,
  phaseName: string | undefined
): number {
  if (!answer || !phaseName) return 0;
  
  const pricingConfig = getPricingConfig();
  if (!pricingConfig) return 0;
  
  const pricingItem = findPricingItem(pricingConfig, phaseName, question.label);
  if (!pricingItem) return 0;
  
  // Binary questions
  if (question.type === 'binary') {
    if (!answer.value) return 0;
    return pricingItem.unitCost;
  }
  
  // Number/range questions
  if (question.type === 'number' || question.type === 'range') {
    const quantity = typeof answer.value === 'number' ? answer.value : parseInt(String(answer.value), 10) || 0;
    if (quantity === 0) return 0;
    
    // Use range-based pricing if available
    if (pricingItem.ranges && pricingItem.ranges.length > 0) {
      return calculateItemPrice(pricingItem, quantity);
    }
    
    return pricingItem.unitCost * quantity;
  }
  
  // Select questions
  if (question.type === 'select') {
    return pricingItem.unitCost;
  }
  
  // Text questions
  if (question.type === 'text') {
    return pricingItem.unitCost;
  }
  
  return 0;
}

export function QuestionRenderer({ question, answer, onChange, phaseName, showPrices = false }: QuestionRendererProps) {
  // Force re-render when pricing config updates
  const [, forceUpdate] = useState(0);
  const { sharedVariables, setSharedVariable } = useQuoteStore();
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  
  useEffect(() => {
    const unsubscribe = onPricingConfigUpdate(() => {
      forceUpdate(prev => prev + 1);
    });
    return unsubscribe;
  }, []);
  
  // Questions are now built directly from pricing config, so they're already configured
  // But we can still apply any runtime updates if needed
  const configuredQuestion = phaseName ? applyQuestionConfig(question, phaseName) : question;
  
  // Check if question references a shared variable
  const sharedVarName = question.referencesSharedVariable || (question.isSharedVariable ? question.sharedVariableName : undefined);
  const sharedVarValue = sharedVarName ? sharedVariables[sharedVarName] : undefined;
  const isSharedVarReference = !!question.referencesSharedVariable;
  const isSharedVarDefinition = !!question.isSharedVariable;
  const hasSharedVarValue = sharedVarValue !== undefined;
  
  // Determine the value to display/use
  let value: string | number | boolean | undefined;
  if (isSharedVarReference && hasSharedVarValue) {
    // Use shared variable value (question references a shared variable)
    value = sharedVarValue;
  } else if (isSharedVarReference && !hasSharedVarValue) {
    // Shared variable not set yet - don't show this question (or show a message)
    // For now, we'll skip rendering if the variable isn't set
    return null;
  } else if (isSharedVarDefinition && hasSharedVarValue) {
    // Question defines a shared variable and it's already set - use shared value
    value = sharedVarValue;
  } else {
    // Regular question or shared variable definition not yet set - use answer or default
    value = answer?.value ?? configuredQuestion.defaultValue;
  }
  
  const handleEditSharedVariable = () => {
    setIsEditorOpen(true);
  };
  
  const handleSaveSharedVariable = (newValue: number | string | boolean) => {
    if (sharedVarName) {
      setSharedVariable(sharedVarName, newValue);
    }
    setIsEditorOpen(false);
  };

  switch (configuredQuestion.type) {
    case 'binary': {
      // Calculate price - show unit cost if checked, or 0 if unchecked
      const pricingConfig = getPricingConfig();
      const pricingItem = pricingConfig && phaseName
        ? findPricingItem(pricingConfig, phaseName, configuredQuestion.label)
        : null;
      const unitPrice = pricingItem?.unitCost || 0;
      const price = showPrices ? (value === true ? unitPrice : 0) : 0;
      
      return (
        <div className="py-3">
          <div className="flex items-start">
            <div className="flex-1 min-w-0 pr-4">
              <label 
                htmlFor={configuredQuestion.id} 
                className="text-lg font-semibold text-gray-900 cursor-pointer block"
              >
                {configuredQuestion.label}
              </label>
              {configuredQuestion.helpText && (
                <p className="mt-2 text-base text-gray-600">{configuredQuestion.helpText}</p>
              )}
            </div>
            <div className="flex items-center gap-4 flex-shrink-0" style={{ width: '200px', justifyContent: 'flex-end' }}>
              <div className="pt-0.5" style={{ width: '20px', display: 'flex', justifyContent: 'center' }}>
                <input
                  type="checkbox"
                  id={configuredQuestion.id}
                  checked={value === true}
                  onChange={(e) => onChange(e.target.checked)}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                />
              </div>
              {showPrices && (
                <div className="text-right" style={{ minWidth: '80px' }}>
                  <div className="text-lg font-semibold text-gray-900">£{formatPrice(price)}</div>
                </div>
              )}
              {!showPrices && <div style={{ minWidth: '80px' }}></div>}
            </div>
          </div>
        </div>
      );
    }

    case 'number': {
      const min = configuredQuestion.min ?? 0;
      const max = configuredQuestion.max ?? 1000;
      const currentValue = typeof value === 'number' ? value : parseInt(String(value || min), 10);
      const [inputValue, setInputValue] = useState(String(currentValue));
      const [error, setError] = useState<string | null>(null);

      // Sync input value when external value changes
      useEffect(() => {
        const newValue = typeof value === 'number' ? value : parseInt(String(value || min), 10);
        setInputValue(String(newValue));
      }, [value, min]);

      const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputVal = e.target.value;
        setInputValue(inputVal);
        
        // Allow empty input while typing
        if (inputVal === '') {
          setError(null);
          return;
        }
        
        // Validate it's a number
        const numValue = parseInt(inputVal, 10);
        if (isNaN(numValue)) {
          setError('Please enter a valid number');
          return;
        }
        
        // Validate range if specified
        if (min !== undefined && numValue < min) {
          setError(`Minimum value is ${min}`);
          return;
        }
        
        if (max !== undefined && numValue > max) {
          setError(`Maximum value is ${max}`);
          return;
        }
        
        // Valid input
        setError(null);
        onChange(numValue);
      };

      const handleBlur = () => {
        // On blur, ensure value is within range
        const numValue = parseInt(inputValue, 10);
        if (isNaN(numValue) || (min !== undefined && numValue < min)) {
          setInputValue(String(min));
          onChange(min);
          setError(null);
        } else if (max !== undefined && numValue > max) {
          setInputValue(String(max));
          onChange(max);
          setError(null);
        }
      };

      const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          const currentNum = parseInt(inputValue, 10) || min;
          const newValue = Math.min(currentNum + 1, max);
          setInputValue(String(newValue));
          onChange(newValue);
          setError(null);
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          const currentNum = parseInt(inputValue, 10) || min;
          const newValue = Math.max(currentNum - 1, min);
          setInputValue(String(newValue));
          onChange(newValue);
          setError(null);
        }
      };

      // Create a temporary answer for price calculation
      const tempAnswer: Answer = { questionId: question.id, value: value };
      const price = showPrices ? calculateQuestionPrice(configuredQuestion, tempAnswer, phaseName) : 0;
      
      // If this is a shared variable reference, show read-only display with edit button
      if (isSharedVarReference && hasSharedVarValue) {
        return (
          <>
            <div className="py-3">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <label htmlFor={question.id} className="block text-lg font-semibold text-gray-900">
                      {question.label}
                    </label>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Shared
                    </span>
                  </div>
                  {configuredQuestion.helpText && (
                    <p className="mt-2 text-base text-gray-600">{configuredQuestion.helpText}</p>
                  )}
                </div>
                {showPrices && price > 0 && (
                  <div className="ml-4 text-right">
                    <div className="text-lg font-semibold text-gray-900">£{formatPrice(price)}</div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 px-4 py-3 text-base border-2 border-gray-300 rounded-lg bg-gray-50">
                  <span className="text-gray-900 font-medium">{currentValue}</span>
                </div>
                <button
                  type="button"
                  onClick={handleEditSharedVariable}
                  className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Edit
                </button>
              </div>
            </div>
            <SharedVariableEditor
              isOpen={isEditorOpen}
              onClose={() => setIsEditorOpen(false)}
              question={configuredQuestion}
              currentValue={sharedVarValue}
              onSave={handleSaveSharedVariable}
            />
          </>
        );
      }
      
      return (
        <div className="py-3">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <label htmlFor={question.id} className="block text-lg font-semibold text-gray-900">
                {question.label}
                {min !== undefined && max !== undefined && (
                  <span className="text-gray-600 font-normal ml-2 text-lg">
                    (Range: {min} - {max})
                  </span>
                )}
              </label>
              {configuredQuestion.helpText && (
                <p className="mt-2 text-base text-gray-600">{configuredQuestion.helpText}</p>
              )}
            </div>
            {showPrices && price > 0 && (
              <div className="ml-4 text-right">
                <div className="text-lg font-semibold text-gray-900">£{formatPrice(price)}</div>
              </div>
            )}
          </div>
          <input
            type="text"
            inputMode="numeric"
            id={configuredQuestion.id}
            value={inputValue}
            onChange={handleNumberChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className={`block w-full px-4 py-3 text-base border-2 rounded-lg shadow-sm focus:ring-2 focus:ring-opacity-50 transition-colors ${
              error
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            }`}
            placeholder={min !== undefined && max !== undefined 
              ? `Enter a number between ${min} and ${max}`
              : 'Enter a number'}
          />
          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
          {!error && min !== undefined && max !== undefined && (
            <p className="mt-2 text-sm text-gray-600">
              Enter a number between {min} and {max}
            </p>
          )}
        </div>
      );
    }

    case 'range': {
      const min = configuredQuestion.min ?? 0;
      const max = configuredQuestion.max ?? 100;
      const currentValue = typeof value === 'number' ? value : parseInt(String(value || min), 10);
      const [inputValue, setInputValue] = useState(String(currentValue));
      const [error, setError] = useState<string | null>(null);

      // Sync input value when external value changes
      useEffect(() => {
        const newValue = typeof value === 'number' ? value : parseInt(String(value || min), 10);
        setInputValue(String(newValue));
      }, [value, min]);

      const handleRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputVal = e.target.value;
        setInputValue(inputVal);
        
        // Allow empty input while typing
        if (inputVal === '') {
          setError(null);
          return;
        }
        
        // Validate it's a number
        const numValue = parseInt(inputVal, 10);
        if (isNaN(numValue)) {
          setError('Please enter a valid number');
          return;
        }
        
        // Validate range
        if (numValue < min) {
          setError(`Minimum value is ${min}`);
          return;
        }
        
        if (numValue > max) {
          setError(`Maximum value is ${max}`);
          return;
        }
        
        // Valid input
        setError(null);
        onChange(numValue);
      };

      const handleBlur = () => {
        // On blur, ensure value is within range
        const numValue = parseInt(inputValue, 10);
        if (isNaN(numValue) || numValue < min) {
          setInputValue(String(min));
          onChange(min);
          setError(null);
        } else if (numValue > max) {
          setInputValue(String(max));
          onChange(max);
          setError(null);
        }
      };

      const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          const currentNum = parseInt(inputValue, 10) || min;
          const newValue = Math.min(currentNum + 1, max);
          setInputValue(String(newValue));
          onChange(newValue);
          setError(null);
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          const currentNum = parseInt(inputValue, 10) || min;
          const newValue = Math.max(currentNum - 1, min);
          setInputValue(String(newValue));
          onChange(newValue);
          setError(null);
        }
      };

      // Create a temporary answer for price calculation
      const tempAnswer: Answer = { questionId: question.id, value: value };
      const price = showPrices ? calculateQuestionPrice(configuredQuestion, tempAnswer, phaseName) : 0;
      
      // If this is a shared variable reference, show read-only display with edit button
      if (isSharedVarReference && hasSharedVarValue) {
        return (
          <>
            <div className="py-3">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <label htmlFor={question.id} className="block text-lg font-semibold text-gray-900">
                      {question.label}
                    </label>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Shared
                    </span>
                  </div>
                  {configuredQuestion.helpText && (
                    <p className="mt-2 text-base text-gray-600">{configuredQuestion.helpText}</p>
                  )}
                </div>
                {showPrices && price > 0 && (
                  <div className="ml-4 text-right">
                    <div className="text-lg font-semibold text-gray-900">£{formatPrice(price)}</div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 px-4 py-3 text-base border-2 border-gray-300 rounded-lg bg-gray-50">
                  <span className="text-gray-900 font-medium">{currentValue}</span>
                </div>
                <button
                  type="button"
                  onClick={handleEditSharedVariable}
                  className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Edit
                </button>
              </div>
            </div>
            <SharedVariableEditor
              isOpen={isEditorOpen}
              onClose={() => setIsEditorOpen(false)}
              question={configuredQuestion}
              currentValue={sharedVarValue}
              onSave={handleSaveSharedVariable}
            />
          </>
        );
      }
      
      return (
        <div className="py-3">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <label htmlFor={question.id} className="block text-lg font-semibold text-gray-900">
                {question.label}
                {min !== undefined && max !== undefined && (
                  <span className="text-gray-600 font-normal ml-2 text-lg">
                    (Range: {min} - {max})
                  </span>
                )}
              </label>
              {configuredQuestion.helpText && (
                <p className="mt-2 text-base text-gray-600">{configuredQuestion.helpText}</p>
              )}
            </div>
            {showPrices && price > 0 && (
              <div className="ml-4 text-right">
                <div className="text-lg font-semibold text-gray-900">£{formatPrice(price)}</div>
              </div>
            )}
          </div>
          
          <input
            type="text"
            inputMode="numeric"
            id={configuredQuestion.id}
            value={inputValue}
            onChange={handleRangeChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            min={min}
            max={max}
            step={configuredQuestion.step ?? 1}
            className={`block w-full px-4 py-3 text-base border-2 rounded-lg shadow-sm focus:ring-2 focus:ring-opacity-50 transition-colors ${
              error
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            }`}
            placeholder={`Enter a number between ${min} and ${max}`}
          />
          
          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
          
          {!error && (
            <p className="mt-2 text-sm text-gray-600">
              Enter a number between {min} and {max}
            </p>
          )}
        </div>
      );
    }

    case 'select': {
      const price = showPrices ? calculateQuestionPrice(configuredQuestion, answer, phaseName) : 0;
      return (
        <div className="py-3">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <label className="block text-lg font-semibold text-gray-900">
                {configuredQuestion.label}
              </label>
              {configuredQuestion.helpText && (
                <p className="mt-2 text-base text-gray-600">{configuredQuestion.helpText}</p>
              )}
            </div>
            {showPrices && price > 0 && (
              <div className="ml-4 text-right">
                <div className="text-lg font-semibold text-gray-900">£{formatPrice(price)}</div>
              </div>
            )}
          </div>
          <div className="space-y-3">
            {configuredQuestion.options?.map((option) => {
              const isSelected = String(value || '') === option.value;
              return (
                <div
                  key={option.value}
                  className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => onChange(option.value)}
                >
                  <input
                    type="radio"
                    id={`${configuredQuestion.id}-${option.value}`}
                    name={configuredQuestion.id}
                    value={option.value}
                    checked={isSelected}
                    onChange={() => onChange(option.value)}
                    className="mt-1 w-5 h-5 text-blue-600 border-gray-300 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  />
                  <label
                    htmlFor={`${configuredQuestion.id}-${option.value}`}
                    className="flex-1 ml-3 cursor-pointer"
                  >
                    <span className="text-base font-medium text-gray-900">{option.label}</span>
                  </label>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    case 'text': {
      const price = showPrices ? calculateQuestionPrice(configuredQuestion, answer, phaseName) : 0;
      return (
        <div className="py-3">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <label htmlFor={configuredQuestion.id} className="block text-lg font-semibold text-gray-900">
                {configuredQuestion.label}
              </label>
              {configuredQuestion.helpText && (
                <p className="mt-2 text-base text-gray-600">{configuredQuestion.helpText}</p>
              )}
            </div>
            {showPrices && price > 0 && (
              <div className="ml-4 text-right">
                <div className="text-lg font-semibold text-gray-900">£{formatPrice(price)}</div>
              </div>
            )}
          </div>
          <input
            type="text"
            id={configuredQuestion.id}
            value={String(value || '')}
            onChange={(e) => onChange(e.target.value)}
            placeholder={configuredQuestion.placeholder}
            className="block w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors"
          />
        </div>
      );
    }

    default:
      return null;
  }
}

