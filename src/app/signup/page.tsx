'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthContext } from '@/contexts/AuthContext';
import { SignupStep1, SignupStep2 } from '@/types/user';
import AirlineSearchInput from '@/components/AirlineSearchInput';
import LoyaltyProgramsInput from '@/components/LoyaltyProgramsInput';
import AirportSearchInput from '@/components/AirportSearchInput';
import PhoneInput from '@/components/PhoneInput';

export default function SignupPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [error, setError] = useState('');
  const [step1Data, setStep1Data] = useState<SignupStep1>({
    email: '',
    password: '',
    passwordConfirmation: '',
  });
  const [step2Data, setStep2Data] = useState<Omit<SignupStep2, 'dateOfBirth'> & { dateOfBirth: Date | null }>({
    firstName: '',
    lastName: '',
    dateOfBirth: null,
    phoneNumber: '',
    homeAirportIataCode: null,
    avoidedAirlineIataCodes: null,
    defaultCabinClass: null,
    defaultAdultPassengers: 1,
    defaultChildPassengers: 0,
    defaultInfantPassengers: 0,
    loyaltyPrograms: null,
  });
  const [avoidedAirlines, setAvoidedAirlines] = useState<Array<{ iataCode: string; name: string }>>([]);
  const { signup } = useAuthContext();
  const router = useRouter();
  const [passwordError, setPasswordError] = useState('');
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const passwordConfirmInputRef = useRef<HTMLInputElement>(null);
  const [homeAirportDisplay, setHomeAirportDisplay] = useState<string | null>(null);
  const [phoneNumberError, setPhoneNumberError] = useState('');

  // Password validation regex (same as schema)
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;

  const validatePassword = (password: string) => {
    return passwordRegex.test(password);
  };

  const handlePasswordBlur = () => {
    setPasswordTouched(true);
    if (!validatePassword(step1Data.password)) {
      setPasswordError("Jack says your password needs attention");
    } else {
      setPasswordError('');
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStep1Data({ ...step1Data, password: e.target.value });
    if (passwordTouched) {
      if (!validatePassword(e.target.value)) {
        setPasswordError("Jack says your password needs attention");
      } else {
        setPasswordError('');
      }
    }
  };

  const handlePasswordConfirmBlur = () => {
    if (step1Data.password !== step1Data.passwordConfirmation) {
      setError("Jack says your passwords need to match");
      if (passwordInputRef.current) passwordInputRef.current.classList.add('border-red-500');
      if (passwordConfirmInputRef.current) passwordConfirmInputRef.current.classList.add('border-red-500');
    } else {
      setError('');
      if (passwordInputRef.current) passwordInputRef.current.classList.remove('border-red-500');
      if (passwordConfirmInputRef.current) passwordConfirmInputRef.current.classList.remove('border-red-500');
    }
  };

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setPasswordTouched(true);

    // Check password validity
    if (!validatePassword(step1Data.password)) {
      setPasswordError("Jack says your password needs attention");
      if (passwordInputRef.current) passwordInputRef.current.classList.add('border-red-500');
      return;
    } else {
      setPasswordError('');
      if (passwordInputRef.current) passwordInputRef.current.classList.remove('border-red-500');
    }

    // Check passwords match
    if (step1Data.password !== step1Data.passwordConfirmation) {
      setError("Jack says your passwords need to match");
      if (passwordInputRef.current) passwordInputRef.current.classList.add('border-red-500');
      if (passwordConfirmInputRef.current) passwordConfirmInputRef.current.classList.add('border-red-500');
      return;
    } else {
      setError('');
      if (passwordInputRef.current) passwordInputRef.current.classList.remove('border-red-500');
      if (passwordConfirmInputRef.current) passwordConfirmInputRef.current.classList.remove('border-red-500');
    }

    // Check if email already exists
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 1, data: step1Data }),
      });
      const result = await res.json();
      if (!res.ok && result.error === 'Email already registered') {
        setError('Jack says this email is already registered.');
        setStep1Data({ email: '', password: '', passwordConfirmation: '' });
        setPasswordError('');
        setPasswordTouched(false);
        if (passwordInputRef.current) passwordInputRef.current.classList.remove('border-red-500');
        if (passwordConfirmInputRef.current) passwordConfirmInputRef.current.classList.remove('border-red-500');
        return;
      } else if (!res.ok) {
        setError(result.error || 'Failed to create account');
        return;
      }
      setStep(2);
    } catch (err) {
      setError('Failed to create account');
    }
  };

  // Phone number formatting helper
  function formatUSPhoneNumber(value: string) {
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

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    console.log('Submitting form...');

    let dateOfBirthValue: Date | null = null;
    if (step2Data.dateOfBirth instanceof Date && !isNaN(step2Data.dateOfBirth.getTime())) {
      dateOfBirthValue = step2Data.dateOfBirth;
    } else if (typeof step2Data.dateOfBirth === 'string') {
      const d = new Date(step2Data.dateOfBirth);
      if (!isNaN(d.getTime())) {
        dateOfBirthValue = d;
      } else {
        dateOfBirthValue = null;
      }
    } else {
      dateOfBirthValue = null;
    }

    const validPhone = step2Data.phoneNumber && typeof step2Data.phoneNumber === 'string' && step2Data.phoneNumber.startsWith('+') && step2Data.phoneNumber.length > 5;
    if (!step2Data.phoneNumber) {
      setPhoneNumberError('Phone number is required');
      setError('Phone number is required');
      return;
    }
    if (!validPhone) {
      setPhoneNumberError('Please enter a valid phone number.');
      setError('Please enter a valid phone number.');
      return;
    }
    if (phoneNumberError) {
      setError(phoneNumberError);
      return;
    }
    if (!dateOfBirthValue) {
      console.log('Validation failed: date of birth missing or invalid');
      setError('Date of birth is required');
      return;
    }
    if (!step2Data.firstName) {
      console.log('Validation failed: first name missing');
      setError('First name is required');
      return;
    }
    if (!step2Data.lastName) {
      console.log('Validation failed: last name missing');
      setError('Last name is required');
      return;
    }
    if (!step2Data.homeAirportIataCode) {
      console.log('Validation failed: home airport missing');
      setError('Home airport is required');
      return;
    }

    let homeAirportIataCode = step2Data.homeAirportIataCode;
    if (typeof homeAirportIataCode === 'string' && homeAirportIataCode.includes(',')) {
      homeAirportIataCode = homeAirportIataCode.split(',')[0];
    }

    try {
      console.log('Signup payload:', { ...step2Data, dateOfBirth: dateOfBirthValue, homeAirportIataCode });
      await signup(2, { ...step2Data, dateOfBirth: dateOfBirthValue, homeAirportIataCode });
      router.push('/account');
    } catch (err) {
      // Try to parse backend error for user-friendly display
      let msg = 'Failed to complete profile';
      if (err && typeof err === 'object' && 'message' in err) {
        try {
          const parsed = JSON.parse((err as any).message);
          if (Array.isArray(parsed)) {
            msg = parsed.map((e: any) => e.message || JSON.stringify(e)).join(' ');
          } else if (typeof parsed === 'object' && parsed.message) {
            msg = parsed.message;
          } else {
            msg = (err as any).message;
          }
        } catch {
          msg = (err as any).message;
        }
      }
      setError(msg);
    }
  };

  const handleAirlineSelect = (iataCode: string | null, displayValue: string | null) => {
    if (!iataCode || !displayValue) return;

    // Check if airline is already in the list
    if (avoidedAirlines.some(airline => airline.iataCode === iataCode)) {
      return;
    }

    // Add new airline to the list
    const newAirline = {
      iataCode,
      name: displayValue
    };
    setAvoidedAirlines([...avoidedAirlines, newAirline]);

    // Update form data
    const newIataCodes = [...(step2Data.avoidedAirlineIataCodes || []), iataCode];
    setStep2Data(prev => ({ ...prev, avoidedAirlineIataCodes: newIataCodes }));
  };

  const handleRemoveAirline = (iataCode: string) => {
    // Remove airline from the list
    setAvoidedAirlines(avoidedAirlines.filter(airline => airline.iataCode !== iataCode));

    // Update form data
    const newIataCodes = (step2Data.avoidedAirlineIataCodes || []).filter(code => code !== iataCode);
    setStep2Data(prev => ({ ...prev, avoidedAirlineIataCodes: newIataCodes }));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-6 px-2 sm:px-6 lg:px-8">
      <div className="sm:mx-auto w-full max-w-md">
        <h2 className="mt-6 text-center text-2xl sm:text-3xl font-extrabold text-gray-900">
          {step === 1 ? 'Create your account' : 'Complete your profile'}
        </h2>
      </div>

      <div className="mt-6 sm:mx-auto w-full max-w-md">
        <div className="bg-white py-6 px-2 sm:px-6 shadow rounded-lg sm:rounded-xl overflow-x-auto">
          {error && error !== 'Jack says your passwords need to match' && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg max-w-full break-words">
              <p className="text-red-600 text-base sm:text-sm">{error}</p>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleStep1Submit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-base sm:text-sm font-medium text-gray-700 mb-2">
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={step1Data.email}
                    onChange={(e) => {
                      setStep1Data({ ...step1Data, email: e.target.value });
                      if (error === 'Jack says this email is already registered.') setError('');
                    }}
                    className="appearance-none block w-full max-w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-base sm:text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                {passwordError && (
                  <div className="ml-0 mb-2 bg-red-100 border border-red-400 text-red-700 px-3 py-1 rounded-lg shadow text-xs z-10 max-w-full break-words">
                    {passwordError}
                  </div>
                )}
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    ref={passwordInputRef}
                    value={step1Data.password}
                    onChange={handlePasswordChange}
                    onBlur={handlePasswordBlur}
                    className={`appearance-none block w-full px-4 py-3 border ${passwordError ? 'border-red-500' : 'border-gray-300'} rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm`}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    aria-label="Show password"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                    onMouseDown={() => setShowPassword(true)}
                    onMouseUp={() => setShowPassword(false)}
                    onMouseLeave={() => setShowPassword(false)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12s3.75-7.5 9.75-7.5 9.75 7.5 9.75 7.5-3.75 7.5-9.75 7.5S2.25 12 2.25 12z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                    </svg>
                  </button>
                </div>
                <p className="text-xs sm:text-xs text-gray-500 mt-2 max-w-full break-words">
                  Password must be at least 12 characters and include uppercase, lowercase, a number, and a special character.
                </p>
              </div>

              <div>
                <label htmlFor="passwordConfirmation" className="block text-base sm:text-sm font-medium text-gray-700 mb-2">
                  Confirm password
                </label>
                {error === 'Jack says your passwords need to match' && (
                  <div className="ml-0 mb-2 bg-red-100 border border-red-400 text-red-700 px-3 py-1 rounded-lg shadow text-xs z-10 max-w-full break-words">
                    {error}
                  </div>
                )}
                <div className="relative">
                  <input
                    id="passwordConfirmation"
                    name="passwordConfirmation"
                    type={showPasswordConfirm ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    ref={passwordConfirmInputRef}
                    value={step1Data.passwordConfirmation}
                    onChange={(e) => setStep1Data({ ...step1Data, passwordConfirmation: e.target.value })}
                    onBlur={handlePasswordConfirmBlur}
                    className={`appearance-none block w-full px-4 py-3 border ${error === 'Jack says your passwords need to match' ? 'border-red-500' : 'border-gray-300'} rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm`}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    aria-label="Show password confirmation"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                    onMouseDown={() => setShowPasswordConfirm(true)}
                    onMouseUp={() => setShowPasswordConfirm(false)}
                    onMouseLeave={() => setShowPasswordConfirm(false)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12s3.75-7.5 9.75-7.5 9.75 7.5 9.75 7.5-3.75 7.5-9.75 7.5S2.25 12 2.25 12z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                    </svg>
                  </button>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mt-2"
                >
                  Continue
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleStep2Submit} className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
                <div>
                  <label htmlFor="firstName" className="block text-base sm:text-sm font-medium text-gray-700 mb-2">
                    First name
                  </label>
                  <div className="mt-1">
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      autoComplete="given-name"
                      required
                      value={step2Data.firstName}
                      onChange={(e) => setStep2Data(prev => ({ ...prev, firstName: e.target.value }))}
                      className="appearance-none block w-full max-w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-base sm:text-sm font-medium text-gray-700 mb-2">
                    Last name
                  </label>
                  <div className="mt-1">
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      autoComplete="family-name"
                      required
                      value={step2Data.lastName}
                      onChange={(e) => setStep2Data(prev => ({ ...prev, lastName: e.target.value }))}
                      className="appearance-none block w-full max-w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="dateOfBirth" className="block text-base sm:text-sm font-medium text-gray-700 mb-2">
                  Date of birth
                </label>
                <div className="mt-1">
                  <input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    required
                    value={step2Data.dateOfBirth ? step2Data.dateOfBirth.toISOString().split('T')[0] : ''}
                    onChange={(e) => setStep2Data(prev => ({ ...prev, dateOfBirth: e.target.value ? new Date(e.target.value) : null }))}
                    className="appearance-none block w-full max-w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phoneNumber" className="block text-base sm:text-sm font-medium text-gray-700 mb-2">
                  Phone number
                </label>
                <div className="mt-1">
                  <PhoneInput
                    id="phoneNumber"
                    label=""
                    required
                    value={step2Data.phoneNumber || ''}
                    onChange={(val) => {
                      const valid = val && typeof val === 'string' && val.startsWith('+') && val.length > 5;
                      setStep2Data(prev => ({ ...prev, phoneNumber: val }));
                      setPhoneNumberError(valid ? '' : 'Please enter a valid phone number.');
                    }}
                    error={phoneNumberError}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="homeAirportIataCode" className="block text-base sm:text-sm font-medium text-gray-700 mb-2">
                  Home City / Airport
                </label>
                <div className="mt-1">
                  <AirportSearchInput
                    id="home-airport-search"
                    label="Search city or airport"
                    placeholder="Start typing a city or airport name"
                    onAirportSelect={(iataCode, displayValue) => {
                      setStep2Data(prev => ({ ...prev, homeAirportIataCode: iataCode }));
                      setHomeAirportDisplay(displayValue);
                    }}
                    currentValue={homeAirportDisplay}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
                <div>
                  <label htmlFor="defaultAdultPassengers" className="block text-base sm:text-sm font-medium text-gray-700 mb-2">
                    Default adults
                  </label>
                  <div className="mt-1">
                    <input
                      id="defaultAdultPassengers"
                      name="defaultAdultPassengers"
                      type="number"
                      min="1"
                      max="9"
                      value={step2Data.defaultAdultPassengers || ''}
                      onChange={(e) => setStep2Data(prev => ({ ...prev, defaultAdultPassengers: parseInt(e.target.value) }))}
                      className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="defaultChildPassengers" className="block text-base sm:text-sm font-medium text-gray-700 mb-2">
                    Default children
                  </label>
                  <div className="mt-1">
                    <input
                      id="defaultChildPassengers"
                      name="defaultChildPassengers"
                      type="number"
                      min="0"
                      max="9"
                      value={step2Data.defaultChildPassengers ?? 0}
                      onChange={(e) => setStep2Data(prev => ({ ...prev, defaultChildPassengers: parseInt(e.target.value) }))}
                      className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="defaultInfantPassengers" className="block text-base sm:text-sm font-medium text-gray-700 mb-2">
                    Default infants
                  </label>
                  <div className="mt-1">
                    <input
                      id="defaultInfantPassengers"
                      name="defaultInfantPassengers"
                      type="number"
                      min="0"
                      max="9"
                      value={step2Data.defaultInfantPassengers ?? 0}
                      onChange={(e) => setStep2Data(prev => ({ ...prev, defaultInfantPassengers: parseInt(e.target.value) }))}
                      className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm"
                    />
                  </div>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mt-2"
                >
                  Complete signup
                </button>
              </div>
            </form>
          )}

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                {step === 1 ? (
                  <span className="px-2 bg-white text-gray-500">Already have an account?</span>
                ) : null}
              </div>
            </div>
            <div className="mt-6">
              {step === 1 ? (
                <Link
                  href="/login"
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-lg shadow-sm text-base sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Sign in
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 