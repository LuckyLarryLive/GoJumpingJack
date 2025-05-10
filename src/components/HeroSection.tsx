import React from 'react';
import Link from 'next/link'; // Required for the Link component

const HeroSection = () => {
    return (
        <section className="py-8 bg-gradient-to-r from-blue-600 to-blue-800">
            <div className="container mx-auto px-4">
                <div className="max-w-2xl mx-auto text-center">
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                        Your Feed's 🔥 Could Fund Your Flight
                    </h1>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;