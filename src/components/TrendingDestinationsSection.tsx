import React from 'react';
import Link from 'next/link';
// import Image from 'next/image'; // Uncomment if you use Next/Image

// Define the structure for a destination item
interface Destination {
    id: number | string; // Use string if your IDs are non-numeric
    name: string;
    image: string; // Path to the image
    description: string;
}

const TrendingDestinationsSection: React.FC = () => {
    // Sample data - replace with dynamic data fetching later if needed
    const destinations: Destination[] = [
        { id: 1, name: 'Tokyo, Japan', image: '/placeholder-tokyo.jpg', description: 'Vibrant culture meets futuristic skyline.' },
        { id: 2, name: 'Paris, France', image: '/placeholder-paris.jpg', description: 'The city of love, lights, and art.' },
        { id: 3, name: 'Maui, Hawaii', image: '/placeholder-maui.jpg', description: 'Sun-kissed beaches and volcanic landscapes.' },
        { id: 4, name: 'Rome, Italy', image: '/placeholder-rome.jpg', description: 'Ancient history and delicious pasta.' },
    ];

    return (
        <section id="trending" className="py-12 md:py-16 bg-gray-100">
            <div className="container mx-auto px-4">
                <h2 className="text-3xl font-bold text-gray-800 text-center mb-10 font-serif"> {/* Example: font-serif */}
                    Trending Destinations
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                    {destinations.map((dest) => (
                        <div
                            key={dest.id}
                            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 group flex flex-col" // Added flex flex-col
                        >
                            {/* Placeholder for Image - Replace with Next/Image for optimization */}
                            <div className="w-full h-48 bg-gray-300 flex items-center justify-center text-gray-500 relative overflow-hidden">
                                {/* If using Next/Image: */}
                                {/* <Image src={dest.image} alt={dest.name} layout="fill" objectFit="cover" className="group-hover:scale-105 transition-transform duration-300" /> */}
                                <span className="z-10 relative p-2 bg-black bg-opacity-30 rounded">Image: {dest.name}</span> {/* Added background for visibility */}
                            </div>
                            <div className="p-4 md:p-6 flex flex-col flex-grow"> {/* Added flex flex-col flex-grow */}
                                <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-2 truncate">
                                    {dest.name}
                                </h3>
                                <p className="text-gray-600 text-sm mb-4 flex-grow min-h-[40px]"> {/* Added mb-4, flex-grow, min-h */}
                                    {dest.description}
                                </p>
                                {/* Make sure the destination link structure is correct */}
                                <Link
                                    href={`/destination/${dest.id}`} // Example link structure
                                    className="inline-block text-sm text-blue-600 hover:text-blue-800 font-medium group-hover:translate-x-1 transition-transform duration-200 mt-auto" // Added mt-auto
                                >
                                    Explore →
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default TrendingDestinationsSection; // Export the component