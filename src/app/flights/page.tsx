'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import FlightResults from '@/components/FlightResults';
import { FaFilter, FaSort } from 'react-icons/fa';

// Create a client component for the main content
function FlightsContent() {
  const searchParams = useSearchParams();
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('price');
  const [filters, setFilters] = useState({
    maxPrice: '',
    airlines: [] as string[],
    stops: [] as number[],
  });

  // Extract search parameters
  const origin = searchParams.get('origin');
  const destination = searchParams.get('destination');
  const departureDate = searchParams.get('departureDate');
  const returnDate = searchParams.get('returnDate');
  const adults = searchParams.get('adults');
  const cabinClass = searchParams.get('cabinClass');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Filters Sidebar */}
        <div className="w-full md:w-64 space-y-6">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <FaFilter className="mr-2" /> Filters
            </h2>
            
            {/* Price Filter */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Price
              </label>
              <input
                type="number"
                value={filters.maxPrice}
                onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="Enter max price"
              />
            </div>

            {/* Stops Filter */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stops
              </label>
              <div className="space-y-2">
                {[0, 1, 2].map((stop) => (
                  <label key={stop} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.stops.includes(stop)}
                      onChange={(e) => {
                        const newStops = e.target.checked
                          ? [...filters.stops, stop]
                          : filters.stops.filter((s) => s !== stop);
                        setFilters({ ...filters, stops: newStops });
                      }}
                      className="mr-2"
                    />
                    {stop === 0 ? 'Non-stop' : `${stop} stop${stop > 1 ? 's' : ''}`}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Sort Controls */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">
                Flights from {origin} to {destination}
              </h1>
              <div className="flex items-center space-x-4">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="p-2 border rounded"
                >
                  <option value="price">Price: Low to High</option>
                  <option value="duration">Duration: Shortest</option>
                  <option value="departure">Departure: Earliest</option>
                </select>
              </div>
            </div>
          </div>

          {/* Flight Results */}
          <FlightResults
            searchParams={{
              originAirport: origin || '',
              destinationAirport: destination || '',
              departureDate: departureDate || '',
              returnDate: returnDate || '',
              adults: parseInt(adults || '1', 10),
              cabinClass: cabinClass || 'economy'
            }}
            showPagination={true}
            onPageChange={setCurrentPage}
            currentPage={currentPage}
          />
        </div>
      </div>
    </div>
  );
}

// Loading component
function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    </div>
  );
}

// Main page component
export default function AllFlightsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <FlightsContent />
    </Suspense>
  );
} 