import React from 'react';

// Define the structure for a step item
interface Step {
    id: number;
    title: string;
    description: string;
    icon: string; // Keeping as string since it's just displayed text '1', '2', '3'
}

const HowItWorksSection: React.FC = () => {
    // Data for the steps
    const steps: Step[] = [
        { id: 1, title: 'Search & Filter', description: 'Find deals filtering by price, dates, user ratings & more.', icon: '1' },
        { id: 2, title: 'Discover Insights', description: 'See real reviews, AI tips & gamified destination challenges.', icon: '2' },
        { id: 3, title: 'Book & Earn!', description: 'Securely book flights/hotels via partners & earn points!', icon: '3' },
    ];

    return (
        // Section styling
        <section id="how-it-works" className="py-12 md:py-16 bg-gray-50">
            <div className="container mx-auto px-4">
                {/* Section Title */}
                <h2 className="text-3xl font-bold text-gray-800 text-center mb-10 md:mb-12 font-serif"> {/* Example: font-serif */}
                    How GoJumpingJack Works
                </h2>
                {/* Grid for the steps */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                    {steps.map((step) => (
                        // Individual step card
                        <div key={step.id} className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-300 text-center">
                            {/* Icon Circle */}
                            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center ring-4 ring-blue-50">
                                <span className="text-blue-600 text-xl font-bold">{step.icon}</span>
                            </div>
                            {/* Step Title */}
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">{step.title}</h3>
                            {/* Step Description */}
                            <p className="text-gray-600 text-sm">{step.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default HowItWorksSection; // Export the component