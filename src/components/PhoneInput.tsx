import React, { useEffect, useRef } from 'react';
import intlTelInput from 'intl-tel-input';
import 'intl-tel-input/build/css/intlTelInput.css';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  label?: string;
  id?: string;
  error?: string;
}

const PhoneInput: React.FC<PhoneInputProps> = ({ value, onChange, required, label, id = 'phone-input', error }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const itiRef = useRef<any>(null);

  useEffect(() => {
    if (inputRef.current) {
      itiRef.current = intlTelInput(inputRef.current, {
        initialCountry: 'us',
        nationalMode: false,
        formatOnDisplay: true,
        utilsScript: 'https://cdn.jsdelivr.net/npm/intl-tel-input@23.0.10/build/js/utils.js',
      } as any);
      // Set initial value
      if (value) {
        itiRef.current.setNumber(value);
      }
      // Listen for changes
      const handleChange = () => {
        if (itiRef.current) {
          const number = itiRef.current.getNumber();
          onChange(number);
        }
      };
      inputRef.current.addEventListener('countrychange', handleChange);
      inputRef.current.addEventListener('input', handleChange);
      return () => {
        inputRef.current?.removeEventListener('countrychange', handleChange);
        inputRef.current?.removeEventListener('input', handleChange);
        itiRef.current?.destroy();
      };
    }
  }, []);

  // Keep input value in sync if parent changes it
  useEffect(() => {
    if (itiRef.current && value !== itiRef.current.getNumber()) {
      itiRef.current.setNumber(value);
    }
  }, [value]);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-base sm:text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <input
        ref={inputRef}
        id={id}
        type="tel"
        required={required}
        className={`appearance-none block w-full max-w-full px-4 py-3 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm`}
        autoComplete="tel"
        defaultValue={value}
      />
      {error && <div className="text-red-600 text-xs mt-1">{error}</div>}
    </div>
  );
};

export default PhoneInput; 