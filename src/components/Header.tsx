'use client';

// src/components/Header.tsx
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuthContext } from '@/contexts/AuthContext';
// REMOVED: No need to import or instantiate Lobster font here

const Header: React.FC = () => {
  const { user, logout } = useAuthContext();
  const logoSize = 96; // Maintain consistent sizing variable if desired
  const headerHeightClass = 'h-24'; // Consistent header height
  const logoHeightClass = 'h-20'; // Logo height within header

  return (
    // Use standard Tailwind classes for layout, background, shadow, position
    <header className={`bg-white shadow-sm sticky top-0 z-50 ${headerHeightClass}`}>
      {/* Container to manage padding and max-width */}
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8 h-full">
        {/* Flex container for logo and navigation links */}
        <div className="flex justify-between items-center h-full">
          {/* Logo and Site Name section */}
          <div className="flex-shrink-0 flex items-center">
            <Link
              href="/"
              className="flex items-center space-x-3 group"
              aria-label="GoJumpingJack Home"
            >
              <Image
                src="/GJJ_Jack_black.png"
                alt="GoJumpingJack Logo"
                width={logoSize}
                height={logoSize}
                className={`${logoHeightClass} w-auto transition-transform duration-300 group-hover:scale-105`} // Added hover effect
                priority // Prioritize loading logo image
              />
              {/* Site Name - Apply font-display class directly */}
              <span
                className="font-bold text-3xl text-gray-800 hidden sm:inline"
                style={{ fontFamily: 'var(--font-lobster)' }}
              >
                GoJumpingJack
              </span>
            </Link>
          </div>

          {/* User section */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <Link
                  href="/account"
                  className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                >
                  <span>Welcome, {user.firstName}</span>
                  <div className="flex items-center space-x-1 bg-blue-50 px-2 py-1 rounded-full">
                    {/* Luggage/Suitcase icon */}
                    <svg className="h-4 w-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 6V4c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v2h3c1.1 0 2 .9 2 2v10c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V8c0-1.1.9-2 2-2h3zm2-2v2h4V4h-4zm-5 6v8h14V10H5z"/>
                    </svg>
                    <span className="text-blue-600 font-semibold">{user.siteRewardsTokens || 0}</span>
                  </div>
                </Link>
                <button
                  onClick={async () => {
                    try {
                      await logout();
                    } catch (error) {
                      console.error('Logout error:', error);
                    }
                  }}
                  className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/login"
                  className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-4 rounded-md transition duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
