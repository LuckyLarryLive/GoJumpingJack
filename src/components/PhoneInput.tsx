import React from 'react';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  label?: string;
  id?: string;
  error?: string;
}

const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  required,
  label,
  id = 'phone-input',
  error,
}) => (
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
      onChange={e => onChange(e.target.value)}
      placeholder="e.g. +1 555-123-4567"
    />
    {error && <div className="text-red-600 text-xs mt-1">{error}</div>}
  </div>
);

export default PhoneInput;
