import React from 'react';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  label?: string;
  id?: string;
  error?: string;
}

// Phone number formatting helper
function formatUSPhoneNumber(value: string): string {
  // Remove all non-digit characters
  let digits = value.replace(/\D/g, '');

  // If starts with 1 and length > 10, remove the leading 1
  if (digits.length > 10 && digits[0] === '1') {
    digits = digits.slice(1);
  }

  // Only keep the last 10 digits
  digits = digits.slice(-10);

  if (digits.length === 0) return '';

  let formatted = '+1 ';
  if (digits.length <= 3) {
    formatted += `(${digits}`;
  } else if (digits.length <= 6) {
    formatted += `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  } else {
    formatted += `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
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
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const formattedValue = formatUSPhoneNumber(inputValue);
    onChange(formattedValue);
  };

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-base sm:text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <input
        id={id}
        type="tel"
        required={required}
        className={`appearance-none block w-full max-w-full px-4 py-3 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm`}
        autoComplete="tel"
        value={value}
        onChange={handleChange}
        placeholder="e.g. +1 (555) 123-4567"
      />
      {error && <div className="text-red-600 text-xs mt-1">{error}</div>}
    </div>
  );
};

export default PhoneInput;
