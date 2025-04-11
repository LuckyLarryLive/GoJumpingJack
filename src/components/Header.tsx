import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Lobster } from 'next/font/google'; // Import Lobster font here

// Instantiate Lobster font (needed for the logo text)
const lobster = Lobster({
    subsets: ['latin'],
    weight: ['400'],
    variable: '--font-lobster', // Use variable if layout provides it globally
    display: 'swap',
});

const Header: React.FC = () => {
    const logoSize = 96;
    const headerHeightClass = 'h-24'; // Maintain consistent height
    const logoHeightClass = 'h-20';   // Logo height within header

    return (
        <header className={`bg-white shadow-sm sticky top-0 z-50 ${headerHeightClass}`}>
            <nav className="container mx-auto px-4 sm:px-6 lg:px-8 h-full">
                <div className={`flex justify-between items-center h-full`}>
                    <div className="flex-shrink-0 flex items-center">
                        {/* Use Link for internal navigation */}
                        <Link href="/" className="flex items-center space-x-3">
                            <Image
                                src="/gojumpingjack-logo-no-text.png"
                                alt="GoJumpingJack Logo"
                                width={logoSize}
                                height={logoSize}
                                className={`${logoHeightClass} w-auto`}
                                priority // Prioritize loading the logo
                            />
                            {/* Apply Lobster font class using the variable defined in layout */}
                            {/* Or use lobster.className if variable isn't set up in layout */}
                            <span className={`font-bold text-3xl text-gray-800 hidden sm:inline font-display`}> {/* Use generic 'font-display' if using Tailwind variable */}
                            {/* <span className={`font-bold text-3xl text-gray-800 hidden sm:inline ${lobster.className}`}> // Alternative if not using CSS var */}
                                GoJumpingJack
                            </span>
                        </Link>
                    </div>
                    <div className="flex items-center space-x-4">
                        <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
                            Login
                        </Link>
                        <Link href="/signup" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-4 rounded-md transition duration-300">
                            Sign Up
                        </Link>
                    </div>
                </div>
            </nav>
        </header>
    );
};

export default Header; // Export the component