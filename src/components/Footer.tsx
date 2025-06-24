// src/components/Footer.tsx
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
// REMOVED: No need to import or instantiate Lobster font here

const Footer: React.FC = () => {
  const footerLogoSize = 48; // Consistent sizing variable
  const footerLogoHeightClass = 'h-10'; // Logo height within footer

  return (
    // Use standard Tailwind classes for layout, background, text color, padding
    <footer className="bg-gray-800 text-gray-400 py-8">
      {/* Container to manage padding and max-width */}
      <div className="container mx-auto px-4">
        {/* Flex container for responsiveness */}
        <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-left">
          {/* Logo, Site Name, Copyright section */}
          <div className="mb-4 md:mb-0">
            <Link
              href="/"
              className="flex items-center justify-center md:justify-start space-x-2 mb-2 group"
              aria-label="GoJumpingJack Home"
            >
              <div className="flex items-center space-x-2">
                <Image
                  src="/GJJ_Jack.png"
                  alt="Go Jumping Jack Logo"
                  width={32}
                  height={32}
                  className="h-8 w-auto"
                />
                <span className="text-xl font-bold text-gray-900">Go Jumping Jack</span>
              </div>
            </Link>
            {/* Copyright text */}
            <p className="text-sm">
              © {new Date().getFullYear()} GoJumpingJack. All rights reserved.
            </p>
          </div>

          {/* Footer Navigation Links */}
          <nav className="flex flex-wrap justify-center md:justify-end space-x-4 sm:space-x-6">
            <Link
              href="/about"
              className="text-sm hover:text-white transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-offset-gray-800 focus:ring-white rounded"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="text-sm hover:text-white transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-offset-gray-800 focus:ring-white rounded"
            >
              Contact
            </Link>
            <Link
              href="/terms"
              className="text-sm hover:text-white transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-offset-gray-800 focus:ring-white rounded"
            >
              Terms
            </Link>
            {/* Add other footer links as needed */}
          </nav>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
