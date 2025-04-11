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


const Footer: React.FC = () => {
    const footerLogoSize = 48;
    const footerLogoHeightClass = 'h-10';

    return (
        <footer className="bg-gray-800 text-gray-400 py-8">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row justify-between items-center">
                    <div className="mb-4 md:mb-0 text-center md:text-left">
                        <Link href="/" className="flex items-center justify-center md:justify-start space-x-2 mb-2">
                            <Image
                                src="/gojumpingjack-logo-no-text.png"
                                alt="GoJumpingJack Logo Footer"
                                width={footerLogoSize}
                                height={footerLogoSize}
                                className={`${footerLogoHeightClass} w-auto`}
                             />
                            {/* Apply Lobster font class */}
                            <span className={`text-xl font-semibold text-gray-200 font-display`}> {/* Use generic 'font-display' if using Tailwind variable */}
                            {/* <span className={`text-xl font-semibold text-gray-200 ${lobster.className}`}> // Alternative if not using CSS var */}
                                GoJumpingJack
                            </span>
                        </Link>
                        <p className="text-sm">© {new Date().getFullYear()} GoJumpingJack. All rights reserved.</p>
                    </div>
                    <nav className="flex space-x-6">
                        <Link href="/about" className="text-sm hover:text-white transition-colors duration-200">About</Link>
                        <Link href="/contact" className="text-sm hover:text-white transition-colors duration-200">Contact</Link>
                        <Link href="/terms" className="text-sm hover:text-white transition-colors duration-200">Terms</Link>
                        {/* Add other footer links as needed */}
                    </nav>
                </div>
            </div>
        </footer>
    );
};

export default Footer; // Export the component