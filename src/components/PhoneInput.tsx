import React, { useEffect, useRef, useState } from 'react';
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
  // Local state for the displayed (national) value
  const [displayValue, setDisplayValue] = useState('');

  // Initialize intl-tel-input
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
        let national = '';
        if (typeof window !== 'undefined' && (window as any).intlTelInputUtils) {
          national = itiRef.current.getNumber((window as any).intlTelInputUtils.numberFormat.NATIONAL);
        } else {
          national = itiRef.current.getNumber();
        }
        setDisplayValue(national || '');
      }

      // Listen for changes
      const handleChange = () => {
        if (itiRef.current) {
          let e164 = itiRef.current.getNumber();
          let national = '';
          if (typeof window !== 'undefined' && (window as any).intlTelInputUtils) {
            national = itiRef.current.getNumber((window as any).intlTelInputUtils.numberFormat.NATIONAL);
          } else {
            national = itiRef.current.getNumber();
          }
          setDisplayValue(national || '');
          onChange(e164 || '');
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

  // Keep intl-tel-input in sync if parent value changes (e.g., form reset)
  useEffect(() => {
    if (itiRef.current && value !== itiRef.current.getNumber()) {
      itiRef.current.setNumber(value);
      let national = '';
      if (typeof window !== 'undefined' && (window as any).intlTelInputUtils) {
        national = itiRef.current.getNumber((window as any).intlTelInputUtils.numberFormat.NATIONAL);
      } else {
        national = itiRef.current.getNumber();
      }
      setDisplayValue(national || '');
    }
  }, [value]);

  // Handle manual typing (keep displayValue in sync)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayValue(e.target.value);
    // Let intl-tel-input parse and format the value
    if (itiRef.current) {
      itiRef.current.setNumber(e.target.value);
      let e164 = itiRef.current.getNumber();
      onChange(e164 || '');
    }
  };

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
        value={displayValue}
        onChange={handleInputChange}
      />
      {error && <div className="text-red-600 text-xs mt-1">{error}</div>}
    </div>
  );
};

export default PhoneInput; 