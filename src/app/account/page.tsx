'use client';

import { useState, useEffect } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { User } from '@/types/user';

import LoyaltyProgramsInput from '@/components/LoyaltyProgramsInput';
import PhoneInput from '@/components/PhoneInput';
import AirportSearchInput from '@/components/AirportSearchInput';
import { SUPPORTED_CURRENCIES } from '@/lib/currency';

export default function AccountPage() {
  const { user, updateProfile, resendVerificationEmail } = useAuthContext();
  const [formData, setFormData] = useState<Partial<User>>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendingVerification, setResendingVerification] = useState(false);
  const [lastResendTime, setLastResendTime] = useState<number | null>(null);
  const [, setHomeAirportDisplay] = useState<string | null>(null);
  const [homeAirportInitialValue, setHomeAirportInitialValue] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName,
        middleName: user.middleName,
        lastName: user.lastName,
        preferredName: user.preferredName,
        dateOfBirth: user.dateOfBirth,
        phoneNumber: user.phoneNumber,
        homeAirportIataCode: user.homeAirportIataCode,
        avoidedAirlineIataCodes: user.avoidedAirlineIataCodes || null,
        defaultCabinClass: user.defaultCabinClass,
        defaultAdultPassengers: user.defaultAdultPassengers,
        defaultChildPassengers: user.defaultChildPassengers,
        defaultInfantPassengers: user.defaultInfantPassengers,
        loyaltyPrograms: user.loyaltyPrograms,
        preferredCurrency: user.preferredCurrency,
      });

      // Set initial timer for unverified emails (assuming verification email was sent at account creation)
      if (!user.emailVerified && !lastResendTime) {
        setLastResendTime(Date.now());
      }

      // Set home airport display value - use the stored value as the initial display
      if (user.homeAirportIataCode && !homeAirportInitialValue) {
        setHomeAirportInitialValue(user.homeAirportIataCode);
        setHomeAirportDisplay(user.homeAirportIataCode);
      }
    }
  }, [user, lastResendTime, homeAirportInitialValue]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await updateProfile(formData);
      setSuccess('Profile updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    }
  };

  const handleResendVerification = async () => {
    if (!user?.email) return;

    // Check if 10 minutes have passed since last resend
    const now = Date.now();
    if (lastResendTime && now - lastResendTime < 10 * 60 * 1000) {
      const remainingMinutes = Math.ceil((10 * 60 * 1000 - (now - lastResendTime)) / (60 * 1000));
      setError(
        `Please wait ${remainingMinutes} more minute(s) before requesting another verification email.`
      );
      return;
    }

    setResendingVerification(true);
    setError('');
    setSuccess('');

    try {
      await resendVerificationEmail(user.email);
      setSuccess('Verification email sent! Please check your inbox.');
      setLastResendTime(now);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send verification email');
    } finally {
      setResendingVerification(false);
    }
  };

  const canResendVerification = () => {
    if (!lastResendTime) return true;
    const now = Date.now();
    return now - lastResendTime >= 10 * 60 * 1000; // 10 minutes
  };

  const getResendCooldownText = () => {
    if (!lastResendTime) return '';
    const now = Date.now();
    const remainingMs = 10 * 60 * 1000 - (now - lastResendTime);
    if (remainingMs <= 0) return '';
    const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));
    return `(${remainingMinutes} min remaining)`;
  };

  if (!user) {
    return null;
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-6 px-2 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
          <div className="mx-auto w-full">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">Account Settings</h1>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg max-w-full break-words">
                <p className="text-red-600 text-base sm:text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg max-w-full break-words">
                <p className="text-green-600 text-base sm:text-sm">{success}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="bg-white shadow rounded-lg p-4 sm:p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Personal Information</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
                  <div>
                    <label
                      htmlFor="firstName"
                      className="block text-base sm:text-sm font-medium text-gray-700 mb-2"
                    >
                      First Name
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      id="firstName"
                      value={formData.firstName || ''}
                      onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="middleName"
                      className="block text-base sm:text-sm font-medium text-gray-700 mb-2"
                    >
                      Middle Name
                    </label>
                    <input
                      type="text"
                      name="middleName"
                      id="middleName"
                      value={formData.middleName || ''}
                      onChange={e => setFormData({ ...formData, middleName: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm"
                      placeholder="Optional"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="lastName"
                      className="block text-base sm:text-sm font-medium text-gray-700 mb-2"
                    >
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      id="lastName"
                      value={formData.lastName || ''}
                      onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 mt-6">
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-base sm:text-sm font-medium text-gray-700 mb-2"
                    >
                      Email
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        name="email"
                        id="email"
                        value={user.email}
                        disabled
                        className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 bg-gray-50 text-gray-500 text-base sm:text-sm pr-24"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        {user.emailVerified ? (
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                            <span className="text-xs text-green-600 font-medium">Verified</span>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                            <span className="text-xs text-yellow-600 font-medium">Unverified</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {!user.emailVerified && (
                      <div className="mt-2">
                        <button
                          type="button"
                          onClick={handleResendVerification}
                          disabled={resendingVerification || !canResendVerification()}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {resendingVerification
                            ? 'Sending...'
                            : `Resend Verification ${getResendCooldownText()}`}
                        </button>
                        <p className="text-xs text-gray-500 mt-1">
                          Please verify your email to ensure account security and receive important
                          notifications.
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="phoneNumber"
                      className="block text-base sm:text-sm font-medium text-gray-700 mb-2"
                    >
                      Phone number
                    </label>
                    <PhoneInput
                      id="phoneNumber"
                      label=""
                      required
                      value={formData.phoneNumber || ''}
                      onChange={val => setFormData({ ...formData, phoneNumber: val })}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="preferredName"
                      className="block text-base sm:text-sm font-medium text-gray-700 mb-2"
                    >
                      Preferred Name
                      <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        💡 This is what others will see
                      </span>
                    </label>
                    <input
                      type="text"
                      name="preferredName"
                      id="preferredName"
                      value={formData.preferredName || ''}
                      onChange={e => setFormData({ ...formData, preferredName: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm"
                      placeholder="e.g. Mike, Liz, etc."
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="dateOfBirth"
                      className="block text-base sm:text-sm font-medium text-gray-700 mb-2"
                    >
                      Date of birth
                    </label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      id="dateOfBirth"
                      value={
                        formData.dateOfBirth
                          ? new Date(formData.dateOfBirth).toISOString().split('T')[0]
                          : ''
                      }
                      onChange={e =>
                        setFormData({
                          ...formData,
                          dateOfBirth: e.target.value ? new Date(e.target.value) : undefined,
                        })
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white shadow rounded-lg p-4 sm:p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Travel Preferences</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
                  <div>
                    <label
                      htmlFor="homeAirportIataCode"
                      className="block text-base sm:text-sm font-medium text-gray-700 mb-2"
                    >
                      Home Airport or City
                    </label>
                    <div className="mt-1">
                      <AirportSearchInput
                        id="home-airport-search"
                        label=""
                        placeholder="Start typing a city or airport name"
                        onAirportSelect={(iataCode, displayValue, selectionType, cityName) => {
                          // Store the full display value for better UX
                          if (selectionType === 'city' && cityName) {
                            setFormData(prev => ({ ...prev, homeAirportIataCode: displayValue }));
                          } else {
                            setFormData(prev => ({ ...prev, homeAirportIataCode: displayValue }));
                          }
                          setHomeAirportDisplay(displayValue);
                        }}
                        initialDisplayValue={homeAirportInitialValue}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="defaultCabinClass"
                      className="block text-base sm:text-sm font-medium text-gray-700 mb-2"
                    >
                      Default cabin class
                    </label>
                    <select
                      id="defaultCabinClass"
                      name="defaultCabinClass"
                      value={formData.defaultCabinClass || ''}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          defaultCabinClass: e.target.value as
                            | 'economy'
                            | 'premium_economy'
                            | 'business'
                            | 'first'
                            | null,
                        })
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm"
                    >
                      <option value="">Select cabin class</option>
                      <option value="economy">Economy</option>
                      <option value="premium_economy">Premium Economy</option>
                      <option value="business">Business</option>
                      <option value="first">First</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="preferredCurrency"
                      className="block text-base sm:text-sm font-medium text-gray-700 mb-2"
                    >
                      Preferred Currency
                    </label>
                    <select
                      id="preferredCurrency"
                      name="preferredCurrency"
                      value={formData.preferredCurrency || 'USD'}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          preferredCurrency: e.target.value as
                            | 'USD'
                            | 'EUR'
                            | 'GBP'
                            | 'CAD'
                            | 'AUD'
                            | 'JPY'
                            | 'CNY'
                            | 'INR'
                            | 'BRL'
                            | 'MXN',
                        })
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm"
                    >
                      {SUPPORTED_CURRENCIES.map(currency => (
                        <option key={currency.code} value={currency.code}>
                          {currency.code} ({currency.symbol}) - {currency.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="defaultAdultPassengers"
                      className="block text-base sm:text-sm font-medium text-gray-700 mb-2"
                    >
                      Default adults
                    </label>
                    <input
                      type="number"
                      name="defaultAdultPassengers"
                      id="defaultAdultPassengers"
                      min="1"
                      max="9"
                      value={formData.defaultAdultPassengers || ''}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          defaultAdultPassengers: parseInt(e.target.value),
                        })
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="defaultChildPassengers"
                      className="block text-base sm:text-sm font-medium text-gray-700 mb-2"
                    >
                      Default children
                    </label>
                    <input
                      type="number"
                      name="defaultChildPassengers"
                      id="defaultChildPassengers"
                      min="0"
                      max="9"
                      value={formData.defaultChildPassengers ?? ''}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          defaultChildPassengers:
                            e.target.value === '' ? 0 : parseInt(e.target.value),
                        })
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="defaultInfantPassengers"
                      className="block text-base sm:text-sm font-medium text-gray-700 mb-2"
                    >
                      Default infants
                    </label>
                    <input
                      type="number"
                      name="defaultInfantPassengers"
                      id="defaultInfantPassengers"
                      min="0"
                      max="9"
                      value={formData.defaultInfantPassengers ?? ''}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          defaultInfantPassengers:
                            e.target.value === '' ? 0 : parseInt(e.target.value),
                        })
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm"
                    />
                  </div>
                </div>

                <div className="mt-6 relative">
                  <label className="block text-base sm:text-sm font-medium text-gray-400 mb-2">
                    Loyalty Programs
                  </label>
                  <div className="relative">
                    {/* Coming Soon Banner */}
                    <div className="absolute inset-0 z-10 flex items-center justify-center">
                      <div className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow-lg transform -rotate-12 font-bold text-lg">
                        Coming Soon
                      </div>
                    </div>
                    {/* Disabled/Greyed out content */}
                    <div className="opacity-30 pointer-events-none">
                      <LoyaltyProgramsInput
                        value={formData.loyaltyPrograms || []}
                        onChange={programs =>
                          setFormData({ ...formData, loyaltyPrograms: programs })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-base sm:text-sm font-medium"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
