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
  const [displayValue, setDisplayValue] = useState('');
  const [lastCountry, setLastCountry] = useState<string | null>(null);

  useEffect(() => {
    console.log('[PhoneInput] Mount');
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

      // Listen for country change
      const handleCountryChange = () => {
        if (itiRef.current) {
          const country = itiRef.current.getSelectedCountryData().iso2;
          setLastCountry(country);
          console.log('[PhoneInput] Country changed:', country);
          // Only set number on country change
          itiRef.current.setNumber(displayValue);
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
      inputRef.current.addEventListener('countrychange', handleCountryChange);
      return () => {
        inputRef.current?.removeEventListener('countrychange', handleCountryChange);
        itiRef.current?.destroy();
      };
    }
  }, []);

  // Keep displayValue in sync with parent value (e.g., form reset)
  useEffect(() => {
    if (itiRef.current && value !== itiRef.current.getNumber()) {
      console.log('[PhoneInput] Parent value changed:', value);
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
    if (itiRef.current) {
      // Only update E.164 value, don't call setNumber (let the user type freely)
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