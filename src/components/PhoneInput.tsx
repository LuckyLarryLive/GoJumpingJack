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

  // Helper to check if a value is a valid E.164 number
  const isValidE164 = (val: string) => {
    return val && typeof val === 'string' && val.startsWith('+') && val.length > 5;
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
      // Set initial value only if valid
      if (value && itiRef.current.isValidNumber && itiRef.current.isValidNumber()) {
        itiRef.current.setNumber(value);
      }
      // Listen for country change, blur, and input
      const handleCountryChange = () => {
        if (itiRef.current) {
          const e164 = itiRef.current.getNumber();
          const isValid = itiRef.current.isValidNumber();
          console.log('[PhoneInput] countrychange:', { e164, isValid });
          if (isValid) {
            onChange(e164);
          }
        }
      };
      const handleBlur = () => {
        if (itiRef.current) {
          const e164 = itiRef.current.getNumber();
          const isValid = itiRef.current.isValidNumber();
          console.log('[PhoneInput] blur:', { e164, isValid });
          if (isValid) {
            onChange(e164);
          }
        }
      };
      const handleInput = () => {
        if (itiRef.current) {
          const e164 = itiRef.current.getNumber();
          const isValid = itiRef.current.isValidNumber();
          console.log('[PhoneInput] input:', { e164, isValid });
          if (isValid) {
            onChange(e164);
          }
        }
      };
      inputRef.current.addEventListener('countrychange', handleCountryChange);
      inputRef.current.addEventListener('blur', handleBlur);
      inputRef.current.addEventListener('input', handleInput);
      return () => {
        inputRef.current?.removeEventListener('countrychange', handleCountryChange);
        inputRef.current?.removeEventListener('blur', handleBlur);
        inputRef.current?.removeEventListener('input', handleInput);
        itiRef.current?.destroy();
      };
    }
  }, []);

  // On parent value change (reset), only setNumber if value is valid and not empty, and only on initial mount
  // After mount, do not update the input value from React

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