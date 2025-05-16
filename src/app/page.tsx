// src/app/page.tsx
'use client'; // Still required as HomePage uses useState

import React, { useState } from 'react'; // Import useState

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
  // State to hold the current search parameters, passed between SearchSection and FlightResults
  // It's null initially, meaning no search has been performed yet.
  const [searchParams, setSearchParams] = useState<SearchParamsType | null>(null);

  // Callback function passed to SearchSection.
  // Triggered when the user submits the search form.
  const handleSearchSubmit = (params: SearchParamsType) => {
      console.log("HomePage received search params:", params);
      // Update the state with the new search parameters
      setSearchParams(params);

      // Scroll the flight results section into view smoothly after submission.
      // Use a small delay to allow the DOM to update if FlightResults wasn't rendered before.
      setTimeout(() => {
        const resultsElement = document.getElementById('flight-results'); // ID set on FlightResults section
        const searchElement = document.getElementById('search');      // ID set on SearchSection

        if (resultsElement) {
            // If FlightResults section exists, scroll to it
            resultsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (searchElement) {
            // Fallback: if results aren't there yet (e.g., maybe no results found), scroll to search
            searchElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        // If neither exists, no scroll happens (shouldn't occur in normal flow)
      }, 50); // Short delay (50ms) - adjust if needed
  };

  // Render the sections of the homepage
  // The overall layout (Header, Footer, fonts, background) is handled by src/app/layout.tsx
  return (
      <> {/* Using a React Fragment as the outermost container */}
          {/* Search section - receives the submit handler and current search params */}
          {/* `initialSearchParams` is used by SearchSection to reset/prefill itself */}
          <SearchSection
               onSearchSubmit={handleSearchSubmit}
               initialSearchParams={searchParams || undefined}
           />

          {/* Flight results section - receives the current search params */}
          {/* It will fetch and display flights based on these params */}
          <FlightResults searchParams={searchParams} />

          {/* Static content sections */}
          <TrendingDestinationsSection />
          <HowItWorksSection />
      </>
  );
}