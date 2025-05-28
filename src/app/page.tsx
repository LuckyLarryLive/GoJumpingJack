// src/app/page.tsx
'use client'; // Still required as HomePage uses useState

import React, { useState, useEffect } from 'react'; // Import useState and useEffect

// --- Component Imports ---
// Import all the components extracted into the components directory
import SearchSection from '@/components/SearchSection';
import FlightResults from '@/components/FlightResults';
import TrendingDestinationsSection from '@/components/TrendingDestinationsSection';
import HowItWorksSection from '@/components/HowItWorksSection';

// --- Type Imports ---
// Import the necessary types from the central types file
import type { SearchParamsType } from '@/types';

// --- Main Page Component ---
export default function HomePage() {
  // Set default search params for initial load (show top 3 flights for a default route)
  const defaultSearchParams: SearchParamsType = {
    originAirport: 'LHR',
    destinationAirport: 'HND',
    departureDate: '2025-05-20',
    adults: 1,
    cabinClass: 'economy',
  };
  // State to hold the current search parameters, passed between SearchSection and FlightResults
  // It's now an array, meaning multiple searches can be performed at once.
  const [searchParamsList, setSearchParamsList] = useState<SearchParamsType[]>([]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Callback function passed to SearchSection.
  // Triggered when the user submits the search form.
  const handleSearchSubmit = (paramsList: SearchParamsType[]) => {
      console.log("HomePage received search params list:", paramsList);
      // Update the state with the new search parameters array
      setSearchParamsList(paramsList);

      // Scroll the flight results section into view smoothly after submission.
      setTimeout(() => {
        const resultsElement = document.getElementById('flight-results');
        const searchElement = document.getElementById('search');
        if (resultsElement) {
            resultsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (searchElement) {
            searchElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 50);
  };

  // Render the sections of the homepage
  // The overall layout (Header, Footer, fonts, background) is handled by src/app/layout.tsx
  return (
      <> {/* Using a React Fragment as the outermost container */}
          {/* Search section - receives the submit handler and current search params */}
          {/* `initialSearchParams` is used by SearchSection to reset/prefill itself */}
          <SearchSection
               onSearchSubmit={handleSearchSubmit}
               initialSearchParams={searchParamsList[0] || defaultSearchParams}
           />

          {/* Flight results section - receives the current search params */}
          {/* It will fetch and display flights based on these params */}
          <FlightResults searchParams={searchParamsList} />

          {/* Static content sections */}
          <TrendingDestinationsSection />
          <HowItWorksSection />
      </>
  );
}