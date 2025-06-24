'use client';

import { useState, useEffect } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { User } from '@/types/user';

import LoyaltyProgramsInput from '@/components/LoyaltyProgramsInput';
import PhoneInput from '@/components/PhoneInput';

export default function AccountPage() {
  const { user, updateProfile } = useAuthContext();
  const [formData, setFormData] = useState<Partial<User>>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');


  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName,
        middleName: user.middleName,
        lastName: user.lastName,
        dateOfBirth: user.dateOfBirth,
        phoneNumber: user.phoneNumber,
        homeAirportIataCode: user.homeAirportIataCode,
        avoidedAirlineIataCodes: user.avoidedAirlineIataCodes,
        defaultCabinClass: user.defaultCabinClass,
        defaultAdultPassengers: user.defaultAdultPassengers,
        defaultChildPassengers: user.defaultChildPassengers,
        defaultInfantPassengers: user.defaultInfantPassengers,
        loyaltyPrograms: user.loyaltyPrograms,
      });


    }
  }, [user]);

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
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={user.email}
                      disabled
                      className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 bg-gray-50 text-gray-500 text-base sm:text-sm"
                    />
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
                        setFormData({ ...formData, dateOfBirth: new Date(e.target.value) })
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
                      Home airport
                    </label>
                    <input
                      type="text"
                      name="homeAirportIataCode"
                      id="homeAirportIataCode"
                      value={formData.homeAirportIataCode || ''}
                      onChange={e =>
                        setFormData({ ...formData, homeAirportIataCode: e.target.value })
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm"
                    />
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
                        setFormData({ ...formData, defaultCabinClass: e.target.value as any })
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
                          defaultChildPassengers: e.target.value === '' ? 0 : parseInt(e.target.value),
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
                          defaultInfantPassengers: e.target.value === '' ? 0 : parseInt(e.target.value),
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
                        onChange={programs => setFormData({ ...formData, loyaltyPrograms: programs })}
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
