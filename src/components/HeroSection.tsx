import React from 'react';
import Link from 'next/link'; // Required for the Link component

const HeroSection: React.FC = () => {
  return (
      // Using Tailwind classes for gradient, padding, alignment etc.
      <section className={`
          bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500
          text-white
          min-h-[45vh] flex items-center justify-center text-center
          px-4 py-12 pt-20 md:pt-24 lg:pt-28 {/* Adjust padding top as needed */}
      `}>
          <div className="max-w-4xl mx-auto">
              {/* Heading - using font-serif as an example */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-4 animate-fade-in-up font-serif">
                  Discover Real Travel Deals
              </h1>
              {/* Subheading */}
              <p className="text-lg sm:text-xl md:text-2xl text-blue-100 mb-8 animate-fade-in-up animation-delay-300">
                  Powered by real people. Backed by AI.
              </p>
              {/* Call to Action Button linking to the #search section */}
              <Link
                  href="#search" // Links to the element with id="search" (SearchSection)
                  scroll={true} // Enable smooth scrolling
                  className="
                      bg-white text-blue-600 font-bold
                      py-3 px-8 rounded-full shadow-lg
                      hover:bg-gray-100 hover:shadow-xl
                      transition duration-300 ease-in-out
                      transform hover:-translate-y-1
                      inline-block animate-fade-in-up animation-delay-600
                      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-700 focus:ring-white
                  "
               >
                  Start Exploring
              </Link>
          </div>

          {/* Animation styles using style jsx */}
          {/* These styles are scoped to this component by default */}
          <style jsx global>{`
            @keyframes fadeInUp {
              from { opacity: 0; transform: translateY(20px); }
              to { opacity: 1; transform: translateY(0); }
            }
            // Class selectors for applying the animation
            .animate-fade-in-up {
              animation: fadeInUp 0.8s ease-out forwards;
              opacity: 0; // Start hidden before animation runs
            }
            .animation-delay-300 {
              animation-delay: 0.3s;
            }
            .animation-delay-600 {
              animation-delay: 0.6s;
            }
          `}</style>
      </section>
  );
};

export default HeroSection; // Export the component