'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthContext } from '@/contexts/AuthContext';
import { SignupStep1, SignupStep2 } from '@/types/user';
import AirlineSearchInput from '@/components/AirlineSearchInput';
import LoyaltyProgramsInput from '@/components/LoyaltyProgramsInput';

export default function SignupPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [error, setError] = useState('');
  const [step1Data, setStep1Data] = useState<SignupStep1>({
    email: '',
    password: '',
    passwordConfirmation: '',
  });
  const [step2Data, setStep2Data] = useState<SignupStep2>({
    firstName: '',
    lastName: '',
    dateOfBirth: new Date(),
    phoneNumber: '',
    homeAirportIataCode: null,
    avoidedAirlineIataCodes: null,
    defaultCabinClass: null,
    defaultAdultPassengers: null,
    defaultChildPassengers: null,
    defaultInfantPassengers: null,
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

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await signup(2, step2Data);
      router.push('/account');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete profile');
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
    setStep2Data({
      ...step2Data,
      avoidedAirlineIataCodes: newIataCodes
    });
  };

  const handleRemoveAirline = (iataCode: string) => {
    // Remove airline from the list
    setAvoidedAirlines(avoidedAirlines.filter(airline => airline.iataCode !== iataCode));

    // Update form data
    const newIataCodes = (step2Data.avoidedAirlineIataCodes || []).filter(code => code !== iataCode);
    setStep2Data({
      ...step2Data,
      avoidedAirlineIataCodes: newIataCodes
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {step === 1 ? 'Create your account' : 'Complete your profile'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleStep1Submit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
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
                    onChange={(e) => setStep1Data({ ...step1Data, email: e.target.value })}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="relative">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1 relative">
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
                    className={`appearance-none block w-full px-3 py-2 border ${passwordError ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    aria-label="Show password"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-700"
                    onMouseDown={() => setShowPassword(true)}
                    onMouseUp={() => setShowPassword(false)}
                    onMouseLeave={() => setShowPassword(false)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12s3.75-7.5 9.75-7.5 9.75 7.5 9.75 7.5-3.75 7.5-9.75 7.5S2.25 12 2.25 12z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                    </svg>
                  </button>
                  <p className="text-xs text-gray-500 mt-1">
                    Password must be at least 12 characters and include uppercase, lowercase, a number, and a special character.
                  </p>
                  {passwordError && (
                    <div className="absolute left-0 mt-2 bg-red-100 border border-red-400 text-red-700 px-3 py-1 rounded shadow text-xs z-10">
                      {passwordError}
                    </div>
                  )}
                </div>
              </div>

              <div className="relative">
                <label htmlFor="passwordConfirmation" className="block text-sm font-medium text-gray-700">
                  Confirm password
                </label>
                <div className="mt-1 relative">
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
                    className={`appearance-none block w-full px-3 py-2 border ${error === 'Jack says your passwords need to match' ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    aria-label="Show password confirmation"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-700"
                    onMouseDown={() => setShowPasswordConfirm(true)}
                    onMouseUp={() => setShowPasswordConfirm(false)}
                    onMouseLeave={() => setShowPasswordConfirm(false)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12s3.75-7.5 9.75-7.5 9.75 7.5 9.75 7.5-3.75 7.5-9.75 7.5S2.25 12 2.25 12z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                    </svg>
                  </button>
                  {error === 'Jack says your passwords need to match' && (
                    <div className="absolute left-0 mt-2 bg-red-100 border border-red-400 text-red-700 px-3 py-1 rounded shadow text-xs z-10">
                      {error}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Continue
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleStep2Submit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
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
                      onChange={(e) => setStep2Data({ ...step2Data, firstName: e.target.value })}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
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
                      onChange={(e) => setStep2Data({ ...step2Data, lastName: e.target.value })}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
                  Date of birth
                </label>
                <div className="mt-1">
                  <input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    required
                    value={step2Data.dateOfBirth ? new Date(step2Data.dateOfBirth).toISOString().split('T')[0] : ''}
                    onChange={(e) => setStep2Data({ ...step2Data, dateOfBirth: new Date(e.target.value) })}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                  Phone number
                </label>
                <div className="mt-1">
                  <input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    autoComplete="tel"
                    required
                    value={step2Data.phoneNumber}
                    onChange={(e) => setStep2Data({ ...step2Data, phoneNumber: e.target.value })}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="homeAirportIataCode" className="block text-sm font-medium text-gray-700">
                  Home airport (IATA code)
                </label>
                <div className="mt-1">
                  <input
                    id="homeAirportIataCode"
                    name="homeAirportIataCode"
                    type="text"
                    maxLength={3}
                    value={step2Data.homeAirportIataCode || ''}
                    onChange={(e) => setStep2Data({ ...step2Data, homeAirportIataCode: e.target.value.toUpperCase() })}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Airlines to avoid
                </label>
                <div className="space-y-4">
                  <AirlineSearchInput
                    id="airline-search"
                    label="Search airlines"
                    placeholder="Search for an airline"
                    onAirlineSelect={handleAirlineSelect}
                  />
                  
                  {avoidedAirlines.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Selected airlines:</h3>
                      <div className="flex flex-wrap gap-2">
                        {avoidedAirlines.map((airline) => (
                          <div
                            key={airline.iataCode}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                          >
                            {airline.name}
                            <button
                              type="button"
                              onClick={() => handleRemoveAirline(airline.iataCode)}
                              className="ml-2 text-blue-600 hover:text-blue-800"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="defaultCabinClass" className="block text-sm font-medium text-gray-700">
                  Default cabin class
                </label>
                <div className="mt-1">
                  <select
                    id="defaultCabinClass"
                    name="defaultCabinClass"
                    value={step2Data.defaultCabinClass || ''}
                    onChange={(e) => setStep2Data({ ...step2Data, defaultCabinClass: e.target.value as any })}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="">Select cabin class</option>
                    <option value="economy">Economy</option>
                    <option value="premium_economy">Premium Economy</option>
                    <option value="business">Business</option>
                    <option value="first">First</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <div>
                  <label htmlFor="defaultAdultPassengers" className="block text-sm font-medium text-gray-700">
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
                      onChange={(e) => setStep2Data({ ...step2Data, defaultAdultPassengers: parseInt(e.target.value) })}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="defaultChildPassengers" className="block text-sm font-medium text-gray-700">
                    Default children
                  </label>
                  <div className="mt-1">
                    <input
                      id="defaultChildPassengers"
                      name="defaultChildPassengers"
                      type="number"
                      min="0"
                      max="9"
                      value={step2Data.defaultChildPassengers || ''}
                      onChange={(e) => setStep2Data({ ...step2Data, defaultChildPassengers: parseInt(e.target.value) })}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="defaultInfantPassengers" className="block text-sm font-medium text-gray-700">
                    Default infants
                  </label>
                  <div className="mt-1">
                    <input
                      id="defaultInfantPassengers"
                      name="defaultInfantPassengers"
                      type="number"
                      min="0"
                      max="9"
                      value={step2Data.defaultInfantPassengers || ''}
                      onChange={(e) => setStep2Data({ ...step2Data, defaultInfantPassengers: parseInt(e.target.value) })}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loyalty Programs
                </label>
                <LoyaltyProgramsInput
                  value={step2Data.loyaltyPrograms || []}
                  onChange={(programs) => setStep2Data({ ...step2Data, loyaltyPrograms: programs })}
                />
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
                <span className="px-2 bg-white text-gray-500">
                  {step === 1 ? 'Already have an account?' : 'Need to go back?'}
                </span>
              </div>
            </div>

            <div className="mt-6">
              {step === 1 ? (
                <Link
                  href="/login"
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Sign in
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Back to step 1
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 