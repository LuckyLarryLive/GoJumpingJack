import React, { useState } from 'react';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  label?: string;
  id?: string;
  error?: string;
}

// Country codes and formatting patterns
const countries = [
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸', format: '(###) ###-####' },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦', format: '(###) ###-####' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧', format: '#### ### ####' },
  { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺', format: '### ### ###' },
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪', format: '### ### ####' },
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷', format: '# ## ## ## ##' },
  { code: 'JP', name: 'Japan', dialCode: '+81', flag: '🇯🇵', format: '##-####-####' },
  { code: 'CN', name: 'China', dialCode: '+86', flag: '🇨🇳', format: '### #### ####' },
  { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳', format: '##### #####' },
  { code: 'BR', name: 'Brazil', dialCode: '+55', flag: '🇧🇷', format: '(##) #####-####' },
  { code: 'MX', name: 'Mexico', dialCode: '+52', flag: '🇲🇽', format: '### ### ####' },
];

// Phone number formatting helper
function formatPhoneNumber(value: string, country: typeof countries[0]): string {
  // Remove all non-digit characters
  let digits = value.replace(/\D/g, '');

  // Remove country code if it's at the beginning
  const dialCodeDigits = country.dialCode.replace(/\D/g, '');
  if (digits.startsWith(dialCodeDigits)) {
    digits = digits.slice(dialCodeDigits.length);
  }

  if (digits.length === 0) return '';

  // Apply country-specific formatting
  let formatted = country.dialCode + ' ';
  const format = country.format;
  let digitIndex = 0;

  for (let i = 0; i < format.length && digitIndex < digits.length; i++) {
    if (format[i] === '#') {
      formatted += digits[digitIndex];
      digitIndex++;
    } else {
      formatted += format[i];
    }
  }

  // Add any remaining digits
  if (digitIndex < digits.length) {
    formatted += digits.slice(digitIndex);
  }

  return formatted.trim();
}

const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  required,
  label,
  id = 'phone-input',
  error,
}) => {
  const [selectedCountry, setSelectedCountry] = useState(countries[0]); // Default to US
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleCountrySelect = (country: typeof countries[0]) => {
    setSelectedCountry(country);
    setIsDropdownOpen(false);
    // Reformat the current value with the new country
    if (value) {
      const digits = value.replace(/\D/g, '');
      const formatted = formatPhoneNumber(digits, country);
      onChange(formatted);
    } else {
      onChange(country.dialCode + ' ');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const formatted = formatPhoneNumber(inputValue, selectedCountry);
    onChange(formatted);
  };

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-base sm:text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        <div className="flex">
          {/* Country Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center px-3 py-3 border border-r-0 border-gray-300 rounded-l-lg bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <span className="mr-2">{selectedCountry.flag}</span>
              <span className="text-sm font-medium">{selectedCountry.dialCode}</span>
              <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isDropdownOpen && (
              <div className="absolute z-10 mt-1 w-64 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {countries.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => handleCountrySelect(country)}
                    className="w-full flex items-center px-3 py-2 text-left hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                  >
                    <span className="mr-3">{country.flag}</span>
                    <span className="flex-1 text-sm">{country.name}</span>
                    <span className="text-sm text-gray-500">{country.dialCode}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Phone Number Input */}
          <input
            id={id}
            type="tel"
            required={required}
            className={`flex-1 px-4 py-3 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-r-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm`}
            autoComplete="tel"
            value={value}
            onChange={handleChange}
            placeholder={`e.g. ${selectedCountry.dialCode} ${selectedCountry.format.replace(/#/g, '0')}`}
          />
        </div>
        {error && <div className="text-red-600 text-xs mt-1">{error}</div>}
      </div>
    </div>
  );
};

export default PhoneInput;
