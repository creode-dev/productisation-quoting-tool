import { useState, useEffect } from 'react';
import { Question } from '../types/quote';

interface SharedVariableEditorProps {
  isOpen: boolean;
  onClose: () => void;
  question: Question;
  currentValue: number | string | boolean | undefined;
  onSave: (value: number | string | boolean) => void;
}

export function SharedVariableEditor({
  isOpen,
  onClose,
  question,
  currentValue,
  onSave
}: SharedVariableEditorProps) {
  const [value, setValue] = useState<string | number | boolean>(currentValue ?? question.defaultValue ?? '');

  // Update local value when currentValue changes
  useEffect(() => {
    if (currentValue !== undefined) {
      setValue(currentValue);
    } else if (question.defaultValue !== undefined) {
      setValue(question.defaultValue);
    }
  }, [currentValue, question.defaultValue]);

  if (!isOpen) return null;

  const handleSave = () => {
    // Convert value to appropriate type based on question type
    let convertedValue: number | string | boolean;
    
    if (question.type === 'number' || question.type === 'range') {
      const numValue = typeof value === 'number' ? value : parseInt(String(value), 10);
      if (isNaN(numValue)) {
        alert('Please enter a valid number');
        return;
      }
      // Validate range
      if (question.min !== undefined && numValue < question.min) {
        alert(`Minimum value is ${question.min}`);
        return;
      }
      if (question.max !== undefined && numValue > question.max) {
        alert(`Maximum value is ${question.max}`);
        return;
      }
      convertedValue = numValue;
    } else if (question.type === 'binary') {
      convertedValue = value === true || value === 'true' || String(value).toLowerCase() === 'true';
    } else {
      convertedValue = String(value);
    }
    
    onSave(convertedValue);
    onClose();
  };

  const handleCancel = () => {
    // Reset to original value
    setValue(currentValue ?? question.defaultValue ?? '');
    onClose();
  };

  const renderInput = () => {
    switch (question.type) {
      case 'number':
      case 'range': {
        const min = question.min ?? 0;
        const max = question.max ?? 1000;
        const numValue = typeof value === 'number' ? value : parseInt(String(value || min), 10);
        
        return (
          <input
            type="number"
            value={numValue}
            onChange={(e) => {
              const val = e.target.value === '' ? min : parseInt(e.target.value, 10);
              if (!isNaN(val)) {
                setValue(val);
              }
            }}
            min={min}
            max={max}
            className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          />
        );
      }
      
      case 'binary':
        return (
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={value === true || value === 'true'}
                onChange={(e) => setValue(e.target.checked)}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-base text-gray-900">Yes</span>
            </label>
          </div>
        );
      
      case 'select':
        return (
          <div className="space-y-2">
            {question.options?.map((option) => (
              <label
                key={option.value}
                className="flex items-center space-x-2 cursor-pointer p-2 hover:bg-gray-50 rounded"
              >
                <input
                  type="radio"
                  name="shared-var-option"
                  value={option.value}
                  checked={String(value) === option.value}
                  onChange={(e) => setValue(e.target.value)}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-base text-gray-900">{option.label}</span>
              </label>
            ))}
          </div>
        );
      
      case 'text':
        return (
          <input
            type="text"
            value={String(value || '')}
            onChange={(e) => setValue(e.target.value)}
            className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={handleCancel}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10">
                <svg
                  className="h-6 w-6 text-yellow-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">
                  Edit Shared Variable
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-red-600 font-medium mb-4">
                    ⚠️ Warning: Editing this value will update all references across all phases.
                  </p>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {question.label}
                    </label>
                    {question.helpText && (
                      <p className="text-sm text-gray-600 mb-2">{question.helpText}</p>
                    )}
                    {renderInput()}
                    {(question.type === 'number' || question.type === 'range') && question.min !== undefined && question.max !== undefined && (
                      <p className="mt-2 text-xs text-gray-500">
                        Range: {question.min} - {question.max}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={handleSave}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Update All
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}





