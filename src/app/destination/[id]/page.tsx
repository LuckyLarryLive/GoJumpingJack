export default function DestinationPage({ params }: any) {
  return (
    <div className="container mx-auto py-12 px-2 sm:px-4 w-full max-w-full flex flex-col items-center justify-center">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-center">Destination Details</h1>
      <p className="text-base sm:text-lg text-center">
        Destination ID: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{params.id}</span>
      </p>
      <div className="mt-8 p-4 sm:p-6 bg-white rounded shadow w-full max-w-xl">
        <p className="text-base sm:text-lg text-gray-700 text-center">This is a placeholder for destination details. You can fetch and display more information about this destination using the ID above.</p>
      </div>
    </div>
  );
} 