'use client';

import { useRouter } from 'next/navigation';
import { FaPlane } from 'react-icons/fa';

export default function TestOfferPage() {
  const router = useRouter();

  const handleTestOffer = () => {
    // Navigate to our test offer details page
    router.push('/flights/offer/off_test_123456789');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <FaPlane className="text-4xl text-blue-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Test Flight Offer Details</h1>
          <p className="text-gray-600 mb-6">
            Click the button below to test the new flight offer details page with mock data.
          </p>
          <button
            onClick={handleTestOffer}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            View Test Offer Details
          </button>
          <div className="mt-4 text-sm text-gray-500">
            <p>This will demonstrate:</p>
            <ul className="text-left mt-2 space-y-1">
              <li>• Comprehensive flight details</li>
              <li>• Baggage allowance display</li>
              <li>• Fare conditions</li>
              <li>• Seat selection interface</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
