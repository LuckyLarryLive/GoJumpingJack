import React from 'react';

export default function DestinationPage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-4">Destination Details</h1>
      <p className="text-lg">
        Destination ID: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{params.id}</span>
      </p>
      <div className="mt-8 p-6 bg-white rounded shadow">
        <p>This is a placeholder for destination details. You can fetch and display more information about this destination using the ID above.</p>
      </div>
    </div>
  );
} 