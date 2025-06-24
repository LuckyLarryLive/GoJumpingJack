import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
// import Image from 'next/image'; // Uncomment if you use Next/Image

// Define the structure for a destination item
interface Destination {
  id: number | string; // Use string if your IDs are non-numeric
  city_name: string;
  country_code: string;
  description: string;
}

interface CityImage {
  city_name: string;
  country_code: string;
  unsplash_regular_url: string;
  photographer_name: string;
  photographer_profile_url: string;
  unsplash_page_url: string;
}

const DESTINATIONS: Destination[] = [
  {
    id: 3,
    city_name: 'Tokyo',
    country_code: 'JP',
    description: 'Vibrant culture meets futuristic skyline.',
  },
  {
    id: 4,
    city_name: 'Paris',
    country_code: 'FR',
    description: 'The city of love, lights, and art.',
  },
  { id: 2, city_name: 'New York', country_code: 'US', description: 'The city that never sleeps.' },
  {
    id: 5,
    city_name: 'Rome',
    country_code: 'IT',
    description: 'Ancient history and delicious pasta.',
  },
];

const TrendingDestinationsSection: React.FC = () => {
  const [cityImages, setCityImages] = useState<Record<string, CityImage>>({});

  useEffect(() => {
    async function fetchImages() {
      const cityImageMap: Record<string, CityImage> = {};
      for (const dest of DESTINATIONS) {
        const { data, error } = await supabase
          .from('city_images')
          .select('*')
          .eq('city_name', dest.city_name)
          .eq('country_code', dest.country_code)
          .limit(1);
        if (data && data.length > 0) {
          cityImageMap[`${dest.city_name}_${dest.country_code}`] = data[0];
        }
      }
      setCityImages(cityImageMap);
    }
    fetchImages();
  }, []);

  return (
    <section id="trending" className="py-12 md:py-16 bg-gray-100">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-gray-800 text-center mb-10 font-serif">
          {' '}
          {/* Example: font-serif */}
          Trending Destinations
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {DESTINATIONS.map(dest => {
            const imgKey = `${dest.city_name}_${dest.country_code}`;
            const cityImg = cityImages[imgKey];
            return (
              <div
                key={dest.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 group flex flex-col" // Added flex flex-col
              >
                {/* Placeholder for Image - Replace with Next/Image for optimization */}
                <div className="w-full h-48 bg-gray-300 flex items-center justify-center text-gray-500 relative overflow-hidden">
                  <img
                    src={cityImg?.unsplash_regular_url || '/default_background.png'}
                    alt={dest.city_name}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-4 md:p-6 flex flex-col flex-grow">
                  {' '}
                  {/* Added flex flex-col flex-grow */}
                  <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-2 truncate">
                    {dest.city_name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 flex-grow min-h-[40px]">
                    {' '}
                    {/* Added mb-4, flex-grow, min-h */}
                    {dest.description}
                  </p>
                  {cityImg && (
                    <div className="text-xs text-gray-500 mb-2 text-center">
                      Photo by{' '}
                      <a
                        href={cityImg.photographer_profile_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        {cityImg.photographer_name}
                      </a>{' '}
                      on{' '}
                      <a
                        href={cityImg.unsplash_page_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        Unsplash
                      </a>
                    </div>
                  )}
                  {/* Make sure the destination link structure is correct */}
                  <Link
                    href={`/destination/${dest.id}`} // Example link structure
                    className="inline-block text-sm text-blue-600 hover:text-blue-800 font-medium group-hover:translate-x-1 transition-transform duration-200 mt-auto" // Added mt-auto
                  >
                    Explore →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TrendingDestinationsSection; // Export the component
