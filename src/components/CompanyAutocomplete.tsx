import { useState, useEffect, useRef } from 'react';
import { XeroCompany } from '../types/quote';
import { xeroAPI } from '../utils/api';

interface CompanyAutocompleteProps {
  value: string;
  onChange: (company: XeroCompany | null) => void;
  placeholder?: string;
  required?: boolean;
}

export function CompanyAutocomplete({
  value,
  onChange,
  placeholder = 'Search for a company...',
  required = false,
}: CompanyAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [companies, setCompanies] = useState<XeroCompany[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [_selectedCompany, setSelectedCompany] = useState<XeroCompany | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (query.length < 2) {
      setCompanies([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    debounceTimer.current = setTimeout(async () => {
      try {
        const response = await xeroAPI.searchCompanies(query);
        const results = response?.companies || [];
        setCompanies(results);
        setIsOpen(results.length > 0);
      } catch (error) {
        console.error('Error searching companies:', error);
        // Even on error, try to show empty state gracefully
        setCompanies([]);
        setIsOpen(false);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (company: XeroCompany) => {
    setSelectedCompany(company);
    setQuery(company.Name);
    setIsOpen(false);
    onChange(company);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setQuery(newValue);
    if (!newValue) {
      setSelectedCompany(null);
      onChange(null);
    }
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={handleInputChange}
        onFocus={() => {
          if (companies.length > 0) {
            setIsOpen(true);
          }
        }}
        placeholder={placeholder}
        required={required}
        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      {loading && (
        <div className="absolute right-3 top-2.5">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
        </div>
      )}
      {isOpen && companies.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {companies.map((company) => (
            <button
              key={company.ContactID}
              type="button"
              onClick={() => handleSelect(company)}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
            >
              <div className="font-medium text-gray-900">{company.Name}</div>
              {company.EmailAddress && (
                <div className="text-sm text-gray-500">{company.EmailAddress}</div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

