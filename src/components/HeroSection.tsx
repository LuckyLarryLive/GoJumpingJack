import React from 'react';
import Link from 'next/link'; // Required for the Link component

const HeroSection = () => {
    return (
        <section className="py-8 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500">
            <div className="container mx-auto px-4">
                <div className="max-w-2xl mx-auto text-center">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 font-display tracking-tight">
                        Your Feed's <span className="text-yellow-300">🔥</span> Could Fund Your Flight
                    </h1>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;