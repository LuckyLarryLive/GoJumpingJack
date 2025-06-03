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

  // Helper to format the input to national format
  const formatNational = () => {
    if (itiRef.current && inputRef.current) {
      let national = '';
      if (typeof window !== 'undefined' && (window as any).intlTelInputUtils) {
        national = itiRef.current.getNumber((window as any).intlTelInputUtils.numberFormat.NATIONAL);
      } else {
        national = itiRef.current.getNumber();
      }
      inputRef.current.value = national || '';
    }
  };

  // Initialize intl-tel-input once
  useEffect(() => {
    if (inputRef.current) {
      itiRef.current = intlTelInput(inputRef.current, {
        initialCountry: 'us',
        nationalMode: true,
        formatOnDisplay: true,
        utilsScript: 'https://cdn.jsdelivr.net/npm/intl-tel-input@23.0.10/build/js/utils.js',
      } as any);
      // Set initial value
      if (value) {
        itiRef.current.setNumber(value);
        formatNational();
      }
      // Listen for country change and blur
      const handleCountryChange = () => {
        if (itiRef.current) {
          const e164 = itiRef.current.getNumber();
          onChange(e164 || '');
          formatNational();
        }
      };
      const handleBlur = () => {
        if (itiRef.current) {
          const e164 = itiRef.current.getNumber();
          onChange(e164 || '');
          formatNational();
        }
      };
      inputRef.current.addEventListener('countrychange', handleCountryChange);
      inputRef.current.addEventListener('blur', handleBlur);
      return () => {
        inputRef.current?.removeEventListener('countrychange', handleCountryChange);
        inputRef.current?.removeEventListener('blur', handleBlur);
        itiRef.current?.destroy();
      };
    }
  }, []);

  // On parent value change (reset), update the input
  useEffect(() => {
    if (itiRef.current && value !== itiRef.current.getNumber()) {
      itiRef.current.setNumber(value);
      formatNational();
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