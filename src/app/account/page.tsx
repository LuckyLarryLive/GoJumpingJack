'use client';

import { useState, useEffect } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { User } from '@/types/user';
import AirlineSearchInput from '@/components/AirlineSearchInput';
import LoyaltyProgramsInput from '@/components/LoyaltyProgramsInput';

export default function AccountPage() {
  const { user, updateProfile } = useAuthContext();
  const [formData, setFormData] = useState<Partial<User>>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [avoidedAirlines, setAvoidedAirlines] = useState<Array<{ iataCode: string; name: string }>>([]);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName,
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

      // Initialize avoided airlines if they exist
      const avoidedAirlineIataCodes = user.avoidedAirlineIataCodes || [];
      if (avoidedAirlineIataCodes.length > 0) {
        // Fetch airline names for the IATA codes
        const fetchAirlineNames = async () => {
          try {
            const response = await fetch('/api/duffel/airlines');
            if (!response.ok) throw new Error('Failed to fetch airlines');
            const data = await response.json();
            
            const airlines = avoidedAirlineIataCodes.map(iataCode => {
              const airline = data.airlines.find((a: any) => a.iataCode === iataCode);
              return {
                iataCode,
                name: airline ? airline.name : iataCode
              };
            });
            
            setAvoidedAirlines(airlines);
          } catch (error) {
            console.error('Error fetching airline names:', error);
            // Fallback to just IATA codes if we can't fetch names
            setAvoidedAirlines(avoidedAirlineIataCodes.map(iataCode => ({
              iataCode,
              name: iataCode
            })));
          }
        };
        
        fetchAirlineNames();
      }
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
    const newIataCodes = [...(formData.avoidedAirlineIataCodes || []), iataCode];
    setFormData({
      ...formData,
      avoidedAirlineIataCodes: newIataCodes
    });
  };

  const handleRemoveAirline = (iataCode: string) => {
    // Remove airline from the list
    setAvoidedAirlines(avoidedAirlines.filter(airline => airline.iataCode !== iataCode));

    // Update form data
    const newIataCodes = (formData.avoidedAirlineIataCodes || []).filter(code => code !== iataCode);
    setFormData({
      ...formData,
      avoidedAirlineIataCodes: newIataCodes
    });
  };

  if (!user) {
    return null;
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Account Settings</h1>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
                <p className="text-green-600">{success}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Personal Information</h2>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                      First name
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      id="firstName"
                      value={formData.firstName || ''}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                      Last name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      id="lastName"
                      value={formData.lastName || ''}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={user.email}
                      disabled
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50 text-gray-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                      Phone number
                    </label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      id="phoneNumber"
                      value={formData.phoneNumber || ''}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
                      Date of birth
                    </label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      id="dateOfBirth"
                      value={formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString().split('T')[0] : ''}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: new Date(e.target.value) })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Travel Preferences</h2>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="homeAirportIataCode" className="block text-sm font-medium text-gray-700">
                      Home airport
                    </label>
                    <input
                      type="text"
                      name="homeAirportIataCode"
                      id="homeAirportIataCode"
                      value={formData.homeAirportIataCode || ''}
                      onChange={(e) => setFormData({ ...formData, homeAirportIataCode: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="defaultCabinClass" className="block text-sm font-medium text-gray-700">
                      Default cabin class
                    </label>
                    <select
                      id="defaultCabinClass"
                      name="defaultCabinClass"
                      value={formData.defaultCabinClass || ''}
                      onChange={(e) => setFormData({ ...formData, defaultCabinClass: e.target.value as any })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="">Select cabin class</option>
                      <option value="economy">Economy</option>
                      <option value="premium_economy">Premium Economy</option>
                      <option value="business">Business</option>
                      <option value="first">First</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="defaultAdultPassengers" className="block text-sm font-medium text-gray-700">
                      Default adults
                    </label>
                    <input
                      type="number"
                      name="defaultAdultPassengers"
                      id="defaultAdultPassengers"
                      min="1"
                      max="9"
                      value={formData.defaultAdultPassengers || ''}
                      onChange={(e) => setFormData({ ...formData, defaultAdultPassengers: parseInt(e.target.value) })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="defaultChildPassengers" className="block text-sm font-medium text-gray-700">
                      Default children
                    </label>
                    <input
                      type="number"
                      name="defaultChildPassengers"
                      id="defaultChildPassengers"
                      min="0"
                      max="9"
                      value={formData.defaultChildPassengers || ''}
                      onChange={(e) => setFormData({ ...formData, defaultChildPassengers: parseInt(e.target.value) })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="defaultInfantPassengers" className="block text-sm font-medium text-gray-700">
                      Default infants
                    </label>
                    <input
                      type="number"
                      name="defaultInfantPassengers"
                      id="defaultInfantPassengers"
                      min="0"
                      max="9"
                      value={formData.defaultInfantPassengers || ''}
                      onChange={(e) => setFormData({ ...formData, defaultInfantPassengers: parseInt(e.target.value) })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="mt-6">
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

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loyalty Programs
                  </label>
                  <LoyaltyProgramsInput
                    value={formData.loyaltyPrograms || []}
                    onChange={(programs) => setFormData({ ...formData, loyaltyPrograms: programs })}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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