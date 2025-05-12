'use client'; // Essential for components using hooks like useState, useEffect

import React, { useState, useEffect, useCallback } from 'react';
import type { SearchParamsType } from '@/types'; // Import shared type
import AirportSearchInput from './AirportSearchInput'; // Import sibling component

// Add these constants at the top of the file, after imports
const DUFFEL_CONSTRAINTS = {
  maxPassengers: 9,
  maxInfantsPerAdult: 1,
  maxBookingWindow: 365, // days
  minBookingWindow: 0, // days
  supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
  cabinClasses: [
    { value: 'economy', label: 'Economy' },
    { value: 'premium_economy', label: 'Premium Economy' },
    { value: 'business', label: 'Business' },
    { value: 'first', label: 'First' }
  ],
  maxConnections: 2,
  minConnectionTime: 30, // minutes
  maxConnectionTime: 24 * 60, // minutes
  maxOffersPerRequest: 200
};

// --- Component Props Interface ---
interface SearchSectionProps {
    onSearchSubmit: (searchParams: SearchParamsType) => void;
    initialSearchParams?: SearchParamsType;
}

// --- Search Section Component ---
const SearchSection: React.FC<SearchSectionProps> = ({ onSearchSubmit, initialSearchParams }) => {
    // State for form fields
    const [originAirportCode, setOriginAirportCode] = useState<string>('');
    const [destinationAirportCode, setDestinationAirportCode] = useState<string>('');
    const [departureDate, setDepartureDate] = useState<string>('');
    const [returnDate, setReturnDate] = useState<string>('');
    const [adults, setAdults] = useState<number>(1);
    const [isMinimized, setIsMinimized] = useState<boolean>(false);
    const [passengers, setPassengers] = useState({
        adults: 1,
        children: 0,
        infants: 0
    });
    const [cabinClass, setCabinClass] = useState<string>('economy');
    const [currency, setCurrency] = useState<string>('USD');
    const [maxConnections, setMaxConnections] = useState<number>(0);
    const [error, setError] = useState<string | null>(null);
    const [backgroundImage, setBackgroundImage] = useState('/default_background.png');
    const [attribution, setAttribution] = useState<{ name: string; profileUrl: string; unsplashUrl: string } | null>(null);
    const [isFading, setIsFading] = useState(false);

    // Calculate today's date for min attribute on date inputs
    const today = new Date().toISOString().split('T')[0];

    // Initialize form with search params if provided
    useEffect(() => {
        if (initialSearchParams) {
            setOriginAirportCode(initialSearchParams.originAirport);
            setDestinationAirportCode(initialSearchParams.destinationAirport);
            setDepartureDate(initialSearchParams.departureDate);
            setReturnDate(initialSearchParams.returnDate || '');
            setAdults(initialSearchParams.adults);
            setIsMinimized(true);
            setPassengers({
                adults: initialSearchParams.adults,
                children: initialSearchParams.children || 0,
                infants: initialSearchParams.infants || 0
            });
            setCabinClass(initialSearchParams.cabinClass || 'economy');
            setCurrency(initialSearchParams.currency || 'USD');
            setMaxConnections(initialSearchParams.maxConnections || 0);
        }
    }, [initialSearchParams]);

    // Update the useEffect for fetching Unsplash image
    useEffect(() => {
        if (destinationAirportCode) {
            setIsFading(true);
            fetch(`/api/get-unsplash-image?city=${encodeURIComponent(destinationAirportCode)}`)
                .then(res => res.json())
                .then(data => {
                    if (data.imageUrl) {
                        setBackgroundImage(data.imageUrl);
                        setAttribution({
                            name: data.photographerName,
                            profileUrl: data.photographerProfileUrl,
                            unsplashUrl: data.unsplashUrl
                        });
                        // Track download
                        fetch('/api/track-unsplash-download', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ downloadLocationUrl: data.downloadLocationUrl })
                        });
                    }
                })
                .catch(err => console.error('Error fetching Unsplash image:', err))
                .finally(() => {
                    setTimeout(() => setIsFading(false), 1750); // 1.75 seconds
                });
        }
    }, [destinationAirportCode]);

    // --- Callbacks for AirportSearchInput ---
    const handleFromAirportSelect = useCallback((airportCode: string | null, _cityCode: string | null, displayValue: string | null) => {
        if (airportCode && airportCode.includes(',')) {
            // If it's a city selection with multiple airports, store the comma-separated list
            setOriginAirportCode(airportCode);
        } else {
            setOriginAirportCode(airportCode || '');
        }
    }, []);

    const handleToAirportSelect = useCallback((airportCode: string | null, _cityCode: string | null, displayValue: string | null) => {
        if (airportCode && airportCode.includes(',')) {
            // If it's a city selection with multiple airports, store the comma-separated list
            setDestinationAirportCode(airportCode);
        } else {
            setDestinationAirportCode(airportCode || '');
        }
    }, []);

    // --- Handler for Trip Type Radio Buttons ---
    const handleTripTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newTripType = event.target.value as 'round-trip' | 'one-way';
        if (newTripType === 'one-way') {
            setReturnDate(''); // Clear return date for one-way trips
        }
    };

    // --- Form Submission Handler ---
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!originAirportCode || !destinationAirportCode || !departureDate || !adults) {
            setError('Please fill in all required fields');
            return;
        }

        const originAirports = originAirportCode.split(',');
        const destinationAirports = destinationAirportCode.split(',');

        // Prepare search params for each combination
        const searchParamsList: SearchParamsType[] = [];
        originAirports.forEach(origin => {
            destinationAirports.forEach(destination => {
                const searchParams: SearchParamsType = {
                    originAirport: origin,
                    destinationAirport: destination,
                    departureDate,
                    adults,
                    children: passengers.children || undefined,
                    infants: passengers.infants || undefined,
                    cabinClass,
                    currency,
                    maxConnections,
                    fromDisplayValue: originAirportCode,
                    toDisplayValue: destinationAirportCode
                };
                if (returnDate) {
                    searchParams.returnDate = returnDate;
                }
                searchParamsList.push(searchParams);
            });
        });

        // Call onSearchSubmit with the list of search params
        searchParamsList.forEach(params => onSearchSubmit(params));
        setIsMinimized(true);
    };

    // --- Handler to Re-expand the Form ---
    const handleEditFilters = () => {
        setIsMinimized(false);
    };

    // --- Passenger Count Handlers ---
    const handlePassengerChange = (type: 'adults' | 'children' | 'infants', value: number) => {
        setPassengers(prev => {
            const newPassengers = { ...prev, [type]: value };
            // Ensure total doesn't exceed 9
            const total = newPassengers.adults + newPassengers.children + newPassengers.infants;
            if (total > 9) return prev;
            // Ensure infants don't exceed adults
            if (newPassengers.infants > newPassengers.adults) return prev;
            return newPassengers;
        });
    };

    // --- Render Logic ---

    // Minimized View
    if (isMinimized) {
        return (
            <section id="search" className="py-6 bg-gray-50" style={{ backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center', transition: 'opacity 1.75s ease-in-out', opacity: isFading ? 0 : 1 }}>
                <div className="container mx-auto px-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm max-w-6xl mx-auto" style={{ backgroundColor: 'rgba(255,255,255,0.75)' }}>
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-4">
                                    <div>
                                        <span className="text-sm text-gray-500">From</span>
                                        <p className="font-medium">{originAirportCode}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm text-gray-500">To</span>
                                        <p className="font-medium">{destinationAirportCode}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm text-gray-500">Dates</span>
                                        <p className="font-medium">
                                            {departureDate} {returnDate ? `- ${returnDate}` : '(One-way)'}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-sm text-gray-500">Passengers</span>
                                        <p className="font-medium">
                                            {adults + passengers.children} {passengers.infants > 0 ? `+ ${passengers.infants} infant` : ''}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-sm text-gray-500">Class</span>
                                        <p className="font-medium capitalize">{cabinClass.replace('_', ' ')}</p>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={handleEditFilters}
                                className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                                Edit Search
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    // Expanded View (Form)
    return (
        <section id="search" className="py-6 bg-gray-50 scroll-mt-24" style={{ backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center', transition: 'opacity 1.75s ease-in-out', opacity: isFading ? 0 : 1 }}>
            <div className="container mx-auto px-4">
                <div className="bg-white p-4 rounded-lg shadow-lg max-w-4xl mx-auto" style={{ backgroundColor: 'rgba(255,255,255,0.75)' }}>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* From Airport Input */}
                        <div>
                            <AirportSearchInput
                                id="from"
                                label="From"
                                placeholder="City or airport"
                                onAirportSelect={handleFromAirportSelect}
                            />
                        </div>
                        {/* To Airport Input */}
                        <div>
                            <AirportSearchInput
                                id="to"
                                label="To"
                                placeholder="City or airport"
                                onAirportSelect={handleToAirportSelect}
                            />
                        </div>

                        {/* Date Inputs */}
                        <div>
                            <label htmlFor="departure-date" className="block text-sm font-medium text-gray-700 mb-1">Depart</label>
                            <input
                                type="date" id="departure-date" name="departure-date" required
                                value={departureDate}
                                onChange={(e) => setDepartureDate(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                min={today}
                            />
                        </div>
                        <div>
                            <label htmlFor="return-date" className="block text-sm font-medium text-gray-700 mb-1">Return</label>
                            <input
                                type="date" id="return-date" name="return-date"
                                required={returnDate !== ''}
                                disabled={returnDate === ''}
                                value={returnDate}
                                onChange={(e) => setReturnDate(e.target.value)}
                                className={`w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${returnDate === '' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                min={departureDate || today}
                            />
                        </div>

                        {/* Passengers */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Passengers</label>
                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label className="block text-xs text-gray-500">Adults</label>
                                    <select
                                        value={adults}
                                        onChange={(e) => setAdults(parseInt(e.target.value))}
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                    >
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                            <option key={num} value={num}>{num}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500">Children</label>
                                    <select
                                        value={passengers.children}
                                        onChange={(e) => handlePassengerChange('children', parseInt(e.target.value))}
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                    >
                                        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                                            <option key={num} value={num}>{num}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500">Infants</label>
                                    <select
                                        value={passengers.infants}
                                        onChange={(e) => handlePassengerChange('infants', parseInt(e.target.value))}
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                    >
                                        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                                            <option key={num} value={num}>{num}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Cabin Class */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cabin Class</label>
                            <select
                                value={cabinClass}
                                onChange={(e) => setCabinClass(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md"
                            >
                                {DUFFEL_CONSTRAINTS.cabinClasses.map((cabin) => (
                                    <option key={cabin.value} value={cabin.value}>{cabin.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Currency */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                            <select
                                value={currency}
                                onChange={(e) => setCurrency(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md"
                            >
                                {DUFFEL_CONSTRAINTS.supportedCurrencies.map((curr) => (
                                    <option key={curr} value={curr}>
                                        {curr} ({curr === 'USD' ? '$' : curr === 'EUR' ? '€' : curr === 'GBP' ? '£' : curr === 'CAD' ? 'C$' : 'A$'})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Max Connections */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Max Connections</label>
                            <select
                                value={maxConnections}
                                onChange={(e) => setMaxConnections(parseInt(e.target.value))}
                                className="w-full p-2 border border-gray-300 rounded-md"
                            >
                                <option value="0">Non-stop only</option>
                                {Array.from({ length: DUFFEL_CONSTRAINTS.maxConnections }, (_, i) => (
                                    <option key={i + 1} value={i + 1}>
                                        Max {i + 1} {i === 0 ? 'connection' : 'connections'}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Search Button */}
                        <div className="md:col-span-2 lg:col-span-4">
                            <button
                                type="submit"
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md transition duration-300"
                            >
                                Search Flights
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            {attribution && (
                <div className="text-center text-sm text-gray-500 mt-2">
                    Photo by <a href={attribution.profileUrl} target="_blank" rel="noopener noreferrer">{attribution.name}</a> on <a href={attribution.unsplashUrl} target="_blank" rel="noopener noreferrer">Unsplash</a>
                </div>
            )}
        </section>
    );
};

export default SearchSection; // Export the component